export interface MockVehicle {
  make: string
  model: string
  trim: string
  year: number
  fuel: string
  colour: string
  motUntil: string
  plate: string
}

const FALLBACK: MockVehicle = {
  make: 'Volkswagen',
  model: 'Golf',
  trim: '1.5 TSI Match',
  year: 2019,
  fuel: 'Petrol',
  colour: 'Pure White',
  motUntil: 'Jul 2026',
  plate: 'LG19 KXR',
}

const PRESETS: Record<string, MockVehicle> = {
  LG19KXR: FALLBACK,
  LK21XYZ: {
    make: 'Mercedes-Benz',
    model: 'GLC 300',
    trim: 'AMG Line Premium',
    year: 2021,
    fuel: 'Hybrid',
    colour: 'Obsidian Black',
    motUntil: 'Mar 2027',
    plate: 'LK21 XYZ',
  },
  AB12CDE: {
    make: 'BMW',
    model: '320d',
    trim: 'M Sport',
    year: 2018,
    fuel: 'Diesel',
    colour: 'Alpine White',
    motUntil: 'Sep 2026',
    plate: 'AB12 CDE',
  },
}

export function lookupVehicle(reg?: string): MockVehicle {
  if (!reg) return FALLBACK
  const key = reg.replace(/\s+/g, '').toUpperCase()
  return PRESETS[key] ?? { ...FALLBACK, plate: formatPlate(reg) }
}

export function formatPlate(reg: string): string {
  const stripped = reg.replace(/\s+/g, '').toUpperCase()
  if (stripped.length < 5) return stripped
  return `${stripped.slice(0, 4)} ${stripped.slice(4)}`
}
