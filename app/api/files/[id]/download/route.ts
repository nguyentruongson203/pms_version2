import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import db from "@/lib/db"
import { readFile } from "fs/promises"
import { existsSync } from "fs"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const fileId = params.id

    // Get file info from database
    const [rows] = await db.execute(
      `SELECT f.*, p.id as project_id, pm.user_id as member_user_id
       FROM file_uploads f
       LEFT JOIN projects p ON f.project_id = p.id
       LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = ?
       WHERE f.id = ?`,
      [session.user.id, fileId],
    )

    if (!rows || (rows as any[]).length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const file = (rows as any[])[0]

    // Check access permissions
    const hasAccess =
      file.uploaded_by === session.user.id || // Uploader
      file.member_user_id === session.user.id || // Project member
      session.user.role === "admin" // Admin

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Check if file exists
    if (!existsSync(file.file_path)) {
      return NextResponse.json({ error: "File not found on disk" }, { status: 404 })
    }

    // Read and return file
    const fileBuffer = await readFile(file.file_path)

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": file.mime_type,
        "Content-Disposition": `attachment; filename="${file.original_name}"`,
        "Content-Length": file.file_size.toString(),
      },
    })
  } catch (error) {
    console.error("File download error:", error)
    return NextResponse.json({ error: "Download failed" }, { status: 500 })
  }
}
