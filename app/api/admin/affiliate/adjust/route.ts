import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getCollections } from "@/lib/affiliate"
import { isAdminRequestAuthorized } from "@/lib/admin-auth"

export async function POST(req: Request) {
  try {
    if (!isAdminRequestAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { affiliateId, amount, reason } = body
    if (!affiliateId || amount === undefined) return NextResponse.json({ error: "missing fields" }, { status: 400 })

    const client = await clientPromise
    const session = client.startSession()
    try {
      const { affiliateProfiles, affiliateTransactions } = await getCollections()
      await session.withTransaction(async () => {
        const profile = await affiliateProfiles.findOne({ userId: affiliateId }, { session })
        if (!profile) throw new Error("Affiliate tidak ditemukan")

        await affiliateProfiles.updateOne({ userId: affiliateId }, { $inc: { "wallet.balance": Number(amount) }, $set: { updatedAt: new Date() } }, { session })

        await affiliateTransactions.insertOne({
          type: "admin_adjust",
          affiliateId,
          amount: Number(amount),
          reason: reason || null,
          createdAt: new Date(),
        }, { session })
      })
      return NextResponse.json({ success: true })
    } finally {
      await session.endSession()
    }
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
