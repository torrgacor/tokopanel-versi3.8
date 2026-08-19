import { NextResponse } from "next/server"
import { isAdminRequestAuthorized } from "@/lib/admin-auth"

export async function GET(req: Request) {
  if (!isAdminRequestAuthorized(req)) {
    return NextResponse.json({ authorized: false }, { status: 401 })
  }
  return NextResponse.json({ authorized: true })
}
