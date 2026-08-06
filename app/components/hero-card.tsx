import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from './ui/button'
import { Icon } from './icon'
import { PlateInput } from './plate-input'
import { PostcodeInput, type PlaceValue } from './postcode-input'
import { freeLookup, formatPlate, type FreeLookupResult } from '~/lib/api/free-lookup'
import { titleCase } from '~/lib/api/lookup-vehicle'

export function HeroCard() {
  const [reg, setReg] = useState('')
  const [vehicle, setVehicle] = useState<FreeLookupResult | null>(null)
  const [checkErr, setCheckErr] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [fromPlace, setFromPlace] = useState<PlaceValue | null>(null)
  const [toPlace, setToPlace] = useState<PlaceValue | null>(null)
  const navigate = useNavigate()

  const check = async () => {
    if (!reg.trim() || checking) return
    setChecking(true)
    setCheckErr(null)
    try {
      setVehicle(await freeLookup(reg))
    } catch (err) {
      setVehicle(null)
      setCheckErr(err instanceof Error ? err.message : 'Vehicle check failed. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  const submit = () => {
    navigate({
      to: '/quote',
      search: {
        reg: (vehicle?.registrationNumber ?? reg).replace(/\s+/g, '').toUpperCase() || undefined,
        from: fromPlace?.description || from || undefined,
        to: toPlace?.description || to || undefined,
        fromLat: fromPlace?.lat,
        fromLng: fromPlace?.lng,
        toLat: toPlace?.lat,
        toLng: toPlace?.lng,
        fromPostcode: fromPlace?.postcode,
        toPostcode: toPlace?.postcode,
      },
    })
  }

  return (
    <div className="relative rounded-[var(--radius-lg)] bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="space-y-3.5">
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold">Vehicle reg</label>
          <div className="flex flex-wrap items-center gap-2.5">
            <PlateInput
              value={vehicle ? formatPlate(vehicle.registrationNumber) : reg}
              onChange={(v) => {
                setReg(v)
                if (vehicle) setVehicle(null)
              }}
            />
            <Button onClick={check} disabled={checking || !reg.trim()} variant={vehicle ? 'tonal' : 'primary'}>
              {checking ? 'Checking…' : vehicle ? 'Checked' : 'Check vehicle'}
            </Button>
          </div>
          {checkErr && <p className="text-xs font-medium text-error">{checkErr}</p>}
        </div>

        {vehicle && (
          <div className="rounded-[var(--radius)] bg-surface-low p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-bold tracking-tight">
                  {titleCase(vehicle.make ?? '')}
                  {vehicle.yearOfManufacture ? ` · ${vehicle.yearOfManufacture}` : ''}
                </div>
                <div className="text-[13px] text-on-surface-variant">
                  {[vehicle.colour, vehicle.fuelType].filter(Boolean).map((s) => titleCase(s!)).join(' · ')}
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(136,176,0,0.16)] px-2.5 py-1 text-xs font-bold text-primary">
                <Icon name="check" size={12} stroke={2.5} /> DVLA
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusChip label="MOT" value={vehicle.motStatus} okValue="valid" />
              <StatusChip label="Tax" value={vehicle.taxStatus} okValue="taxed" />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold">Pick-up location</label>
          <PostcodeInput
            value={from}
            onChange={(v) => {
              setFrom(v)
              if (fromPlace && v !== fromPlace.description) setFromPlace(null)
            }}
            onPick={(p) => {
              setFromPlace(p)
              setFrom(p.description)
            }}
            placeholder="Postcode or address"
            autoComplete="postal-code"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold">Drop-off location</label>
          <PostcodeInput
            value={to}
            onChange={(v) => {
              setTo(v)
              if (toPlace && v !== toPlace.description) setToPlace(null)
            }}
            onPick={(p) => {
              setToPlace(p)
              setTo(p.description)
            }}
            placeholder="Garage, home, or address"
          />
        </div>
      </div>

      <Button size="lg" className="mt-5 w-full" onClick={submit}>
        Get recovery quotes <Icon name="arrow-right" size={16} />
      </Button>
      <p className="mt-3 text-center text-xs text-on-surface-variant">
        Free DVLA check · No payment online · Drivers quote your job
      </p>
    </div>
  )
}

function StatusChip({ label, value, okValue }: { label: string; value?: string | null; okValue: string }) {
  if (!value) return null
  const ok = value.toLowerCase() === okValue
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        ok ? 'bg-[rgba(136,176,0,0.16)] text-primary' : 'bg-[#fdf3f4] text-error'
      }`}
    >
      {label}: {value}
    </span>
  )
}
