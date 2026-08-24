import { NextResponse } from "next/server"
import { getCollections } from "@/lib/affiliate"
import { isAdminRequestAuthorized } from "@/lib/admin-auth"

export async function GET(req: Request) {
  try {
    if (!isAdminRequestAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { withdrawalRequests } = await getCollections()
    const pendings = await withdrawalRequests.find({ status: "pending" }).sort({ createdAt: -1 }).toArray()
    const normalized = pendings.map((request) => ({
      ...request,
      _id: request._id.toString(),
      requestId: request._id.toString(),
    }))
    return NextResponse.json({ data: normalized })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
