import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { readFile } from "fs/promises"
import { existsSync } from "fs"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get file info from database
    const [rows] = await db.execute(
      `
      SELECT * FROM file_uploads WHERE id = ?
    `,
      [params.id],
    )

    const file = (rows as any[])[0]
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Check if file exists on disk
    if (!existsSync(file.file_path)) {
      return NextResponse.json({ error: "File not found on disk" }, { status: 404 })
    }

    // Read file
    const fileBuffer = await readFile(file.file_path)

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": file.mime_type,
        "Content-Disposition": `attachment; filename="${file.original_name}"`,
        "Content-Length": file.file_size.toString(),
      },
    })
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json({ error: "Download failed" }, { status: 500 })
  }
}
