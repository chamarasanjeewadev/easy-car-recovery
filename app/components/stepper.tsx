import { Icon } from './icon'

interface StepperProps {
  step: 0 | 1
}

// Two on-site steps; secure payment happens on Stripe's hosted checkout after.
const LABELS = ['Journey', 'Schedule & pay'] as const

export function Stepper({ step }: StepperProps) {
  return (
    <div className="flex items-center gap-2.5">
      {LABELS.map((label, i) => (
        <div key={label} className="flex items-center gap-2.5">
          <div
            className={`grid h-7 w-7 place-items-center rounded-full text-[13px] font-bold ${
              i === step
                ? 'bg-primary-c text-on-primary-c'
                : i < step
                  ? 'bg-inverse-surface text-inverse-on-surface'
                  : 'bg-surface-c text-on-surface-variant'
            }`}
            aria-current={i === step ? 'step' : undefined}
          >
            {i < step ? <Icon name="check" size={13} stroke={2.5} /> : i + 1}
          </div>
          {i < LABELS.length - 1 && (
            <div className={`h-0.5 w-6 rounded-full ${i < step ? 'bg-inverse-surface' : 'bg-surface-c'}`} />
          )}
        </div>
      ))}
      <span className="ml-3 hidden text-sm font-semibold sm:inline">
        Step {step + 1} of {LABELS.length} · {LABELS[step]}
      </span>
    </div>
  )
}
