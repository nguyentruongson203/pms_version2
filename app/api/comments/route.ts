import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import db from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { content, task_id, project_id } = body

    if (!content || (!task_id && !project_id)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const [result] = await db.execute(
      `INSERT INTO comments (content, task_id, project_id, user_id) VALUES (?, ?, ?, ?)`,
      [content, task_id || null, project_id || null, session.user.id],
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

    // Log activity
    if (task_id) {
      await db.execute(
        `INSERT INTO activity_logs (user_id, task_id, action, details) VALUES (?, ?, 'comment_added', ?)`,
        [session.user.id, task_id, JSON.stringify({ comment_preview: content.substring(0, 50) })],
      )
    }

    return NextResponse.json(commentRows[0])
  } catch (error) {
    console.error("Comment creation error:", error)
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}
