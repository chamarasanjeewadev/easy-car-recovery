import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  bookingSearchSchema,
  conditionLabel,
  journeyGaps,
  journeyGapLabels,
  requestTypeOptions,
  requestTypeLabel,
  serviceNeedsDropoff,
  sizeLabel,
  vehicleClassOptions,
  type Condition,
  type RequestType,
  type Size,
} from '~/lib/booking-search'
import { lookupVehicleFn, titleCase, type VehicleResult } from '~/lib/api/lookup-vehicle'
import { approxRoadMiles } from '~/lib/distance'
import { Stepper } from '~/components/stepper'
import { RouteMiniMap } from '~/components/route-mini-map'
import { SegmentControl } from '~/components/segment-control'
import { BookingSummary } from '~/components/booking-summary'
import { useQuote } from '~/lib/use-quote'
import { PlateInput } from '~/components/plate-input'
import { PostcodeInput, type PlaceValue } from '~/components/postcode-input'
import { Icon } from '~/components/icon'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { SITE_URL } from '~/lib/site'

export const Route = createFileRoute('/quote')({
  validateSearch: bookingSearchSchema,
  head: () => ({
    meta: [
      { title: 'Request vehicle recovery — Easy Car Recovery' },
      {
        name: 'description',
        content:
          'Tell us your vehicle and route, get a fixed price, and book vetted recovery online in minutes.',
      },
    ],
    links: [{ rel: 'canonical', href: `${SITE_URL}/quote` }],
  }),
  component: QuotePage,
})

const FALLBACK_DISTANCE_MI = 12

