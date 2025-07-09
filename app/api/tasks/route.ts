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
    const { title, description, project_id, assigned_to, priority, status, due_date, estimated_hours, tags } = body

    const [result] = await db.execute(
      `INSERT INTO tasks (title, description, project_id, assigned_to, created_by, priority, status, due_date, estimated_hours, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        project_id,
        assigned_to,
        session.user.id,
        priority,
        status || "backlog",
        due_date,
        estimated_hours,
        tags ? JSON.stringify(tags) : null,
      ],
    )

    const taskId = (result as any).insertId

    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (user_id, project_id, task_id, action, details) VALUES (?, ?, ?, 'task_created', ?)`,
      [session.user.id, project_id, taskId, JSON.stringify({ task_title: title, assigned_to })],
    )

    return NextResponse.json({ id: taskId, message: "Task created successfully" })
  } catch (error) {
    console.error("Task creation error:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
