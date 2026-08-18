import { useEffect, useRef, useState } from 'react'
import { Icon } from './icon'
import { ACCEPTED_PHOTO_TYPES, MAX_PHOTOS, validatePhoto } from '~/lib/api/photos'

interface PhotoUploadProps {
  files: File[]
  onChange: (files: File[]) => void
  disabled?: boolean
}

/**
 * Lets the customer attach up to 3 photos of the vehicle/damage. Holds only the
 * selected File objects + object-URL previews; the actual S3 upload happens on
 * continue (see /details) so removed photos are never uploaded or linked.
 */
export function PhotoUpload({ files, onChange, disabled }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [previews, setPreviews] = useState<string[]>([])

  // Object URLs must be revoked when files change / on unmount to avoid leaks.
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [files])

  const addFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return
    setError(null)
    const next = [...files]
    for (const file of Array.from(incoming)) {
      if (next.length >= MAX_PHOTOS) {
        setError(`You can add up to ${MAX_PHOTOS} photos.`)
        break
      }
      const invalid = validatePhoto(file)
      if (invalid) {
        setError(invalid)
        continue
      }
      next.push(file)
    }
    onChange(next)
    if (inputRef.current) inputRef.current.value = ''
  }

  const removeAt = (i: number) => {
    setError(null)
    onChange(files.filter((_, idx) => idx !== i))
  }

  const full = files.length >= MAX_PHOTOS

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {previews.map((src, i) => (
          <div
            key={src}
            className="relative h-24 w-24 overflow-hidden rounded-[var(--radius)] bg-surface-c"
          >
            <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              disabled={disabled}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-white transition hover:bg-black/75"
            >
              <Icon name="x" size={13} stroke={2.5} />
            </button>
          </div>
        ))}

        {!full && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="grid h-24 w-24 place-items-center rounded-[var(--radius)] border-[1.5px] border-dashed border-outline bg-surface-c text-on-surface-variant transition hover:border-primary-c hover:text-primary disabled:opacity-50"
          >
            <span className="flex flex-col items-center gap-1">
              <Icon name="upload" size={18} />
              <span className="text-[11px] font-semibold">Add photo</span>
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_PHOTO_TYPES.join(',')}
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />

      {error && <p className="mt-2 text-xs font-medium text-[#b00020]">{error}</p>}
      <p className="mt-2 text-[13px] text-on-surface-variant">
        Optional · up to {MAX_PHOTOS} photos (JPG, PNG or WebP). Helps the driver assess the job.
      </p>
    </div>
  )
}
