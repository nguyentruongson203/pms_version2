import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import db from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // 'project' or 'task'

    let query = "SELECT * FROM status_colors"
    const params: any[] = []

    if (type) {
      query += " WHERE status_type = ?"
      params.push(type)
    }

    query += " ORDER BY status_type, status_value"

    const [rows] = await db.execute(query, params)
    return NextResponse.json(rows)
  } catch (error) {
    console.error("Status colors fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status_type, status_value, color_hex, bg_color, text_color } = body

    const [result] = await db.execute(
      `INSERT INTO status_colors (status_type, status_value, color_hex, bg_color, text_color)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       color_hex = VALUES(color_hex),
       bg_color = VALUES(bg_color),
       text_color = VALUES(text_color)`,
      [status_type, status_value, color_hex, bg_color, text_color],
    )

    return NextResponse.json({ message: "Status color updated successfully" })
  } catch (error) {
    console.error("Status color update error:", error)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}
