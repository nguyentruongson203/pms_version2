import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import db from "@/lib/db"
import { KanbanBoard } from "@/components/kanban-board"

async function getProjectTasks(projectId: string) {
  try {
    const [taskRows] = await db.execute(
      `
      SELECT t.*, u.name as assigned_user_name, u.email as assigned_user_email
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.project_id = ?
      ORDER BY t.created_at DESC
    `,
      [projectId],
    )

    const [projectRows] = await db.execute(
      `
      SELECT * FROM projects WHERE id = ?
    `,
      [projectId],
    )

    return {
      tasks: taskRows,
      project: projectRows[0] || null,
    }
  } catch (error) {
    console.error("Kanban data fetch error:", error)
    return { tasks: [], project: null }
  }
}

export default async function KanbanPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const { tasks, project } = await getProjectTasks(params.id)

  if (!project) {
    redirect("/projects")
  }

  return <KanbanBoard tasks={tasks} project={project} user={session.user} />
}
