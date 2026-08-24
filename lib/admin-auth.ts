import { createHmac, timingSafeEqual } from "crypto"

export const ADMIN_AUTH_COOKIE = "admin_auth"
export const ADMIN_AUTH_MAX_AGE = 60 * 60 * 24 // 24 hours

const getAdminAuthSecret = () => process.env.ADMIN_AUTH_SECRET || process.env.ADMIN_API_KEY || "change_me_secure"

export function createAdminAuthToken() {
  const secret = getAdminAuthSecret()
  return createHmac("sha256", secret).update("admin-auth-token").digest("hex")
}

export function verifyAdminAuthToken(token?: string | null) {
  if (!token) return false
  const expected = createAdminAuthToken()
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  } catch {
    return false
  }
}

export function parseCookies(cookieHeader?: string | null) {
  if (!cookieHeader) return {}
  return cookieHeader.split(";").reduce<Record<string, string>>((acc, cookie) => {
    const [name, ...rest] = cookie.split("=")
    const value = rest.join("=").trim()
    acc[name.trim()] = value
    return acc
  }, {})
}

export function isAdminRequestAuthorized(req: Request) {
  const adminKey = req.headers.get("x-admin-key")
  if (adminKey && adminKey === process.env.ADMIN_API_KEY) {
    return true
  }

  const cookieHeader = req.headers.get("cookie")
  const cookies = parseCookies(cookieHeader)
  return verifyAdminAuthToken(cookies[ADMIN_AUTH_COOKIE])
}
