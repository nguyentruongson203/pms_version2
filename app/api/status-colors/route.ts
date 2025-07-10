import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const statusType = searchParams.get("type") // 'task' or 'project'

    let query = "SELECT * FROM status_colors"
    const params: any[] = []

    if (statusType) {
      query += " WHERE status_type = ?"
      params.push(statusType)
    }

    query += " ORDER BY status_value"

    const [rows] = await db.execute(query, params)
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error fetching status colors:", error)
    return NextResponse.json({ error: "Failed to fetch status colors" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { status_type, status_value, color_hex, bg_color, text_color } = await request.json()

    const [result] = await db.execute(
      `
      INSERT INTO status_colors (status_type, status_value, color_hex, bg_color, text_color)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      color_hex = VALUES(color_hex),
      bg_color = VALUES(bg_color),
      text_color = VALUES(text_color)
    `,
      [status_type, status_value, color_hex, bg_color, text_color],
    )

    return NextResponse.json({ success: true, id: (result as any).insertId })
  } catch (error) {
    console.error("Error saving status color:", error)
    return NextResponse.json({ error: "Failed to save status color" }, { status: 500 })
  }
}
