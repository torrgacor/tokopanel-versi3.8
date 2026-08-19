import { NextResponse } from "next/server"
import { createWithdrawalRequest } from "@/app/actions/affiliate"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { affiliateId, amount, method, accountNumber, accountName } = body
    if (!affiliateId || !amount || !method || !accountNumber || !accountName) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 })
    }

    const res = await createWithdrawalRequest({ affiliateId, amount: Number(amount), method, accountNumber, accountName })
    if (!res.success) return NextResponse.json({ error: res.error }, { status: 400 })
    return NextResponse.json({ success: true, requestId: res.requestId })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
