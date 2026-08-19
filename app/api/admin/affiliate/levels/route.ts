import { NextResponse } from "next/server"
import { isAdminRequestAuthorized } from "@/lib/admin-auth"
import {
  createAffiliateLevel,
  deleteAffiliateLevel,
  getAffiliateLevels,
  updateAffiliateLevel,
} from "@/lib/affiliate"

export async function GET(req: Request) {
  try {
    if (!isAdminRequestAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const levels = await getAffiliateLevels()
    return NextResponse.json({ success: true, data: levels })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    if (!isAdminRequestAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const level = await createAffiliateLevel({
      name: body.name,
      threshold: body.threshold,
      commissionPercent: body.commissionPercent,
    })

    return NextResponse.json({ success: true, data: level })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}

export async function PATCH(req: Request) {
  try {
    if (!isAdminRequestAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const level = await updateAffiliateLevel(body.levelId, {
      name: body.name,
      threshold: body.threshold,
      commissionPercent: body.commissionPercent,
    })

    return NextResponse.json({ success: true, data: level })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  try {
    if (!isAdminRequestAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const levelId = searchParams.get("levelId")
    if (!levelId) {
      return NextResponse.json({ error: "levelId diperlukan" }, { status: 400 })
    }

    const result = await deleteAffiliateLevel(levelId)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
