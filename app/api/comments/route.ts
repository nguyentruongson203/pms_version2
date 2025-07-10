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
    const { content, task_id, project_id, parent_comment_id } = body

    // Extract mentioned users from content (@username)
    const mentionRegex = /@(\w+)/g
    const mentions = []
    let match
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1])
    }

    // Get mentioned user IDs
    let mentionedUserIds: number[] = []
    if (mentions.length > 0) {
      const placeholders = mentions.map(() => "?").join(",")
      const [userRows] = await db.execute(`SELECT id, name, email FROM users WHERE name IN (${placeholders})`, mentions)
      mentionedUserIds = (userRows as any[]).map((user) => user.id)
    }

    // Insert comment
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

    // Get comment details for notifications
    let taskInfo = null
    let projectInfo = null

    if (task_id) {
      const [taskRows] = await db.execute(
        `SELECT t.*, p.name as project_name, p.project_code, assigned_user.email as assigned_email, assigned_user.name as assigned_name
         FROM tasks t
         JOIN projects p ON t.project_id = p.id
         LEFT JOIN users assigned_user ON t.assigned_to = assigned_user.id
         WHERE t.id = ?`,
        [task_id],
      )
      taskInfo = (taskRows as any[])[0]
      projectInfo = { name: taskInfo.project_name, project_code: taskInfo.project_code }
    } else if (project_id) {
      const [projectRows] = await db.execute(`SELECT * FROM projects WHERE id = ?`, [project_id])
      projectInfo = (projectRows as any[])[0]
    }

    // Send notifications to mentioned users
    if (mentionedUserIds.length > 0) {
      const [mentionedUsers] = await db.execute(
        `SELECT id, name, email FROM users WHERE id IN (${mentionedUserIds.map(() => "?").join(",")})`,
        mentionedUserIds,
      )

      for (const user of mentionedUsers as any[]) {
        // Create notification
        await db.execute(
          `INSERT INTO notifications (user_id, title, message, type, action_url, project_id, task_id, created_by)
           VALUES (?, ?, ?, 'info', ?, ?, ?, ?)`,
          [
            user.id,
            "You were mentioned in a comment",
            `${session.user.name} mentioned you in a comment${taskInfo ? ` on task "${taskInfo.title}"` : projectInfo ? ` on project "${projectInfo.name}"` : ""}`,
            taskInfo
              ? `/projects/${taskInfo.project_id}/tasks/${task_id}`
              : projectInfo
                ? `/projects/${project_id}`
                : null,
            project_id || taskInfo?.project_id || null,
            task_id || null,
            session.user.id,
          ],
        )

        // Send email notification
        await sendNotificationEmail({
          to: user.email,
          toName: user.name,
          subject: "You were mentioned in a comment",
          template: "mention",
          data: {
            mentionedBy: session.user.name,
            content: content.substring(0, 200) + (content.length > 200 ? "..." : ""),
            taskTitle: taskInfo?.title,
            projectName: projectInfo?.name,
            actionUrl: `${process.env.NEXTAUTH_URL}${taskInfo ? `/projects/${taskInfo.project_id}/tasks/${task_id}` : projectInfo ? `/projects/${project_id}` : ""}`,
          },
        })
      }
    }

    // Notify task assignee (if not the commenter and not already mentioned)
    if (
      taskInfo &&
      taskInfo.assigned_email &&
      taskInfo.assigned_to !== session.user.id &&
      !mentionedUserIds.includes(taskInfo.assigned_to)
    ) {
      await db.execute(
        `INSERT INTO notifications (user_id, title, message, type, action_url, project_id, task_id, created_by)
         VALUES (?, ?, ?, 'info', ?, ?, ?, ?)`,
        [
          taskInfo.assigned_to,
          "New comment on your task",
          `${session.user.name} commented on task "${taskInfo.title}"`,
          `/projects/${taskInfo.project_id}/tasks/${task_id}`,
          taskInfo.project_id,
          task_id,
          session.user.id,
        ],
      )

      await sendNotificationEmail({
        to: taskInfo.assigned_email,
        toName: taskInfo.assigned_name,
        subject: "New comment on your task",
        template: "task_comment",
        data: {
          commenterName: session.user.name,
          taskTitle: taskInfo.title,
          projectName: taskInfo.project_name,
          content: content.substring(0, 200) + (content.length > 200 ? "..." : ""),
          actionUrl: `${process.env.NEXTAUTH_URL}/projects/${taskInfo.project_id}/tasks/${task_id}`,
        },
      })
    }

    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (user_id, project_id, task_id, action, details, affected_user_id, metadata)
       VALUES (?, ?, ?, 'comment_added', ?, ?, ?)`,
      [
        session.user.id,
        project_id || taskInfo?.project_id || null,
        task_id || null,
        JSON.stringify({
          comment_id: commentId,
          content_preview: content.substring(0, 100),
          mentions_count: mentionedUserIds.length,
          is_reply: !!parent_comment_id,
        }),
        mentionedUserIds.length > 0 ? mentionedUserIds[0] : null,
        JSON.stringify({
          mentioned_users: mentionedUserIds,
          parent_comment_id,
          notification_sent: true,
        }),
      ],
    )

    return NextResponse.json({
      id: commentId,
      message: "Comment added successfully",
      mentioned_users: mentionedUserIds.length,
    })
  } catch (error) {
    console.error("Comment creation error:", error)
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("task_id")
    const projectId = searchParams.get("project_id")

    if (!taskId && !projectId) {
      return NextResponse.json({ error: "Task ID or Project ID required" }, { status: 400 })
    }

    let query = `
      SELECT c.*, u.name as user_name, u.avatar_url,
             parent_user.name as parent_user_name,
             (SELECT COUNT(*) FROM comments WHERE parent_comment_id = c.id) as reply_count
      FROM comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN comments parent_c ON c.parent_comment_id = parent_c.id
      LEFT JOIN users parent_user ON parent_c.user_id = parent_user.id
      WHERE 1=1
    `
    const params: any[] = []

    if (taskId) {
      query += " AND c.task_id = ?"
      params.push(Number.parseInt(taskId))
    }

    if (projectId) {
      query += " AND c.project_id = ?"
      params.push(Number.parseInt(projectId))
    }

    query += " ORDER BY c.created_at ASC"

    const [rows] = await db.execute(query, params)

    // Parse mentioned_users JSON
    const comments = (rows as any[]).map((comment) => ({
      ...comment,
      mentioned_users: comment.mentioned_users ? JSON.parse(comment.mentioned_users) : [],
    }))

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Comments fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}
