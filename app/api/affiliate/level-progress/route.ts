import { NextResponse } from "next/server"
import { getAffiliateLevelProgress } from "@/lib/affiliate"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const affiliateId = searchParams.get("affiliateId")

    if (!affiliateId) {
      return NextResponse.json({ error: "affiliateId diperlukan" }, { status: 400 })
    }

    const data = await getAffiliateLevelProgress(affiliateId)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
