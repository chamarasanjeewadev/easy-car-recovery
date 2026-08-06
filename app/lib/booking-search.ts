import { z } from 'zod'

export const sizeOptions = ['car', 'suv', 'van'] as const
export const conditionOptions = ['drives', 'rolls', 'winch'] as const

export const bookingSearchSchema = z.object({
  reg: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  fromLat: z.coerce.number().optional(),
  fromLng: z.coerce.number().optional(),
  toLat: z.coerce.number().optional(),
  toLng: z.coerce.number().optional(),
  fromPostcode: z.string().optional(),
  toPostcode: z.string().optional(),
  size: z.enum(sizeOptions).optional(),
  condition: z.enum(conditionOptions).optional(),
  date: z.string().optional(),
  slot: z.string().optional(),
})

export type BookingSearch = z.infer<typeof bookingSearchSchema>
export type Size = (typeof sizeOptions)[number]
export type Condition = (typeof conditionOptions)[number]

export function sizeLabel(size: Size): string {
  return size === 'car' ? 'Car · saloon' : size === 'suv' ? 'SUV · 4×4' : 'Van · LCV'
}

export function conditionLabel(condition: Condition): string {
  return condition === 'drives' ? 'Drives on' : condition === 'rolls' ? 'Non-runner · rolls' : 'Winch required'
}

export const successSearchSchema = z.object({
  requestId: z.coerce.number(),
  reg: z.string().optional(),
  date: z.string().optional(),
  slot: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})

export type SuccessSearch = z.infer<typeof successSearchSchema>
