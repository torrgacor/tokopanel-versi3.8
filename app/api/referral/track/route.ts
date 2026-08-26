import { NextResponse } from "next/server"
import { trackReferralClick, recordReferralOrder } from "@/app/actions/referral-tracking"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const referralCode = searchParams.get("code")

    if (!referralCode) {
      return NextResponse.json({ error: "Missing referral code" }, { status: 400 })
    }

    // Track the click
    await trackReferralClick(referralCode)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Track referral click error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
