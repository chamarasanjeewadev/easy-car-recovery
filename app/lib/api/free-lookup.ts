import { z } from 'zod'

// Free DVLA lookup on the TowMyCar platform — the same check used on
// towmycar.uk's home page. Called directly from the browser so the API's
// per-IP rate limit (10 lookups / 15 min) applies per visitor, not to the
// server's shared egress IPs. Requires easycarrecovery.co.uk in the
// towmycar-backend CORS allowlist.
const responseSchema = z.object({
  registrationNumber: z.string(),
  make: z.string().nullish(),
  colour: z.string().nullish(),
  fuelType: z.string().nullish(),
  yearOfManufacture: z.number().nullish(),
  motStatus: z.string().nullish(),
  motExpiryDate: z.string().nullish(),
  taxStatus: z.string().nullish(),
  taxDueDate: z.string().nullish(),
})

export type FreeLookupResult = z.infer<typeof responseSchema>

function apiBase(): string {
  return import.meta.env.VITE_TOWMYCAR_API_BASE_URL || 'https://api.towmycar.uk'
}

export function formatPlate(reg: string): string {
  const stripped = reg.replace(/\s+/g, '').toUpperCase()
  if (stripped.length < 5) return stripped
  return `${stripped.slice(0, 4)} ${stripped.slice(4)}`
}

export async function freeLookup(reg: string): Promise<FreeLookupResult> {
  const cleaned = reg.replace(/\s+/g, '').toUpperCase()
  if (!/^[A-Z0-9]{2,8}$/.test(cleaned)) {
    throw new Error('Enter a valid UK registration number.')
  }

  let res: Response
  try {
    res = await fetch(`${apiBase()}/vehicle-check/free-lookup?reg=${encodeURIComponent(cleaned)}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    throw new Error('Vehicle check is temporarily unavailable. Please try again.')
  }

  if (res.status === 429) {
    throw new Error('Too many checks from your connection — please try again in a few minutes.')
  }
  if (!res.ok) {
    throw new Error(`Could not find ${formatPlate(cleaned)}. Check the plate and try again.`)
  }

  const parsed = responseSchema.safeParse(await res.json())
  if (!parsed.success || !parsed.data.make) {
    throw new Error(`Could not find ${formatPlate(cleaned)}. Check the plate and try again.`)
  }
  return parsed.data
}
