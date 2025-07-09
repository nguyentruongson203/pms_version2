import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import db from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [rows] = await db.execute(
      `
      SELECT p.*, pm.role as user_role, u.name as created_by_name,
             COUNT(DISTINCT t.id) as task_count,
             COUNT(DISTINCT pm2.user_id) as member_count
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN tasks t ON p.id = t.project_id
      LEFT JOIN project_members pm2 ON p.id = pm2.project_id
      WHERE pm.user_id IS NOT NULL OR p.created_by = ?
      GROUP BY p.id
      ORDER BY p.updated_at DESC
    `,
      [session.user.id, session.user.id],
    )

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Projects fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, project_code, start_date, end_date, budget, priority, type } = body

    // Generate project code if not provided
    const finalProjectCode = project_code || `PROJ-${Date.now()}`

    const [result] = await db.execute(
      `INSERT INTO projects (name, description, project_code, start_date, end_date, budget, priority, type, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, finalProjectCode, start_date, end_date, budget, priority, type, session.user.id],
    )

    const projectId = (result as any).insertId

    // Add creator as project manager
    await db.execute(`INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, 'project_manager')`, [
      projectId,
      session.user.id,
    ])

    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (user_id, project_id, action, details) VALUES (?, ?, 'project_created', ?)`,
      [session.user.id, projectId, JSON.stringify({ project_name: name })],
    )

    return NextResponse.json({ id: projectId, message: "Project created successfully" })
  } catch (error) {
    console.error("Project creation error:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}
