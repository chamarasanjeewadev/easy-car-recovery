import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from './ui/button'
import { Icon } from './icon'
import { PlateInput } from './plate-input'
import { PostcodeInput, type PlaceValue } from './postcode-input'

const TABS = ['Quote', 'Track', 'Help'] as const

export function HeroCard() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Quote')
  const [reg, setReg] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [fromPlace, setFromPlace] = useState<PlaceValue | null>(null)
  const [toPlace, setToPlace] = useState<PlaceValue | null>(null)
  const navigate = useNavigate()

  const submit = () => {
    navigate({
      to: '/quote',
      search: {
        reg: reg || undefined,
        from: fromPlace?.description || from || undefined,
        to: toPlace?.description || to || undefined,
        fromLat: fromPlace?.lat,
        fromLng: fromPlace?.lng,
        toLat: toPlace?.lat,
        toLng: toPlace?.lng,
      },
    })
  }

  return (
    <div className="relative rounded-[var(--radius-lg)] bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="mb-5 flex gap-1 rounded-full bg-surface-c p-1">
        {TABS.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => setTab(label)}
            className={`flex-1 rounded-full px-3 py-2.5 text-[13px] font-semibold transition ${
              tab === label
                ? 'bg-white text-on-surface shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3.5">
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold">Vehicle reg</label>
          <PlateInput value={reg} onChange={setReg} />
        </div>
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
        See my quote <Icon name="arrow-right" size={16} />
      </Button>
    </div>
  )
}
