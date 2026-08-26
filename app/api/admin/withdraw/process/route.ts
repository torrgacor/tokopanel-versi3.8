import { NextResponse } from "next/server"
import { adminProcessWithdrawal } from "@/app/actions/affiliate"
import { isAdminRequestAuthorized } from "@/lib/admin-auth"

export async function POST(req: Request) {
  try {
    if (!isAdminRequestAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { requestId, approve, adminNote, txId, proofUrl } = body

    if (!requestId || approve === undefined) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 })
    }

    const res = await adminProcessWithdrawal({
      requestId,
      approve: Boolean(approve),
      adminNote,
      txId,
      proofUrl,
    })

    if (!res.success) return NextResponse.json({ error: res.error }, { status: 400 })
    return NextResponse.json(res)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
