import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ProjectDetailContent } from "@/components/project-detail-content"
import { db } from "@/lib/db"

async function getProject(id: string) {
  try {
    const [rows] = await db.execute(
      `
      SELECT 
        p.*,
        u.name as created_by_name,
        pm.name as project_manager_name,
        pm.email as project_manager_email
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN users pm ON p.project_manager_id = pm.id
      WHERE p.id = ?
    `,
      [id],
    )

    return rows[0] || null
  } catch (error) {
    console.error("Error fetching project:", error)
    return null
  }
}

async function getProjectTasks(projectId: string) {
  try {
    const [rows] = await db.execute(
      `
      SELECT 
        t.*,
        u.name as assigned_to_name,
        u.email as assigned_to_email,
        creator.name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users creator ON t.created_by = creator.id
      WHERE t.project_id = ?
      ORDER BY t.created_at DESC
    `,
      [projectId],
    )

    return rows
  } catch (error) {
    console.error("Error fetching project tasks:", error)
    return []
  }
}

async function getProjectTeam(projectId: string) {
  try {
    const [rows] = await db.execute(
      `
      SELECT DISTINCT 
        u.id,
        u.name,
        u.email,
        u.role,
        'member' as project_role
      FROM users u
      INNER JOIN tasks t ON u.id = t.assigned_to
      WHERE t.project_id = ?
      
      UNION
      
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        'manager' as project_role
      FROM users u
      INNER JOIN projects p ON u.id = p.project_manager_id
      WHERE p.id = ?
    `,
      [projectId, projectId],
    )

    return rows
  } catch (error) {
    console.error("Error fetching project team:", error)
    return []
  }
}

async function getProjectFiles(projectId: string) {
  try {
    const [rows] = await db.execute(
      `
      SELECT 
        f.*,
        u.name as uploaded_by_name
      FROM file_uploads f
      LEFT JOIN users u ON f.uploaded_by = u.id
      WHERE f.project_id = ?
      ORDER BY f.created_at DESC
    `,
      [projectId],
    )

    return rows
  } catch (error) {
    console.error("Error fetching project files:", error)
    return []
  }
}

async function getProjectActivity(projectId: string) {
  try {
    const [rows] = await db.execute(
      `
      SELECT 
        a.*,
        u.name as user_name
      FROM activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.project_id = ?
      ORDER BY a.created_at DESC
      LIMIT 50
    `,
      [projectId],
    )

    return rows
  } catch (error) {
    console.error("Error fetching project activity:", error)
    return []
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return <div>Access denied</div>
  }

  const project = await getProject(params.id)

  if (!project) {
    notFound()
  }

  const [tasks, team, files, activity] = await Promise.all([
    getProjectTasks(params.id),
    getProjectTeam(params.id),
    getProjectFiles(params.id),
    getProjectActivity(params.id),
  ])

  return (
    <div className="container mx-auto py-6">
      <ProjectDetailContent project={project} tasks={tasks} team={team} files={files} activity={activity} />
    </div>
  )
}
