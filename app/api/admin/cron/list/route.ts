import { NextResponse } from "next/server"
import { isAdminRequestAuthorized } from "@/lib/admin-auth"
import { ambilCronLogs } from "@/lib/cron-log"

export async function GET(req: Request) {
  try {
    if (!isAdminRequestAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const logs = await ambilCronLogs(60)
    const normalized = logs.map((log) => ({
      ...log,
      _id: log._id.toString(),
    }))

    return NextResponse.json({ success: true, data: normalized })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
