import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { bookingSearchSchema, type Condition, type Size } from '~/lib/booking-search'
import { conditionLabel, priceQuote, sizeLabel } from '~/lib/mock-quote'
import { lookupVehicleFn, titleCase, type VehicleResult } from '~/lib/api/lookup-vehicle'
import { approxRoadMiles } from '~/lib/distance'
import { Stepper } from '~/components/stepper'
import { RouteMiniMap } from '~/components/route-mini-map'
import { SegmentControl } from '~/components/segment-control'
import { BookingSummary } from '~/components/booking-summary'
import { PlateInput } from '~/components/plate-input'
import { PostcodeInput, type PlaceValue } from '~/components/postcode-input'
import { Icon } from '~/components/icon'
import { Button } from '~/components/ui/button'

export const Route = createFileRoute('/quote')({
  validateSearch: bookingSearchSchema,
  head: () => ({
    meta: [
      { title: 'Get a recovery quote — Easy Car Recovery' },
      {
        name: 'description',
        content:
          'Enter your reg and locations for an instant indicative vehicle recovery quote. No payment online.',
      },
    ],
    links: [{ rel: 'canonical', href: 'https://easycarrecovery.co.uk/quote' }],
  }),
  component: QuotePage,
})

const FALLBACK_DISTANCE_MI = 12

