/**
 * Referral helper functions
 * Handles referral code extraction, storage, and validation
 */

export function getReferralCodeFromUrl(): string | null {
  if (typeof window === "undefined") return null
  
  const searchParams = new URLSearchParams(window.location.search)
  return searchParams.get("ref")
}

export function getReferralCodeFromSession(): string | null {
  if (typeof window === "undefined") return null
  
  return sessionStorage.getItem("referral_code")
}

export function saveReferralCodeToSession(code: string): void {
  if (typeof window === "undefined") return
  
  // Track yang click referral link
  fetch(`/api/referral/track?code=${encodeURIComponent(code)}`).catch(console.error)
  
  sessionStorage.setItem("referral_code", code)
}

export function clearReferralCode(): void {
  if (typeof window === "undefined") return
  
  sessionStorage.removeItem("referral_code")
}

export function getReferralCode(): string | null {
  // Prioritas: URL param > session storage
  const urlCode = getReferralCodeFromUrl()
  if (urlCode) {
    saveReferralCodeToSession(urlCode)
    return urlCode
  }
  
  return getReferralCodeFromSession()
}
