import * as React from 'react'

interface PlateInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  size?: 'lg' | 'sm'
  readOnly?: boolean
}

export function PlateInput({ value, onChange, placeholder = 'YOUR REG', size = 'lg', readOnly }: PlateInputProps) {
  const isSm = size === 'sm'
  return (
    <span
      className={`inline-flex items-stretch overflow-hidden border-2 border-on-surface bg-[#fcdb1a] ${
        isSm ? 'h-8 rounded-md border-[1.5px]' : 'h-[60px] rounded-[var(--radius)]'
      }`}
    >
      <span
        className={`flex items-center justify-center bg-[#1d4ed8] font-extrabold tracking-widest text-[#fcdb1a] ${
          isSm ? 'px-1.5 text-[9px]' : 'px-3 text-[11px]'
        }`}
      >
        GB
      </span>
      {readOnly ? (
        <span
          className={`flex items-center px-3 font-extrabold uppercase tabular text-on-surface ${
            isSm ? 'text-[14px] tracking-[1.5px]' : 'text-xl tracking-[2px]'
          }`}
        >
          {value}
        </span>
      ) : (
        <input
          type="text"
          value={value}
          maxLength={8}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className={`min-w-0 flex-1 bg-transparent text-center font-extrabold uppercase tabular text-on-surface placeholder:font-bold placeholder:text-on-surface/55 focus:outline-none ${
            isSm ? 'px-3 text-[14px] tracking-[1.5px]' : 'px-4 text-xl tracking-[2px]'
          }`}
        />
      )}
    </span>
  )
}
