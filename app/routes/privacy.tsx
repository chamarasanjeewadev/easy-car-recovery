import { createFileRoute, Link } from '@tanstack/react-router'
import { SITE_NAME, SITE_URL, SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_TEL } from '~/lib/site'

export const Route = createFileRoute('/privacy')({
  head: () => ({
    meta: [
      { title: `Privacy Policy — ${SITE_NAME}` },
      {
        name: 'description',
        content: `How ${SITE_NAME} collects and uses your data when you request vehicle recovery.`,
      },
    ],
    links: [{ rel: 'canonical', href: `${SITE_URL}/privacy` }],
  }),
  component: PrivacyPage,
})

function PrivacyPage() {
  return (
    <div className="container-app max-w-[760px] py-16">
      <h1 className="text-[clamp(32px,4vw,44px)] font-bold tracking-[-0.02em]">Privacy Policy</h1>
      <p className="mt-2 text-sm text-on-surface-variant">Last updated 5 August 2026</p>

      <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-on-surface-variant">
        <Section title="What we collect">
          When you request a quote or booking we collect: your vehicle registration and the vehicle details
          returned by vehicle-data lookups (make, model, colour, weight); your pick-up and drop-off
          locations; your name, mobile number and email address; and any notes you add about the job.
        </Section>

        <Section title="How we use it">
          We use these details to price your request, to create and manage your recovery booking on the
          TowMyCar platform, to match you with recovery drivers near you, and to contact you about your
          booking. We record when you accepted our terms as evidence of consent.
        </Section>

        <Section title="Who we share it with">
          Your booking details are processed on the TowMyCar recovery platform and shared with the recovery
          drivers who may carry out your job (they see the job details and the contact information needed to
          perform it). Vehicle registration lookups use UK vehicle-data services. We do not sell your data.
        </Section>

        <Section title="How long we keep it">
          Booking records are retained as long as needed to operate the service and to meet legal and
          accounting obligations, then deleted or anonymised.
        </Section>

        <Section title="Your rights">
          Under UK GDPR you can request access to, correction of, or deletion of your personal data, and you
          can object to or restrict processing. To exercise any of these rights, call{' '}
          <a href={SUPPORT_PHONE_TEL} className="font-semibold text-on-surface underline">
            {SUPPORT_PHONE_DISPLAY}
          </a>
          . You also have the right to complain to the ICO (ico.org.uk).
        </Section>

        <Section title="Cookies & analytics">
          This site uses only the cookies and local storage needed to run the booking flow. Location
          autocomplete is provided by Google Maps, which may set its own cookies subject to Google's privacy
          policy.
        </Section>

        <Section title="More">
          See also our{' '}
          <Link to="/terms" className="font-semibold text-on-surface underline">
            terms of service
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
