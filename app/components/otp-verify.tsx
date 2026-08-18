import { useState } from 'react'
import type { useOtp } from '~/lib/use-otp'
import { Icon } from './icon'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface OtpVerifyProps {
  otp: ReturnType<typeof useOtp>
  /** Current mobile normalised to E.164 (+447…), or null when not yet valid. */
  e164: string | null
  disabled?: boolean
}

/**
 * WhatsApp/SMS number verification, attached to the mobile field on /details.
 * Verified state is driven entirely by the backend `verify` result via the
 * useOtp hook — this component never claims verification on its own.
 */
export function OtpVerify({ otp, e164, disabled }: OtpVerifyProps) {
  const [code, setCode] = useState('')
  const verified = otp.isVerifiedForPhone(e164)

  if (verified) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-[var(--radius)] bg-[rgba(136,176,0,0.12)] px-4 py-3 text-sm font-semibold text-primary">
        <Icon name="check" size={15} stroke={2.5} /> Number verified
      </div>
    )
  }

  if (!e164) {
    return (
      <p className="mt-3 text-[13px] text-on-surface-variant">
        Enter your UK mobile above, then verify it so your driver can reach you.
      </p>
    )
  }

  const codeSent = otp.status === 'sent' || otp.status === 'verifying'
  const channelLabel = otp.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'

  return (
    <div className="mt-3 rounded-[var(--radius)] bg-surface-c p-4">
      {!codeSent ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[13px] font-medium text-on-surface-variant">
            <Icon name="phone" size={15} />
            We'll send a 6-digit code to your WhatsApp (or SMS) to confirm your number.
          </span>
          <Button
            size="sm"
            onClick={() => otp.send(e164)}
            disabled={disabled || otp.status === 'sending'}
          >
            {otp.status === 'sending' ? 'Sending…' : 'Verify number'}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-on-surface-variant">
            Enter the 6-digit code sent via <b>{channelLabel}</b> to {e164}.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              aria-label="6-digit verification code"
              className="w-32 tracking-[0.3em]"
              disabled={disabled}
            />
            <Button
              size="sm"
              onClick={() => otp.verify(code, e164)}
              disabled={disabled || code.length !== 6 || otp.status === 'verifying'}
            >
              {otp.status === 'verifying' ? 'Checking…' : 'Confirm code'}
            </Button>
            <button
              type="button"
              onClick={() => otp.send(e164)}
              disabled={disabled || !otp.canResend}
              className="text-[13px] font-semibold text-primary underline underline-offset-2 disabled:text-on-surface-variant disabled:no-underline"
            >
              {otp.canResend ? 'Resend code' : `Resend in ${otp.resendCountdown}s`}
            </button>
          </div>
        </div>
      )}
      {otp.error && <p className="mt-2 text-xs font-medium text-[#b00020]">{otp.error}</p>}
    </div>
  )
}
