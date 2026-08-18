// Holds the phone-verification proof for the current booking, bound to the
// exact E.164 number it was issued for. Kept in sessionStorage — NOT the URL —
// on purpose: the verifiedToken is a signed phone-ownership credential, and the
// URL would leak it via history, the Referer header, and shareable links. It is
// read on /pay and handed to the server function that creates the PaymentIntent.
//
// sessionStorage clears on tab close and is same-origin only, so the proof does
// not outlive the checkout session or cross origins.

const KEY = 'ecr:phone-verified'
// Backend proof is short-lived; drop anything older than this locally so a stale
// tab can't submit a long-expired token.
const MAX_AGE_MS = 30 * 60 * 1000

export interface VerifiedProof {
  /** E.164 number the proof is bound to (+447…). */
  phone: string
  /** Signed verifiedToken from the backend. May be '' if the backend omitted it. */
  token: string
  /** epoch ms when verification succeeded. */
  at: number
}

export function saveVerifiedProof(phone: string, token: string): void {
  if (typeof window === 'undefined') return
  try {
    const proof: VerifiedProof = { phone, token, at: Date.now() }
    window.sessionStorage.setItem(KEY, JSON.stringify(proof))
  } catch {
    // Storage disabled/full — verification simply won't persist to /pay.
  }
}

export function readVerifiedProof(): VerifiedProof | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(KEY)
    if (!raw) return null
    const proof = JSON.parse(raw) as VerifiedProof
    if (!proof?.phone || typeof proof.at !== 'number') return null
    if (Date.now() - proof.at > MAX_AGE_MS) {
      clearVerifiedProof()
      return null
    }
    return proof
  } catch {
    return null
  }
}

/** Returns the verifiedToken iff a fresh proof exists for exactly this E.164 number. */
export function verifiedTokenForPhone(phoneE164: string | null): string | null {
  if (!phoneE164) return null
  const proof = readVerifiedProof()
  return proof && proof.phone === phoneE164 ? proof.token : null
}

/** True iff this exact number has a fresh verification proof. */
export function isPhoneVerified(phoneE164: string | null): boolean {
  if (!phoneE164) return false
  const proof = readVerifiedProof()
  return !!proof && proof.phone === phoneE164
}

export function clearVerifiedProof(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

/** Build-time kill switch: verification is on unless explicitly disabled. */
export function phoneVerificationEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_PHONE_VERIFICATION !== 'false'
}
