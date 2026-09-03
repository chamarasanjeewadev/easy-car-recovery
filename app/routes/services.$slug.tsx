import { createFileRoute, notFound } from '@tanstack/react-router'
import { ServiceLandingPage } from '~/components/seo/service-landing-page'
import { getSeoPage } from '~/lib/seo-pages'
import { SITE_URL } from '~/lib/site'

export const Route = createFileRoute('/services/$slug')({
  loader: ({ params }) => {
    const page = getSeoPage(params.slug)
    if (!page || page.cluster !== 'service') throw notFound()
    return page
  },
  head: ({ params }) => {
    const page = getSeoPage(params.slug)
    if (!page) return {}
    const canonical = `${SITE_URL}/services/${page.slug}`
    return {
      meta: [
        { title: page.title },
        { name: 'description', content: page.metaDescription },
        { property: 'og:title', content: page.title },
        { property: 'og:description', content: page.metaDescription },
        { property: 'og:url', content: canonical },
        { name: 'twitter:title', content: page.title },
        { name: 'twitter:description', content: page.metaDescription },
        ...(page.index ? [] : [{ name: 'robots', content: 'noindex, follow' }]),
      ],
      links: [{ rel: 'canonical', href: canonical }],
    }
  },
  component: ServicePage,
})

function ServicePage() {
  const page = Route.useLoaderData()
  return <ServiceLandingPage page={page} />
}
