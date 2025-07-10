import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import db from "@/lib/db"
import { ProjectDetailContent } from "@/components/project-detail-content"

async function getProjectDetail(projectId: string) {
  try {
    const [projectRows] = await db.execute(
      `
      SELECT p.*, 
             pm_user.name as project_manager_name,
             pm_user.email as project_manager_email,
             creator.name as created_by_name,
             sc.bg_color, sc.text_color
      FROM projects p
      LEFT JOIN users pm_user ON p.project_manager_id = pm_user.id
      LEFT JOIN users creator ON p.created_by = creator.id
      LEFT JOIN status_colors sc ON sc.status_type = 'project' AND sc.status_value = p.status
      WHERE p.id = ?
    `,
      [projectId],
    )

    const [memberRows] = await db.execute(
      `
      SELECT pm.*, u.name, u.email, u.avatar_url
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
      ORDER BY pm.role, u.name
    `,
      [projectId],
    )

    const [taskRows] = await db.execute(
      `
      SELECT t.*, 
             assigned_user.name as assigned_user_name,
             assigned_user.email as assigned_user_email,
             creator.name as created_by_name,
             sc.bg_color as status_bg_color, 
             sc.text_color as status_text_color
      FROM tasks t
      LEFT JOIN users assigned_user ON t.assigned_to = assigned_user.id
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN status_colors sc ON sc.status_type = 'task' AND sc.status_value = t.status
      WHERE t.project_id = ?
      ORDER BY t.created_at DESC
    `,
      [projectId],
    )

    const [activityRows] = await db.execute(
      `
      SELECT al.*, u.name as user_name, u.avatar_url
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.project_id = ?
      ORDER BY al.created_at DESC
      LIMIT 20
    `,
      [projectId],
    )

    const [fileRows] = await db.execute(
      `
      SELECT f.*, u.name as uploaded_by_name
      FROM file_uploads f
      JOIN users u ON f.uploaded_by = u.id
      WHERE f.project_id = ?
      ORDER BY f.created_at DESC
    `,
      [projectId],
    )

    return {
      project: projectRows[0] || null,
      members: memberRows,
      tasks: taskRows,
      activities: activityRows,
      files: fileRows,
    }
  } catch (error) {
    console.error("Project detail fetch error:", error)
    return { project: null, members: [], tasks: [], activities: [], files: [] }
  }
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const { project, members, tasks, activities, files } = await getProjectDetail(params.id)

  if (!project) {
    redirect("/projects")
  }

  // Check if user has access to this project
  const userMember = members.find((member: any) => member.user_id === session.user.id)
  const isCreator = project.created_by === session.user.id

  if (!userMember && !isCreator) {
    redirect("/projects")
  }

  return (
    <ProjectDetailContent
      project={project}
      members={members}
      tasks={tasks}
      activities={activities}
      files={files}
      currentUser={session.user}
    />
  )
}
