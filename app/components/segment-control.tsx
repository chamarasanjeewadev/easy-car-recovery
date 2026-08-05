interface SegmentOption<T extends string> {
  value: T
  label: string
  extra?: string
}

interface SegmentControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: SegmentOption<T>[]
}

export function SegmentControl<T extends string>({ value, onChange, options }: SegmentControlProps<T>) {
  return (
    <div className="flex gap-0 rounded-full bg-surface-c p-1">
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 rounded-full px-3.5 py-2.5 text-sm font-semibold transition ${
              active
                ? 'bg-white text-on-surface shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {opt.label}
            {opt.extra && (
              <span className="ml-1.5 text-on-surface-variant opacity-80">{opt.extra}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
