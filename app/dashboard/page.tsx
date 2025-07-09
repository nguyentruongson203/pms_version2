import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import db from "@/lib/db"
import { DashboardContent } from "@/components/dashboard-content"

async function getDashboardData(userId: string) {
  try {
    // Get user's projects
    const [projectRows] = await db.execute(
      `SELECT p.*, COUNT(DISTINCT t.id) as task_count
       FROM projects p
       LEFT JOIN project_members pm ON p.id = pm.project_id
       LEFT JOIN tasks t ON p.id = t.project_id
       WHERE pm.user_id = ? OR p.created_by = ?
       GROUP BY p.id
       ORDER BY p.updated_at DESC
       LIMIT 5`,
      [userId, userId],
    )

    // Get user's tasks
    const [taskRows] = await db.execute(
      `SELECT t.*, p.name as project_name, p.project_code
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.assigned_to = ?
       ORDER BY t.updated_at DESC
       LIMIT 10`,
      [userId],
    )

    // Get recent activity
    const [activityRows] = await db.execute(
      `SELECT al.*, u.name as user_name, p.name as project_name, t.title as task_title
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       LEFT JOIN projects p ON al.project_id = p.id
       LEFT JOIN tasks t ON al.task_id = t.id
       ORDER BY al.created_at DESC
       LIMIT 20`,
      [],
    )

    // Get statistics
    const [statsRows] = await db.execute(
      `SELECT 
         (SELECT COUNT(*) FROM projects WHERE created_by = ? OR id IN (SELECT project_id FROM project_members WHERE user_id = ?)) as total_projects,
         (SELECT COUNT(*) FROM tasks WHERE assigned_to = ?) as assigned_tasks,
         (SELECT COUNT(*) FROM tasks WHERE assigned_to = ? AND status = 'done') as completed_tasks,
         (SELECT COUNT(*) FROM tasks WHERE assigned_to = ? AND due_date < CURDATE() AND status != 'done') as overdue_tasks`,
      [userId, userId, userId, userId, userId],
    )

    return {
      projects: projectRows,
      tasks: taskRows,
      activities: activityRows,
      stats: statsRows[0] || {},
    }
  } catch (error) {
    console.error("Dashboard data fetch error:", error)
    return {
      projects: [],
      tasks: [],
      activities: [],
      stats: {},
    }
  }
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const dashboardData = await getDashboardData(session.user.id)

  return <DashboardContent user={session.user} data={dashboardData} />
}
