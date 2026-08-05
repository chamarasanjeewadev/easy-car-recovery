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

export const successSearchSchema = z.object({
  requestId: z.coerce.number(),
  reg: z.string().optional(),
  date: z.string().optional(),
  slot: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  total: z.coerce.number().optional(),
})

export type SuccessSearch = z.infer<typeof successSearchSchema>
