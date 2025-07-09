import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import db from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [rows] = await db.execute(
      `SELECT id, name, email, role, avatar_url, is_active FROM users WHERE is_active = TRUE ORDER BY name`,
    )

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Users fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
