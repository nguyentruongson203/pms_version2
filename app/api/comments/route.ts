import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import db from "@/lib/db"
import { sendNotificationEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { content, task_id, project_id, parent_comment_id, mentioned_users } = body

    if (!content || (!task_id && !project_id)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Extract mentioned users from content (@username format)
    const mentionRegex = /@(\w+)/g
    const mentions = []
    let match
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1])
    }

    // Get mentioned user IDs
    let mentionedUserIds = []
    if (mentions.length > 0) {
      const [userRows] = await db.execute(
        `SELECT id, name, email FROM users WHERE name IN (${mentions.map(() => "?").join(",")})`,
        mentions,
      )
      mentionedUserIds = userRows.map((user: any) => user.id)
    }

    const [result] = await db.execute(
      `INSERT INTO comments (content, task_id, project_id, user_id, parent_comment_id, mentioned_users) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        content,
        task_id || null,
        project_id || null,
        session.user.id,
        parent_comment_id || null,
        mentionedUserIds.length > 0 ? JSON.stringify(mentionedUserIds) : null,
      ],
    )

    const commentId = (result as any).insertId

    // Get the created comment with user info
    const [commentRows] = await db.execute(
      `SELECT c.*, u.name as user_name, u.email as user_email, u.avatar_url
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [commentId],
    )

    const comment = commentRows[0] as any

    // Log activity
    if (task_id) {
      await db.execute(
        `INSERT INTO activity_logs (user_id, task_id, project_id, action, details, metadata) 
         VALUES (?, ?, (SELECT project_id FROM tasks WHERE id = ?), 'comment_added', ?, ?)`,
        [
          session.user.id,
          task_id,
          task_id,
          JSON.stringify({ comment_preview: content.substring(0, 50) }),
          JSON.stringify({
            comment_id: commentId,
            is_reply: !!parent_comment_id,
            mentioned_users: mentionedUserIds,
          }),
        ],
      )
    }

    // Send notifications to mentioned users
    if (mentionedUserIds.length > 0) {
      const [mentionedUsers] = await db.execute(
        `SELECT id, name, email FROM users WHERE id IN (${mentionedUserIds.map(() => "?").join(",")})`,
        mentionedUserIds,
      )

      for (const user of mentionedUsers as any[]) {
        if (user.id !== session.user.id) {
          // Don't notify the commenter
          // Create notification
          await db.execute(
            `INSERT INTO notifications (user_id, title, message, type, action_url, task_id, project_id, comment_id, created_by)
             VALUES (?, ?, ?, 'info', ?, ?, ?, ?, ?)`,
            [
              user.id,
              "You were mentioned in a comment",
              `${session.user.name} mentioned you in a comment`,
              task_id ? `/projects/${project_id || "unknown"}/tasks/${task_id}` : `/projects/${project_id}`,
              task_id,
              project_id,
              commentId,
              session.user.id,
            ],
          )

          // Queue email
          await sendNotificationEmail({
            to: user.email,
            name: user.name,
            subject: `You were mentioned by ${session.user.name}`,
            template: "mention_notification",
            data: {
              mentioned_by: session.user.name,
              comment_content: content,
              task_id,
              project_id,
              comment_url: task_id
                ? `${process.env.NEXTAUTH_URL}/projects/${project_id}/tasks/${task_id}#comment-${commentId}`
                : `${process.env.NEXTAUTH_URL}/projects/${project_id}#comment-${commentId}`,
            },
          })
        }
      }
    }

    // Notify task assignee if comment is on their task
    if (task_id) {
      const [taskRows] = await db.execute(
        `SELECT t.assigned_to, t.title, u.name, u.email 
         FROM tasks t 
         LEFT JOIN users u ON t.assigned_to = u.id 
         WHERE t.id = ? AND t.assigned_to IS NOT NULL AND t.assigned_to != ?`,
        [task_id, session.user.id],
      )

      if (taskRows.length > 0) {
        const assignee = taskRows[0] as any

        await db.execute(
          `INSERT INTO notifications (user_id, title, message, type, action_url, task_id, comment_id, created_by)
           VALUES (?, ?, ?, 'info', ?, ?, ?, ?)`,
          [
            assignee.assigned_to,
            "New comment on your task",
            `${session.user.name} commented on "${assignee.title}"`,
            `/projects/${project_id}/tasks/${task_id}`,
            task_id,
            commentId,
            session.user.id,
          ],
        )

        await sendNotificationEmail({
          to: assignee.email,
          name: assignee.name,
          subject: `New comment on your task: ${assignee.title}`,
          template: "task_comment",
          data: {
            commenter_name: session.user.name,
            task_title: assignee.title,
            comment_content: content,
            task_url: `${process.env.NEXTAUTH_URL}/projects/${project_id}/tasks/${task_id}`,
          },
        })
      }
    }

    return NextResponse.json(comment)
  } catch (error) {
    console.error("Comment creation error:", error)
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("task_id")
    const projectId = searchParams.get("project_id")

    if (!taskId && !projectId) {
      return NextResponse.json({ error: "Missing task_id or project_id" }, { status: 400 })
    }

    let query = `
      SELECT c.*, u.name as user_name, u.email as user_email, u.avatar_url,
             parent.content as parent_content, parent_user.name as parent_user_name
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN comments parent ON c.parent_comment_id = parent.id
      LEFT JOIN users parent_user ON parent.user_id = parent_user.id
      WHERE 1=1
    `
    const params = []

    if (taskId) {
      query += " AND c.task_id = ?"
      params.push(taskId)
    }

    if (projectId) {
      query += " AND c.project_id = ?"
      params.push(projectId)
    }

    query += " ORDER BY c.created_at ASC"

    const [rows] = await db.execute(query, params)
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Comments fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
