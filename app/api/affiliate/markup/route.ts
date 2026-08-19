import { NextResponse } from "next/server"
import { getCollections } from "@/lib/affiliate"
import { plans } from "@/data/plans"

// NOTE: Untuk produksi, ganti query param affiliateId dengan autentikasi session
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const affiliateId = url.searchParams.get("affiliateId")
    if (!affiliateId) return NextResponse.json({ error: "affiliateId required" }, { status: 400 })

    const { affiliatePackagePrices } = await getCollections()

    // Gabungkan daftar paket dasar dengan price custom affiliate
    const prices = await affiliatePackagePrices.find({ affiliateId }).toArray()
    const mapPrices = new Map(prices.map(p => [p.packageId, p]))

    const result = plans.map(p => {
      const custom = mapPrices.get(p.id)
      return {
        packageId: p.id,
        name: p.name,
        basePrice: p.price,
        markupAmount: custom?.markupAmount ?? 0,
        finalPrice: custom?.finalPrice ?? p.price,
      }
    })

    return NextResponse.json({ data: result })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { affiliateId, packageId, markupAmount } = body
    if (!affiliateId || !packageId || markupAmount === undefined) return NextResponse.json({ error: "missing fields" }, { status: 400 })

    const plan = plans.find(p => p.id === packageId)
    const basePrice = plan ? plan.price : 0
    const finalPrice = Math.max(0, basePrice + Number(markupAmount))

    const { affiliatePackagePrices } = await getCollections()
    await affiliatePackagePrices.updateOne(
      { affiliateId, packageId },
      { $set: { affiliateId, packageId, markupAmount: Number(markupAmount), finalPrice, updatedAt: new Date() } },
      { upsert: true }
    )

    return NextResponse.json({ success: true, finalPrice })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
