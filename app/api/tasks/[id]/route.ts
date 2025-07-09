import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import db from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [taskRows] = await db.execute(
      `SELECT t.*, 
              u1.name as assigned_user_name, u1.email as assigned_user_email,
              u2.name as created_by_name, u2.email as created_by_email,
              p.name as project_name, p.project_code
       FROM tasks t
       LEFT JOIN users u1 ON t.assigned_to = u1.id
       LEFT JOIN users u2 ON t.created_by = u2.id
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.id = ?`,
      [params.id],
    )

    const tasks = taskRows as any[]
    if (tasks.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const task = tasks[0]

    // Get comments for this task
    const [commentRows] = await db.execute(
      `SELECT c.*, u.name as user_name, u.email as user_email, u.avatar_url
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.task_id = ?
       ORDER BY c.created_at ASC`,
      [params.id],
    )

    // Get time entries for this task
    const [timeRows] = await db.execute(
      `SELECT te.*, u.name as user_name
       FROM time_entries te
       LEFT JOIN users u ON te.user_id = u.id
       WHERE te.task_id = ?
       ORDER BY te.date DESC`,
      [params.id],
    )

    return NextResponse.json({
      task,
      comments: commentRows,
      timeEntries: timeRows,
    })
  } catch (error) {
    console.error("Task fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    await db.execute(`UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [status, params.id])

    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (user_id, task_id, action, details) 
       VALUES (?, ?, 'task_status_updated', ?)`,
      [session.user.id, params.id, JSON.stringify({ new_status: status })],
    )

    return NextResponse.json({ message: "Task updated successfully" })
  } catch (error) {
    console.error("Task update error:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}
