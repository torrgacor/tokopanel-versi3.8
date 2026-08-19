import { NextResponse } from "next/server"
import { isAdminRequestAuthorized } from "@/lib/admin-auth"
import {
  getAffiliateCommissionPercent,
  setAffiliateCommissionPercent,
  getAffiliateMinWithdraw,
  setAffiliateMinWithdraw,
} from "@/lib/affiliate"

export async function GET(req: Request) {
  try {
    if (!isAdminRequestAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [percent, minWithdraw] = await Promise.all([
      getAffiliateCommissionPercent(),
      getAffiliateMinWithdraw(),
    ])

    return NextResponse.json({ success: true, percent, minWithdraw })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    if (!isAdminRequestAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const result: { percent?: number; minWithdraw?: number } = {}

    if (body.percent !== undefined) {
      const percent = Number(body.percent)
      if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        return NextResponse.json({ error: "Persentase harus antara 0 sampai 100" }, { status: 400 })
      }
      result.percent = await setAffiliateCommissionPercent(percent)
    }

    if (body.minWithdraw !== undefined) {
      const minWithdraw = Number(body.minWithdraw)
      if (!Number.isFinite(minWithdraw) || minWithdraw < 0) {
        return NextResponse.json({ error: "Minimal withdraw tidak valid" }, { status: 400 })
      }
      result.minWithdraw = await setAffiliateMinWithdraw(minWithdraw)
    }

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
