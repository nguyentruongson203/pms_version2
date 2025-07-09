import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import DashboardContent from "@/components/dashboard-content"
import db from "@/lib/db"

async function getDashboardData(userId: string) {
  try {
    // Get user's projects
    const [projectRows] = await db.execute(
      `
      SELECT p.*, pm.role as user_role
      FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = ?
      ORDER BY p.updated_at DESC
    `,
      [userId],
    )

    // Get user's tasks
    const [taskRows] = await db.execute(
      `
      SELECT t.*, p.name as project_name, u.name as assigned_user_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.assigned_to = ?
      ORDER BY t.due_date ASC, t.priority DESC
    `,
      [userId],
    )

    // Get recent activity
    const [activityRows] = await db.execute(`
      SELECT al.*, u.name as user_name, p.name as project_name, t.title as task_title
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN projects p ON al.project_id = p.id
      LEFT JOIN tasks t ON al.task_id = t.id
      ORDER BY al.created_at DESC
      LIMIT 10
    `)

    return {
      projects: projectRows,
      tasks: taskRows,
      activities: activityRows,
    }
  } catch (error) {
    console.error("Dashboard data error:", error)
    return { projects: [], tasks: [], activities: [] }
  }
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const dashboardData = await getDashboardData(session.user.id)

  return <DashboardContent session={session} data={dashboardData} />
}
