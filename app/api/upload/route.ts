import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import db from "@/lib/db"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const projectId = formData.get("projectId") as string
    const taskId = formData.get("taskId") as string
    const commentId = formData.get("commentId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "application/zip",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 })
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large" }, { status: 400 })
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), "uploads")
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const extension = file.name.split(".").pop()
    const filename = `${timestamp}-${randomString}.${extension}`
    const filepath = join(uploadDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Save to database
    const [result] = await db.execute(
      `INSERT INTO file_uploads (filename, original_name, file_path, file_size, mime_type, uploaded_by, project_id, task_id, comment_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        filename,
        file.name,
        filepath,
        file.size,
        file.type,
        session.user.id,
        projectId ? Number.parseInt(projectId) : null,
        taskId ? Number.parseInt(taskId) : null,
        commentId ? Number.parseInt(commentId) : null,
      ],
    )

    const fileId = (result as any).insertId

    // Log activity
    if (projectId) {
      await db.execute(
        `INSERT INTO activity_logs (user_id, project_id, task_id, action, details)
         VALUES (?, ?, ?, 'file_uploaded', ?)`,
        [
          session.user.id,
          Number.parseInt(projectId),
          taskId ? Number.parseInt(taskId) : null,
          JSON.stringify({ filename: file.name, file_size: file.size }),
        ],
      )
    }

    return NextResponse.json({
      id: fileId,
      filename,
      original_name: file.name,
      file_size: file.size,
      message: "File uploaded successfully",
    })
  } catch (error) {
    console.error("File upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