function QuotePage() {
  const search = Route.useSearch()
  const navigate = useNavigate()

  const [size, setSize] = useState<Size>(search.size ?? 'car')
  const [condition, setCondition] = useState<Condition>(search.condition ?? 'drives')
  const [requestType, setRequestType] = useState<RequestType>(search.requestType ?? 'RECOVERY')
  const needsDropoff = serviceNeedsDropoff(requestType)
  const { amountPence, loading: priceLoading } = useQuote({ ...search, requestType, size })

  const [vehicle, setVehicle] = useState<VehicleResult | null>(null)
  const [vehicleErr, setVehicleErr] = useState<string | null>(null)
  const [vehicleBusy, setVehicleBusy] = useState(false)
  const [regInput, setRegInput] = useState(search.reg ?? '')

  // Manual (reg-less) vehicle fallback when the DVLA lookup can't find the plate.
  const [manualOpen, setManualOpen] = useState(!!search.manualVehicle)
  const [make, setMake] = useState(search.make ?? '')
  const [makeModel, setMakeModel] = useState(search.makeModel ?? '')
  const [vehicleClass, setVehicleClass] = useState(search.vehicleClass ?? '')

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

  // keep size + condition + service type in URL
  useEffect(() => {
    navigate({
      to: '/quote',
      search: (prev) => ({ ...prev, size, condition, requestType }),
      replace: true,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, condition, requestType])

  const saveManualVehicle = () => {
    if (!make.trim() || !makeModel.trim()) return
    setManualOpen(false)
    navigate({
      to: '/quote',
      search: (prev) => ({
        ...prev,
        make: make.trim(),
        makeModel: makeModel.trim(),
        vehicleClass: vehicleClass || undefined,
        manualVehicle: true,
      }),
      replace: true,
    })
  }

  const clearManualVehicle = () => {
    setManualOpen(true)
    navigate({
      to: '/quote',
      search: (prev) => ({ ...prev, manualVehicle: undefined }),
      replace: true,
    })
  }

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
  const distanceUnknown = needsDropoff && (!fromCoord || !toCoord)
  const vehicleVerified = !!vehicle && !vehicleErr
  const manualSaved = !vehicleVerified && !!search.manualVehicle && !!search.makeModel

  // Gate progression on the same journey requirements /details enforces, but
  // evaluate them here — where the fields live — so the user gets specific inline
  // guidance instead of sailing through and hitting a dead-end two steps later.
  // A typed-but-not-looked-up reg counts as present (we persist it on proceed),
  // so the CTA isn't blocked just because the "Look up" button wasn't pressed.
  const pendingReg = regInput.replace(/\s+/g, '').toUpperCase()
  const proceedSearch = { ...search, requestType, reg: search.reg || pendingReg || undefined }
  const proceedGaps = journeyGaps(proceedSearch).filter((g) => g !== 'date' && g !== 'slot')
  const canProceed = proceedGaps.length === 0

  const proceed = () => {
    if (!canProceed) return
    navigate({
      to: '/date',
      search: { ...search, size, condition, requestType, reg: search.reg || pendingReg || undefined },
    })
  }

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
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Service</span>
              <span className="text-[13px] text-on-surface-variant">What do you need?</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {requestTypeOptions.map((opt) => {
                const active = opt.value === requestType
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRequestType(opt.value)}
                    className={`rounded-[var(--radius)] px-3 py-2.5 text-sm font-semibold transition ${
                      active
                        ? 'bg-primary-c text-on-primary-c shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                        : 'bg-surface-c text-on-surface-variant hover:text-on-surface'
                    }`}
                    aria-pressed={active}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
            {!needsDropoff && (
              <div className="mt-4 flex items-center gap-2.5 rounded-[var(--radius)] bg-[rgba(136,176,0,0.10)] px-4 py-3 text-sm font-medium text-primary">
                <Icon name="spark" size={14} />
                On-site service — no drop-off needed. We come to your vehicle.
              </div>
            )}
          </div>

          <div className="rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Vehicle</span>
              {(vehicleVerified || manualSaved) && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(136,176,0,0.16)] px-2.5 py-1 text-xs font-bold text-primary">
                  <Icon name="check" size={12} stroke={2.5} /> {vehicleVerified ? 'Vehicle verified' : 'Vehicle added'}
                </span>
              )}
              {vehicleBusy && (
                <span className="text-xs text-on-surface-variant">Checking vehicle…</span>
              )}
            </div>

            {vehicleVerified ? (
              <div className="flex flex-wrap items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-[var(--radius)] bg-surface-c">
                  <Icon name="car" size={26} />
                </div>
                <div className="min-w-[160px] flex-1">
                  <div className="text-lg font-bold tracking-tight">
                    {titleCase(vehicle!.makeModel || vehicle!.make)}
                  </div>
                  {vehicle!.color && (
                    <div className="text-sm text-on-surface-variant">{titleCase(vehicle!.color)}</div>
                  )}
                </div>
                <PlateInput value={vehicle!.plate} onChange={() => {}} size="sm" readOnly />
              </div>
            ) : manualSaved && !manualOpen ? (
              <div className="flex flex-wrap items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-[var(--radius)] bg-surface-c">
                  <Icon name="car" size={26} />
                </div>
                <div className="min-w-[160px] flex-1">
                  <div className="text-lg font-bold tracking-tight">
                    {titleCase(`${search.make ?? ''} ${search.makeModel ?? ''}`.trim())}
                  </div>
                  {search.vehicleClass && (
                    <div className="text-sm text-on-surface-variant">{search.vehicleClass}</div>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={clearManualVehicle}>
                  Edit
                </Button>
              </div>
            ) : manualOpen ? (
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="make">Make</Label>
                    <Input id="make" value={make} onChange={(e) => setMake(e.target.value)} placeholder="e.g. Ford" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="makeModel">Model</Label>
                    <Input id="makeModel" value={makeModel} onChange={(e) => setMakeModel(e.target.value)} placeholder="e.g. Focus" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="vehicleClass">Vehicle type</Label>
                    <select
                      id="vehicleClass"
                      value={vehicleClass}
                      onChange={(e) => setVehicleClass(e.target.value)}
                      className="h-[46px] rounded-[var(--radius)] border-[1.5px] border-transparent bg-surface-c px-4 text-[15px] font-medium focus:border-primary-c focus:bg-white focus:outline-none"
                    >
                      <option value="">Select a type</option>
                      {vehicleClassOptions.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={saveManualVehicle} disabled={!make.trim() || !makeModel.trim()}>
                    Use this vehicle
                  </Button>
                  <Button variant="ghost" onClick={() => setManualOpen(false)}>
                    Use registration instead
                  </Button>
                </div>
              </div>
            ) : (
              <div>
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
                <button
                  type="button"
                  onClick={() => setManualOpen(true)}
                  className="mt-3 text-[13px] font-semibold text-primary underline underline-offset-2"
                >
                  Can't find your reg? Enter the vehicle manually
                </button>
              </div>
            )}
          </div>

          <div className="rounded-[var(--radius-md)] bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">Route</span>
              <span className="text-[13px] text-on-surface-variant">Drivers quote based on your route</span>
            </div>

            <div className={`mb-4 grid gap-3 ${needsDropoff ? 'sm:grid-cols-2' : ''}`}>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-semibold">{needsDropoff ? 'Pick-up' : 'Where is the vehicle?'}</label>
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
              {needsDropoff && (
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
              )}
            </div>

            <RouteMiniMap fromLabel={fromLabel} toLabel={toLabel} />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Distance" value={!needsDropoff ? 'On-site' : distanceUnknown ? 'Pick both' : `${distanceMi} mi`} />
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
                { value: 'rolls', label: 'Rolls' },
                { value: 'winch', label: 'Winch' },
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
              { label: 'Service', value: requestTypeLabel(requestType) },
              {
                label: 'Vehicle',
                value: vehicleVerified
                  ? titleCase(vehicle!.makeModel || vehicle!.make)
                  : manualSaved
                    ? titleCase(`${search.make ?? ''} ${search.makeModel ?? ''}`.trim())
                    : regInput || 'Enter your reg',
              },
              {
                label: 'Distance',
                value: !needsDropoff ? 'On-site' : distanceUnknown ? 'Pick both locations' : `${distanceMi} mi`,
              },
              { label: 'Size', value: sizeLabel(size) },
              { label: 'Condition', value: conditionLabel(condition) },
            ]}
            pricePence={amountPence}
            priceLoading={priceLoading}
            fine="Your fixed price is calculated from your route and vehicle — no hidden fees."
            ctaLabel="See prices"
            onCta={proceed}
            disabled={!canProceed}
            ctaHint={canProceed ? undefined : proceedGaps.map((g) => journeyGapLabels[g])}
          />
          <p className="mt-3 text-center text-xs text-on-surface-variant">
            Pay securely online — fully refunded if we can't fulfil your recovery.
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
