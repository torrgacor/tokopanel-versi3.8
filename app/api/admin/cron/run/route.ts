import { NextResponse } from "next/server"
import { isAdminRequestAuthorized } from "@/lib/admin-auth"
import { jalankanCronExpirePanel } from "@/lib/cron-expire"

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    if (!isAdminRequestAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const hasil = await jalankanCronExpirePanel("manual")
    return NextResponse.json({ success: true, ...hasil })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 })
  }
}
