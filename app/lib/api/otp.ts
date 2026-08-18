// Browser-side WhatsApp/SMS number verification against the shared TowMyCar
// backend. Deliberately runs in the browser (never from the Cloudflare Worker)
// so the backend's per-IP+phone rate limit applies per visitor — the same
// reason the free DVLA lookup is browser-side. easycarrecovery.co.uk is already
// in the backend CORS allowlist.
//
// Security notes:
//  - These are public, unauthenticated endpoints. We send NO credentials/cookies
//    (`credentials` defaults to 'same-origin' and the API is cross-origin), which
//    keeps the request free of any CSRF/ambient-auth surface.
//  - The only proof of ownership is the backend-issued `verifiedToken` (a signed
//    JWT bound to the phone number). We never synthesise a "verified" flag on the
//    client; callers must derive verification from a real `verify` success.
//  - We never log the OTP code or the verifiedToken.

function apiBase(): string {
  return import.meta.env.VITE_TOWMYCAR_API_BASE_URL || 'https://api.towmycar.uk'
}

export type OtpChannel = 'whatsapp' | 'sms'

export interface SendOtpResult {
  token: string
  channel: OtpChannel
  expiresIn?: number
}

/** Requests a 6-digit code for an E.164 UK number (+447…). */
export async function sendOtp(phoneNumberE164: string): Promise<SendOtpResult> {
  let res: Response
  try {
    res = await fetch(`${apiBase()}/user/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ phoneNumber: phoneNumberE164, purpose: 'customer' }),
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    throw new Error('Could not send your code right now. Please try again.')
  }

  if (res.status === 429) {
    throw new Error('Too many attempts — please wait a few minutes, then try again.')
  }
  if (!res.ok) {
    throw new Error('Could not send a code to that number. Check it and try again.')
  }

  const body = (await res.json().catch(() => ({}))) as {
    token?: string
    channel?: OtpChannel
    expiresIn?: number
    alreadyRegistered?: boolean
  }

  // No token means the backend won't start a customer verification for this
  // number (e.g. the driver "already registered" branch). Fail closed.
  if (!body.token) {
    throw new Error('We could not verify this number. Please call us to book.')
  }

  return { token: body.token, channel: body.channel ?? 'sms', expiresIn: body.expiresIn }
}

export interface VerifyOtpResult {
  verified: boolean
  /** Signed proof of phone ownership, bound to `phoneNumber`. Undefined if the backend omits it. */
  verifiedToken?: string
  /** Echoed E.164 number the token is bound to. */
  phoneNumber?: string
}

/** Confirms a 6-digit code against the token from {@link sendOtp}. */
export async function verifyOtp(otp: string, token: string): Promise<VerifyOtpResult> {
  // Client-side shape guard: exactly 6 digits. Avoids burning the backend's
  // limited verify attempts on obviously malformed input.
  const code = otp.replace(/\D/g, '')
  if (code.length !== 6) {
    throw new Error('Enter the 6-digit code we sent you.')
  }

  let res: Response
  try {
    res = await fetch(`${apiBase()}/user/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ otp: code, token }),
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    throw new Error('Could not check your code right now. Please try again.')
  }

  if (res.status === 429) {
    throw new Error('Too many attempts — please wait a few minutes, then try again.')
  }
  if (!res.ok) {
    // 400 = wrong or expired code (backend also caps attempts per code).
    throw new Error('That code is incorrect or has expired. Please try again.')
  }

  return (await res.json().catch(() => ({ verified: false }))) as VerifyOtpResult
}
