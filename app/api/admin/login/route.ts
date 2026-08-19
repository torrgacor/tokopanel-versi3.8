import { NextResponse } from "next/server"
import { ADMIN_AUTH_COOKIE, createAdminAuthToken } from "@/lib/admin-auth"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "akuntorry01@gmail.com"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "151515"

export async function POST(req: Request) {
  const body = await req.json()
  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ success: false, error: "Email dan password diperlukan" }, { status: 400 })
  }

  if (email.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ success: false, error: "Email atau password salah" }, { status: 401 })
  }

  const token = createAdminAuthToken()
  const response = NextResponse.json({ success: true })
  response.cookies.set({
    name: ADMIN_AUTH_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  })

  return response
}
