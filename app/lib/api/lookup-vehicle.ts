import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export interface VehicleResult {
  plate: string
  make: string
  model: string
  trim: string
  year: number
  fuel: string
  colour: string
  motUntil: string
}

const inputSchema = z.object({
  reg: z.string().min(2).max(10),
})

const PAID_URL = 'https://api.checkcardetails.co.uk/vehicledata/ukvehicledata'
const DVLA_URL = 'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function formatPlate(reg: string): string {
  const stripped = reg.replace(/\s+/g, '').toUpperCase()
  if (stripped.length < 5) return stripped
  return `${stripped.slice(0, 4)} ${stripped.slice(4)}`
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

function formatMotUntil(iso?: string, year?: number): string {
  if (iso) {
    const d = new Date(iso)
    if (!Number.isNaN(d.getTime())) return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
  }
  if (year) {
    const next = new Date()
    next.setFullYear(next.getFullYear() + 1)
    return `Due ${MONTHS[next.getMonth()]} ${next.getFullYear()}`
  }
  return 'Verify on the day'
}

interface PaidResponse {
  VehicleRegistration?: {
    Make?: string
    Model?: string
    MakeModel?: string
    YearOfManufacture?: string
    Colour?: string
    FuelType?: string
  }
  SmmtDetails?: {
    Range?: string
    Series?: string
    BodyStyle?: string
    ModelVariant?: string
  }
}

async function callPaid(reg: string): Promise<VehicleResult | null> {
  const url = process.env.VEHICLE_REGISTRATION_API_URL || PAID_URL
  const apiKey = process.env.VEHICLE_REGISTRATION_API_KEY
  if (!apiKey) return null
  const u = new URL(url)
  u.searchParams.set('apikey', apiKey)
  u.searchParams.set('vrm', reg)
  const res = await fetch(u.toString(), { headers: { Accept: 'application/json' } })
  if (!res.ok) return null
  const data = (await res.json()) as PaidResponse
  const v = data.VehicleRegistration
  const s = data.SmmtDetails
  if (!v?.Make) return null
  const make = titleCase(v.Make)
  const rawModel = v.Model ?? s?.Range ?? ''
  const model = titleCase(rawModel.split(' ')[0] || rawModel)
  const trim = s?.ModelVariant
    ? s.ModelVariant.replace(new RegExp(`^${rawModel}\\s*`, 'i'), '').trim() || s.BodyStyle || ''
    : v.Model && v.Model.split(' ').slice(1).join(' ').trim()
      ? titleCase(v.Model.split(' ').slice(1).join(' '))
      : (s?.BodyStyle ?? '')
  const year = v.YearOfManufacture ? Number(v.YearOfManufacture) : new Date().getFullYear()
  return {
    plate: formatPlate(reg),
    make,
    model: model || '',
    trim: trim || '',
    year: Number.isFinite(year) ? year : new Date().getFullYear(),
    fuel: titleCase(v.FuelType ?? '—'),
    colour: titleCase(v.Colour ?? '—'),
    motUntil: formatMotUntil(undefined, year),
  }
}

interface DvlaResponse {
  registrationNumber?: string
  make?: string
  colour?: string
  fuelType?: string
  yearOfManufacture?: number
  motExpiryDate?: string
}

async function callDvla(reg: string): Promise<VehicleResult | null> {
  const apiKey = process.env.GOV_VEHICLE_API_KEY
  if (!apiKey) return null
  const res = await fetch(DVLA_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ registrationNumber: reg }),
  })
  if (!res.ok) return null
  const v = (await res.json()) as DvlaResponse
  if (!v.make) return null
  return {
    plate: formatPlate(v.registrationNumber ?? reg),
    make: titleCase(v.make),
    model: '',
    trim: v.fuelType ? titleCase(v.fuelType) : '',
    year: v.yearOfManufacture ?? new Date().getFullYear(),
    fuel: titleCase(v.fuelType ?? '—'),
    colour: titleCase(v.colour ?? '—'),
    motUntil: formatMotUntil(v.motExpiryDate, v.yearOfManufacture),
  }
}

export const lookupVehicleFn = createServerFn({ method: 'POST' })
  .inputValidator(inputSchema)
  .handler(async ({ data }): Promise<VehicleResult> => {
    const reg = data.reg.replace(/\s+/g, '').toUpperCase()

    const provider = process.env.VEHICLE_VERIFICATION_PROVIDER ?? 'PAID'
    const primary = provider === 'GOV' ? callDvla : callPaid
    const secondary = provider === 'GOV' ? callPaid : callDvla

    let result: VehicleResult | null = null
    try {
      result = await primary(reg)
    } catch {
      // fall through to secondary
    }
    if (!result) {
      try {
        result = await secondary(reg)
      } catch {
        // ignore
      }
    }
    if (!result) {
      throw new Error(`Could not look up ${reg}. Check the plate and try again.`)
    }
    return result
  })
