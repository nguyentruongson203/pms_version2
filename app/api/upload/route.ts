import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const projectId = formData.get("projectId") as string
    const taskId = formData.get("taskId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), "uploads")
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const filepath = join(uploadDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Save to database
    const [result] = await db.execute(
      `
      INSERT INTO file_uploads (
        filename, original_name, file_path, file_size, mime_type,
        project_id, task_id, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [filename, file.name, filepath, file.size, file.type, projectId || null, taskId || null, session.user.id],
    )

    // Log activity
    await db.execute(
      `
      INSERT INTO activity_logs (user_id, project_id, task_id, action, metadata)
      VALUES (?, ?, ?, ?, ?)
    `,
      [
        session.user.id,
        projectId || null,
        taskId || null,
        `uploaded file "${file.name}"`,
        JSON.stringify({ filename, fileSize: file.size, mimeType: file.type }),
      ],
    )

    return NextResponse.json({
      success: true,
      fileId: (result as any).insertId,
      filename: filename,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
