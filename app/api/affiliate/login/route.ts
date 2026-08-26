import { NextResponse } from "next/server"
import { getCollections } from "@/lib/affiliate"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, phoneNumber } = body
    if (!email || !phoneNumber) return NextResponse.json({ error: 'missing fields' }, { status: 400 })

    const { affiliateProfiles } = await getCollections()
    const profile = await affiliateProfiles.findOne({ email: String(email).toLowerCase().trim(), phoneNumber: String(phoneNumber).trim() })
    if (!profile) return NextResponse.json({ error: 'invalid credentials' }, { status: 401 })

    const res = NextResponse.json({ success: true })
    res.cookies.set('affiliate_user', profile.userId, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 30 })
    return res
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
