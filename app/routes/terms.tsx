import { createFileRoute, Link } from '@tanstack/react-router'
import {
  COMPANY_ADDRESS,
  COMPANY_NAME,
  SITE_NAME,
  SITE_URL,
  SUPPORT_EMAIL,
  SUPPORT_EMAIL_HREF,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
} from '~/lib/site'

export const Route = createFileRoute('/terms')({
  head: () => ({
    meta: [
      { title: `Terms of Service — ${SITE_NAME}` },
      {
        name: 'description',
        content: `The terms that apply when you request vehicle recovery through ${SITE_NAME}.`,
      },
    ],
    links: [{ rel: 'canonical', href: `${SITE_URL}/terms` }],
  }),
  component: TermsPage,
})

function TermsPage() {
  return (
    <div className="container-app max-w-[760px] py-16">
      <h1 className="text-[clamp(32px,4vw,44px)] font-bold tracking-[-0.02em]">Terms of Service</h1>
      <p className="mt-2 text-sm text-on-surface-variant">Version ecr-v3 · Last updated 6 August 2026</p>

      <div className="prose-ecr mt-8 space-y-6 text-[15px] leading-relaxed text-on-surface-variant">
        <Section title="1. Who we are">
          {SITE_NAME} ("we", "us") is a trading style of {COMPANY_NAME}, {COMPANY_ADDRESS}. We are a
          booking service for vehicle recovery and part of the TowMyCar recovery network: when you submit
          a request through this website, it is passed to our network of independent, vetted recovery
          drivers, and our team coordinates the job with you.
        </Section>

        <Section title="2. How pricing works">
          The price shown at checkout is calculated from the details you provide — your route
          (pick-up to drop-off distance), your vehicle, and the job type. It is a fixed price for
          the recovery described in your booking. If the details you gave were inaccurate (for
          example, a vehicle that does not roll when you told us it drives), the operator may need
          to re-quote before dispatch; you can accept the revised price or take a full refund.
        </Section>

        <Section title="3. Payment">
          You pay the full booking price online at the time of booking. Payments are processed
          securely by Stripe — your card details never touch our servers and we do not store them.
          Your booking is only created once your payment succeeds, and a receipt is emailed to you.
          If we cannot fulfil your recovery, you receive a full refund.
        </Section>

        <Section title="4. Your responsibilities">
          You must provide accurate information — including the vehicle registration, locations, vehicle
          condition, and a contact number we can reach you on. Inaccurate details (for example, a vehicle
          that does not roll when you told us it drives) may change the price or make the job impossible to
          complete.
        </Section>

        <Section title="5. Cancellations and refunds">
          You can cancel free of charge — with a full refund to your original payment method — any
          time before a driver has been dispatched to your pick-up location. If you cancel after
          dispatch, we may deduct reasonable costs already incurred and refund the balance. If no
          driver can be found for your job, we cancel the booking and refund you in full. Refunds
          are issued via Stripe and typically arrive within 5–10 working days.
        </Section>

        <Section title="6. Service limits">
          Recovery services are provided by independent operators. While we work to match you quickly,
          arrival times depend on driver availability, location and traffic, and are not guaranteed. We are
          not an emergency service — if you are in immediate danger, call 999.
        </Section>

        <Section title="7. Liability">
          Nothing in these terms limits liability that cannot be limited by law. The recovery operator who
          performs your job is responsible for the transport of your vehicle; we are responsible for the
          booking service we provide.
        </Section>

        <Section title="8. Contact">
          Questions about these terms: call{' '}
          <a href={SUPPORT_PHONE_TEL} className="font-semibold text-on-surface underline">
            {SUPPORT_PHONE_DISPLAY}
          </a>{' '}
          or email{' '}
          <a href={SUPPORT_EMAIL_HREF} className="font-semibold text-on-surface underline">
            {SUPPORT_EMAIL}
          </a>
          . See also our{' '}
          <Link to="/privacy" className="font-semibold text-on-surface underline">
            privacy policy
          </Link>
          .
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-bold text-on-surface">{title}</h2>
      <p>{children}</p>
    </section>
  )
}
