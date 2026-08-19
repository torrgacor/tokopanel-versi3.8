import { NextResponse } from "next/server"
import { jalankanCronExpirePanel } from "@/lib/cron-expire"
import { isAdminRequestAuthorized } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  const secretCocok = Boolean(process.env.CRON_SECRET) && authHeader === `Bearer ${process.env.CRON_SECRET}`

  if (!secretCocok && !isAdminRequestAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const hasil = await jalankanCronExpirePanel("otomatis")
    return NextResponse.json({ success: true, ...hasil })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 })
  }
}
