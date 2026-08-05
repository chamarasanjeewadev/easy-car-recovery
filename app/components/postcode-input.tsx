import { useEffect, useId, useRef, useState } from 'react'
import { useJsApiLoader } from '@react-google-maps/api'

export interface PlaceValue {
  description: string
  lat: number
  lng: number
  postcode?: string
}

const UK_POSTCODE_RE = /\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i

function extractPostcode(
  components: google.maps.GeocoderAddressComponent[] | undefined,
  address: string,
): string | undefined {
  const fromComponents = components?.find((c) => c.types.includes('postal_code'))?.long_name
  if (fromComponents) return fromComponents
  return UK_POSTCODE_RE.exec(address)?.[1]?.toUpperCase()
}

interface PostcodeInputProps {
  value: string
  onChange: (text: string) => void
  onPick?: (place: PlaceValue) => void
  placeholder?: string
  autoComplete?: string
  className?: string
}

const LIBRARIES: ('places')[] = ['places']
const UK_BOUNDS = { north: 60.85, south: 49.86, west: -8.65, east: 1.76 }

export function PostcodeInput({
  value,
  onChange,
  onPick,
  placeholder = 'Postcode or address',
  autoComplete,
  className,
}: PostcodeInputProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
    id: 'gmaps',
  })

  const inputRef = useRef<HTMLInputElement>(null)
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesRef = useRef<google.maps.places.PlacesService | null>(null)

  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const listId = useId()

  useEffect(() => {
    if (!isLoaded || serviceRef.current) return
    serviceRef.current = new google.maps.places.AutocompleteService()
    sessionToken.current = new google.maps.places.AutocompleteSessionToken()
    const dummy = document.createElement('div')
    placesRef.current = new google.maps.places.PlacesService(dummy)
  }, [isLoaded])

  useEffect(() => {
    if (!isLoaded || !serviceRef.current) return
    const q = value.trim()
    if (q.length < 2) {
      setPredictions([])
      return
    }
    let cancelled = false
    serviceRef.current.getPlacePredictions(
      {
        input: q,
        sessionToken: sessionToken.current ?? undefined,
        componentRestrictions: { country: 'gb' },
        locationBias: UK_BOUNDS,
      },
      (results) => {
        if (cancelled) return
        setPredictions(results ?? [])
        setHighlight(0)
      },
    )
    return () => {
      cancelled = true
    }
  }, [value, isLoaded])

  const choose = (p: google.maps.places.AutocompletePrediction) => {
    onChange(p.description)
    setOpen(false)
    setPredictions([])
    if (!placesRef.current || !onPick) return
    placesRef.current.getDetails(
      {
        placeId: p.place_id,
        fields: ['geometry', 'formatted_address', 'address_components'],
        sessionToken: sessionToken.current ?? undefined,
      },
      (detail) => {
        const loc = detail?.geometry?.location
        if (!loc) return
        const description = detail.formatted_address ?? p.description
        onPick({
          description,
          lat: loc.lat(),
          lng: loc.lng(),
          postcode: extractPostcode(detail.address_components, description),
        })
        sessionToken.current = new google.maps.places.AutocompleteSessionToken()
      },
    )
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (!predictions.length) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlight((h) => (h + 1) % predictions.length)
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlight((h) => (h - 1 + predictions.length) % predictions.length)
          } else if (e.key === 'Enter') {
            e.preventDefault()
            choose(predictions[highlight])
          } else if (e.key === 'Escape') {
            setOpen(false)
          }
        }}
        placeholder={placeholder}
        autoComplete={autoComplete ?? 'off'}
        role="combobox"
        aria-expanded={open && predictions.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        className={
          className ??
          'w-full rounded-[var(--radius)] border-[1.5px] border-transparent bg-surface-c px-4 py-3.5 text-[15px] font-medium placeholder:text-outline focus:border-primary-c focus:bg-white focus:outline-none'
        }
      />
      {open && predictions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-72 overflow-auto rounded-[var(--radius)] border border-surface-high bg-white py-2 shadow-[var(--shadow-card)]"
        >
          {predictions.map((p, i) => (
            <li
              key={p.place_id}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => choose(p)}
              className={`cursor-pointer px-4 py-2.5 text-sm ${
                i === highlight ? 'bg-surface-low' : ''
              }`}
            >
              <div className="font-semibold text-on-surface">
                {p.structured_formatting?.main_text ?? p.description}
              </div>
              <div className="text-xs text-on-surface-variant">
                {p.structured_formatting?.secondary_text}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