function QuotePage() {
  const search = Route.useSearch()
  const navigate = useNavigate()

  const [size, setSize] = useState<Size>(search.size ?? 'car')
  const [condition, setCondition] = useState<Condition>(search.condition ?? 'drives')

  const [vehicle, setVehicle] = useState<VehicleResult | null>(null)
  const [vehicleErr, setVehicleErr] = useState<string | null>(null)
  const [vehicleBusy, setVehicleBusy] = useState(false)
  const [regInput, setRegInput] = useState(search.reg ?? '')

  const [fromText, setFromText] = useState(search.from ?? '')
  const [toText, setToText] = useState(search.to ?? '')
  const [fromCoord, setFromCoord] = useState<PlaceValue | null>(
    search.fromLat != null && search.fromLng != null && search.from
      ? { description: search.from, lat: search.fromLat, lng: search.fromLng }
      : null,
  )
  const [toCoord, setToCoord] = useState<PlaceValue | null>(
    search.toLat != null && search.toLng != null && search.to
      ? { description: search.to, lat: search.toLat, lng: search.toLng }
      : null,
  )

  const distanceMi = useMemo(() => {
    if (fromCoord && toCoord) return approxRoadMiles(fromCoord, toCoord)
    return FALLBACK_DISTANCE_MI
  }, [fromCoord, toCoord])

  const quote = priceQuote({ size, condition, distanceMiles: distanceMi })

  // Vehicle lookup whenever reg from search changes
  useEffect(() => {
    const reg = (search.reg ?? '').replace(/\s+/g, '').toUpperCase()
    if (reg.length < 2) {
      setVehicle(null)
      setVehicleErr(null)
      return
    }
    let cancelled = false
    setVehicleBusy(true)
    setVehicleErr(null)
    lookupVehicleFn({ data: { reg } })
      .then((v) => {
        if (cancelled) return
        setVehicle(v)
      })
      .catch((err: Error) => {
        if (cancelled) return
        setVehicle(null)
        setVehicleErr(err.message)
      })
      .finally(() => {
        if (!cancelled) setVehicleBusy(false)
      })
    return () => {
      cancelled = true
    }
  }, [search.reg])

  // keep size + condition in URL
  useEffect(() => {
    navigate({
      to: '/quote',
      search: (prev) => ({ ...prev, size, condition }),
      replace: true,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, condition])

  const submitReg = () => {
    const r = regInput.replace(/\s+/g, '').toUpperCase()
    if (!r) return
    navigate({
      to: '/quote',
      search: (prev) => ({ ...prev, reg: r }),
      replace: true,
    })
  }

  const persistFrom = (p: PlaceValue) => {
    setFromCoord(p)
    setFromText(p.description)
    navigate({
      to: '/quote',
      search: (prev) => ({
        ...prev,
        from: p.description,
        fromLat: p.lat,
        fromLng: p.lng,
        fromPostcode: p.postcode,
      }),
      replace: true,
    })
  }
  const persistTo = (p: PlaceValue) => {
    setToCoord(p)
    setToText(p.description)
    navigate({
      to: '/quote',
      search: (prev) => ({
        ...prev,
        to: p.description,
        toLat: p.lat,
        toLng: p.lng,
        toPostcode: p.postcode,
      }),
      replace: true,
    })
  }

  const fromLabel = fromCoord?.description || search.from || 'Pick-up location'
  const toLabel = toCoord?.description || search.to || 'Drop-off location'
  const distanceUnknown = !fromCoord || !toCoord

  return (
    <div className="container-app py-6 md:py-8">
      <div className="mb-7 flex items-center justify-between gap-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/">
            <Icon name="arrow-left" size={16} /> Back
          </Link>
        </Button>
        <Stepper step={0} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-4">
          <div className="rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Vehicle</span>
              {vehicle && !vehicleErr && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(136,176,0,0.16)] px-2.5 py-1 text-xs font-bold text-primary">
                  <Icon name="check" size={12} stroke={2.5} /> Vehicle verified
                </span>
              )}
              {vehicleBusy && (
                <span className="text-xs text-on-surface-variant">Checking vehicle…</span>
              )}
            </div>

            {vehicle && !vehicleErr ? (
              <div className="flex flex-wrap items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-[var(--radius)] bg-surface-c">
                  <Icon name="car" size={26} />
                </div>
                <div className="min-w-[160px] flex-1">
                  <div className="text-lg font-bold tracking-tight">
                    {titleCase(vehicle.makeModel || vehicle.make)}
                  </div>
                  {vehicle.color && (
                    <div className="text-sm text-on-surface-variant">{titleCase(vehicle.color)}</div>
                  )}
                </div>
                <PlateInput value={vehicle.plate} onChange={() => {}} size="sm" readOnly />
              </div>
            ) : (
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[180px]">
                  <label className="text-[13px] font-semibold">Vehicle reg</label>
                  <div className="mt-2">
                    <PlateInput value={regInput} onChange={setRegInput} />
                  </div>
                  {vehicleErr && (
                    <p className="mt-2 text-xs text-[#b00020]">{vehicleErr}</p>
                  )}
                </div>
                <Button onClick={submitReg} disabled={vehicleBusy || !regInput}>
                  {vehicleBusy ? 'Checking…' : 'Look up'}
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Route</span>
              <span className="text-sm text-on-surface-variant">
                Total <strong className="ml-1.5 text-lg font-bold text-on-surface">£{quote.total}</strong>
              </span>
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-semibold">Pick-up</label>
                <PostcodeInput
                  value={fromText}
                  onChange={(v) => {
                    setFromText(v)
                    if (fromCoord && v !== fromCoord.description) setFromCoord(null)
                  }}
                  onPick={persistFrom}
                  placeholder="Postcode or address"
                  autoComplete="postal-code"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-semibold">Drop-off</label>
                <PostcodeInput
                  value={toText}
                  onChange={(v) => {
                    setToText(v)
                    if (toCoord && v !== toCoord.description) setToCoord(null)
                  }}
                  onPick={persistTo}
                  placeholder="Garage, home, or address"
                />
              </div>
            </div>

            <RouteMiniMap fromLabel={fromLabel} toLabel={toLabel} />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Distance" value={distanceUnknown ? 'Pick both' : `${distanceMi} mi`} />
              <Stat label="Availability" value="24/7" />
              <Stat label="Driver" value="Vetted network" />
              <Stat label="Truck" value="Flatbed" />
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Vehicle size</span>
              <span className="text-[13px] text-on-surface-variant">Used to assign the right truck</span>
            </div>
            <SegmentControl
              value={size}
              onChange={setSize}
              options={[
                { value: 'car', label: 'Car · saloon' },
                { value: 'suv', label: 'SUV · 4×4' },
                { value: 'van', label: 'Van · LCV' },
              ]}
            />
          </div>

          <div className="rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Condition</span>
              <span className="text-[13px] text-on-surface-variant">Affects winch & equipment</span>
            </div>
            <SegmentControl
              value={condition}
              onChange={setCondition}
              options={[
                { value: 'drives', label: 'Drives on' },
                { value: 'rolls', label: 'Rolls', extra: '+£25' },
                { value: 'winch', label: 'Winch', extra: '+£60' },
              ]}
            />
            {condition === 'winch' && (
              <div className="mt-4 flex items-center gap-2.5 rounded-[var(--radius)] bg-[rgba(136,176,0,0.10)] px-4 py-3 text-sm font-medium text-primary">
                <Icon name="spark" size={14} />
                A winch operator will be dispatched. Wheels-locked vehicles add 10–15 minutes to ETA.
              </div>
            )}
          </div>

        </div>

        <aside className="lg:sticky lg:top-24">
          <BookingSummary
            rows={[
              { label: `Base · ${sizeLabel(size).split(' ')[0]}`, value: `£${quote.base}` },
              {
                label: distanceUnknown ? 'Distance · estimate' : `Distance · ${distanceMi} mi`,
                value: `£${quote.distanceFee}`,
              },
              ...(quote.conditionFee > 0
                ? [{ label: conditionLabel(condition), value: `+£${quote.conditionFee}` }]
                : []),
              { label: 'VAT included', value: '—' },
            ]}
            total={quote.total}
            fine={
              distanceUnknown
                ? 'Pick locations for an accurate estimate'
                : 'Indicative price — confirmed before dispatch'
            }
            ctaLabel="Pick a time"
            ctaHref={{ to: '/date', search: { ...search, size, condition } }}
          />
          <p className="mt-3 text-center text-xs text-on-surface-variant">
            No payment taken online — we confirm the final price with you first.
          </p>
        </aside>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius)] bg-surface-low p-3.5">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-on-surface-variant">{label}</div>
      <div className="text-lg font-bold tracking-tight">{value}</div>
    </div>
  )
}
