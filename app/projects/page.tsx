import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import db from "@/lib/db"
import { ProjectsContent } from "@/components/projects-content"

async function getProjects(userId: string) {
  try {
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
      [userId, userId],
    )

    return rows
  } catch (error) {
    console.error("Projects fetch error:", error)
    return []
  }
}

export default async function Projects() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const projects = await getProjects(session.user.id)

  return <ProjectsContent projects={projects} user={session.user} />
}
