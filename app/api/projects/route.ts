import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import db from "@/lib/db"
import { sendNotificationEmail } from "@/lib/email"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [rows] = await db.execute(
      `
      SELECT p.*, pm.role as user_role, u.name as created_by_name,
             pm_user.name as project_manager_name,
             COUNT(DISTINCT t.id) as task_count,
             COUNT(DISTINCT pm2.user_id) as member_count,
             sc.bg_color, sc.text_color
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN users pm_user ON p.project_manager_id = pm_user.id
      LEFT JOIN tasks t ON p.id = t.project_id
      LEFT JOIN project_members pm2 ON p.id = pm2.project_id
      LEFT JOIN status_colors sc ON sc.status_type = 'project' AND sc.status_value = p.status
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
    const {
      name,
      description,
      project_code,
      start_date,
      end_date,
      budget,
      estimated_budget,
      priority,
      type,
      client_name,
      client_email,
      project_manager_id,
      risk_level,
      methodology,
      repository_url,
      documentation_url,
      slack_channel,
      jira_project_key,
      custom_fields,
    } = body

    // Generate project code if not provided
    const finalProjectCode = project_code || `PROJ-${Date.now()}`

    const [result] = await db.execute(
      `INSERT INTO projects (
        name, description, project_code, start_date, end_date, budget, estimated_budget,
        priority, type, client_name, client_email, project_manager_id, risk_level,
        methodology, repository_url, documentation_url, slack_channel, 
        jira_project_key, custom_fields, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        finalProjectCode,
        start_date,
        end_date,
        budget,
        estimated_budget,
        priority,
        type,
        client_name,
        client_email,
        project_manager_id,
        risk_level,
        methodology,
        repository_url,
        documentation_url,
        slack_channel,
        jira_project_key,
        custom_fields ? JSON.stringify(custom_fields) : null,
        session.user.id,
      ],
    )

    const projectId = (result as any).insertId

    // Add creator as project manager if no PM specified
    const managerId = project_manager_id || session.user.id
    await db.execute(`INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, 'project_manager')`, [
      projectId,
      managerId,
    ])

    // Log activity
    await db.execute(
      `INSERT INTO activity_logs (user_id, project_id, action, details, affected_user_id, metadata) 
       VALUES (?, ?, 'project_created', ?, ?, ?)`,
      [
        session.user.id,
        projectId,
        JSON.stringify({ project_name: name }),
        managerId,
        JSON.stringify({
          project_code: finalProjectCode,
          client_name,
          methodology,
          risk_level,
        }),
      ],
    )

    // Send notification to project manager if different from creator
    if (project_manager_id && project_manager_id !== session.user.id) {
      const [pmRows] = await db.execute("SELECT email, name FROM users WHERE id = ?", [project_manager_id])
      if (pmRows.length > 0) {
        const pm = pmRows[0] as any

        // Create notification
        await db.execute(
          `INSERT INTO notifications (user_id, title, message, type, action_url, project_id, created_by)
           VALUES (?, ?, ?, 'info', ?, ?, ?)`,
          [
            project_manager_id,
            "New Project Assignment",
            `You have been assigned as project manager for "${name}"`,
            `/projects/${projectId}`,
            projectId,
            session.user.id,
          ],
        )

        // Queue email
        await sendNotificationEmail({
          to: pm.email,
          name: pm.name,
          subject: `New Project Assignment: ${name}`,
          template: "project_assignment",
          data: {
            project_name: name,
            project_code: finalProjectCode,
            assigned_by: session.user.name,
            project_url: `${process.env.NEXTAUTH_URL}/projects/${projectId}`,
          },
        })
      }
    }

    return NextResponse.json({ id: projectId, message: "Project created successfully" })
  } catch (error) {
    console.error("Project creation error:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}
