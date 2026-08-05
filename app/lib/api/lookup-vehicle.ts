import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export interface VehicleResult {
  /** Display plate, e.g. "LG19 KXR" */
  plate: string
  /** Normalized reg (no spaces, uppercase) — what the recovery request submits */
  regNo: string
  make: string
  makeModel: string
  color: string
  /** Opaque base64-encoded kerb weight from the TowMyCar API; '' if unknown */
  weight: string
}

const inputSchema = z.object({
  reg: z.string().min(2).max(10),
})

function formatPlate(reg: string): string {
  const stripped = reg.replace(/\s+/g, '').toUpperCase()
  if (stripped.length < 5) return stripped
  return `${stripped.slice(0, 4)} ${stripped.slice(4)}`
}

export function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

interface VerifyResponse {
  weight?: string | null
  make?: string | null
  makeModel?: string | null
  color?: string | null
  regNo?: string | null
}

export const lookupVehicleFn = createServerFn({ method: 'POST' })
  .inputValidator(inputSchema)
  .handler(async ({ data }): Promise<VehicleResult> => {
    const reg = data.reg.replace(/\s+/g, '').toUpperCase()

    const base = process.env.TOWMYCAR_API_BASE_URL
    if (!base) {
      throw new Error('Vehicle lookup is not configured. Please try again later.')
    }

    let res: Response
    try {
      res = await fetch(`${base}/user/verify-vehicle-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ registrationNumber: reg }),
        signal: AbortSignal.timeout(10_000),
      })
    } catch {
      throw new Error('Vehicle lookup is temporarily unavailable. Please try again.')
    }

    if (!res.ok) {
      throw new Error(`Could not look up ${formatPlate(reg)}. Check the plate and try again.`)
    }

    const v = (await res.json()) as VerifyResponse
    if (!v.make && !v.makeModel) {
      throw new Error(`Could not look up ${formatPlate(reg)}. Check the plate and try again.`)
    }

    return {
      plate: formatPlate(v.regNo ?? reg),
      regNo: (v.regNo ?? reg).replace(/\s+/g, '').toUpperCase(),
      make: v.make ?? '',
      makeModel: v.makeModel ?? v.make ?? '',
      color: v.color ?? '',
      weight: v.weight ?? '',
    }
  })
