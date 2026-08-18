import { useCallback, useEffect, useRef, useState } from 'react'
import { sendOtp as apiSendOtp, verifyOtp as apiVerifyOtp, type OtpChannel } from '~/lib/api/otp'
import { readVerifiedProof, saveVerifiedProof } from '~/lib/otp-verification'

export type OtpStatus = 'idle' | 'sending' | 'sent' | 'verifying' | 'verified' | 'error'

const RESEND_SECONDS = 60

/**
 * Drives the WhatsApp/SMS verification UI. The `verify` step is the sole source
 * of truth for "verified" — it only flips to verified on a real backend success,
 * bound to the exact E.164 number, and persists the signed proof (see
 * otp-verification.ts). Editing the number naturally invalidates the badge via
 * isVerifiedForPhone().
 */
export function useOtp() {
  const [status, setStatus] = useState<OtpStatus>('idle')
  const [channel, setChannel] = useState<OtpChannel | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null)

  // The current send token — kept out of React state so it never renders.
  const sendTokenRef = useRef<string | null>(null)

  // Hydrate the verified number from an existing session proof so returning to
  // the step shows the badge without re-verifying (the token stays in storage).
  useEffect(() => {
    const proof = readVerifiedProof()
    if (proof) {
      setVerifiedPhone(proof.phone)
      setStatus('verified')
    }
  }, [])

  useEffect(() => {
    if (resendCountdown <= 0) return
    const t = setTimeout(() => setResendCountdown((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCountdown])

  const send = useCallback(async (phoneE164: string) => {
    setStatus('sending')
    setError(null)
    try {
      const r = await apiSendOtp(phoneE164)
      sendTokenRef.current = r.token
      setChannel(r.channel)
      setStatus('sent')
      setResendCountdown(RESEND_SECONDS)
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : 'Could not send your code.')
    }
  }, [])

  const verify = useCallback(async (otp: string, phoneE164: string): Promise<boolean> => {
    if (!sendTokenRef.current) {
      setError('Please request a code first.')
      return false
    }
    setStatus('verifying')
    setError(null)
    try {
      const r = await apiVerifyOtp(otp, sendTokenRef.current)
      if (r.verified) {
        // Persist the genuine proof, bound to the exact E.164 string every gate
        // and the booking payload use (normalizeUkMobile output), so there's no
        // format-drift mismatch. The backend token is itself bound to this number.
        saveVerifiedProof(phoneE164, r.verifiedToken ?? '')
        setVerifiedPhone(phoneE164)
        setStatus('verified')
        return true
      }
      setStatus('sent')
      setError('That code is incorrect. Please try again.')
      return false
    } catch (e) {
      setStatus('sent')
      setError(e instanceof Error ? e.message : 'Could not verify your code.')
      return false
    }
  }, [])

  const reset = useCallback(() => {
    sendTokenRef.current = null
    setStatus('idle')
    setChannel(null)
    setError(null)
    setResendCountdown(0)
    setVerifiedPhone(null)
  }, [])

  const isVerifiedForPhone = useCallback(
    (phoneE164: string | null) => !!phoneE164 && verifiedPhone === phoneE164,
    [verifiedPhone],
  )

  return {
    status,
    channel,
    error,
    resendCountdown,
    canResend: resendCountdown <= 0,
    verifiedPhone,
    send,
    verify,
    reset,
    isVerifiedForPhone,
  }
}
