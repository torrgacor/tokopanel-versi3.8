import { NextResponse } from "next/server"
import { recordReferralOrder } from "@/app/actions/referral-tracking"
import { isAdminRequestAuthorized } from "@/lib/admin-auth"

export async function POST(req: Request) {
  try {
    // Validasi admin authorization
    if (!isAdminRequestAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { referralCode, orderId, customerId, planId, amount } = body

    if (!referralCode || !orderId || !customerId || !planId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await recordReferralOrder(referralCode, orderId, customerId, planId, amount)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Record referral order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
