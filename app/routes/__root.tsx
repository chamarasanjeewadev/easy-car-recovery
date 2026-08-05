import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { Header } from '~/components/header'
import { Footer } from '~/components/footer'
import appCss from '~/styles/app.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Easy Recovery — Stay moving, no matter what.' },
      {
        name: 'description',
        content:
          "Fixed-price UK vehicle recovery. DBS-checked drivers, live tracking, zero surge fees — book in 30 seconds.",
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-surface font-sans text-on-surface antialiased">
        <Header />
        <main>
          <Outlet />
        </main>
        <Footer />
        <Scripts />
      </body>
    </html>
  )
}
