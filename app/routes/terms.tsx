import { createFileRoute, Link } from '@tanstack/react-router'
import { SITE_NAME, SITE_URL, SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL } from '~/lib/site'

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
      <p className="mt-2 text-sm text-on-surface-variant">Version ecr-v1 · Last updated 5 August 2026</p>

      <div className="prose-ecr mt-8 space-y-6 text-[15px] leading-relaxed text-on-surface-variant">
        <Section title="1. Who we are">
          {SITE_NAME} ("we", "us") is a booking service for vehicle recovery. We operate as part of the
          TowMyCar recovery network: when you submit a request through this website, it is passed to our
          network of independent, vetted recovery drivers, and our team coordinates the job with you.
        </Section>

        <Section title="2. Quotes are indicative">
          Prices shown on this website are indicative estimates based on the details you provide (vehicle,
          locations, distance, condition and timing). They are not a binding contract price. Before any
          driver is dispatched, our team will contact you to confirm availability and the final price. You
          are free to decline at that point at no cost.
        </Section>

        <Section title="3. No online payment">
          We do not take payment on this website. No money is charged when you submit a request. Payment
          terms are agreed when your booking is confirmed.
        </Section>

        <Section title="4. Your responsibilities">
          You must provide accurate information — including the vehicle registration, locations, vehicle
          condition, and a contact number we can reach you on. Inaccurate details (for example, a vehicle
          that does not roll when you told us it drives) may change the price or make the job impossible to
          complete.
        </Section>

        <Section title="5. Cancellations">
          You can cancel a request free of charge any time before the booking is confirmed with you by
          phone. For cancellations after confirmation, any charge will be as agreed during the confirmation
          call.
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
