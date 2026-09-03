import type { IconName } from '~/components/icon'

// Single source of truth for the SEO content pages (per-service + vehicle-type
// niches). Routes, internal links and the generated sitemap all iterate this
// array, and the `index` flag gates both sitemap inclusion and robots noindex.
//
// STRATEGY: these pages deliberately target the transactional "book & pay
// online / fixed price" angle and vehicle-type niches, so they COMPLEMENT
// rather than cannibalise towmycar.uk's generic "car recovery [city]" pages.
// If a page starts competing with a towmycar.uk winner in Search Console,
// demote it here with `index: false` — do not delete the page.

export type SeoFaq = { q: string; a: string }

export type SeoPage = {
  slug: string
  cluster: 'service' | 'vehicle'
  ic: IconName
  /** Short label for nav, footer and cards. */
  name: string
  h1: string
  title: string
  metaDescription: string
  keyword: string
  /** Answer-first intro paragraph, reused as the on-page lede. */
  intro: string
  /** "What's included" bullets. */
  included: string[]
  /** schema.org Service serviceType (free text). */
  serviceType: string
  faq: SeoFaq[]
  /** Gates sitemap inclusion + robots index. */
  index: boolean
  /** Slugs of sibling pages to cross-link. */
  related: string[]
}

export const SEO_PAGES: SeoPage[] = [
  {
    slug: 'vehicle-recovery',
    cluster: 'service',
    ic: 'truck',
    name: 'Vehicle recovery',
    h1: 'Vehicle Recovery, Booked & Paid Online',
    title:
      'Vehicle Recovery Online — Fixed Price, Booked in Minutes | Easy Car Recovery',
    metaDescription:
      'Book flatbed vehicle recovery online at a fixed price. See the exact price for your route and vehicle, pay securely, and a vetted driver is dispatched. No call-out fees.',
    keyword: 'book vehicle recovery online',
    intro:
      'Vehicle recovery moves your car, van or light commercial on a flatbed from where it has stopped to wherever you need it — home, a garage or a dealership. With Easy Car Recovery you check your reg, enter your pick-up and drop-off, and get a fixed price online before you commit. Pay securely by card and a vetted recovery operator from the TowMyCar network is on the way.',
    included: [
      'Flatbed transport for cars, vans and light commercials up to 3.5 tonnes',
      'A fixed price for your exact route and vehicle, shown before you pay',
      'Secure online card payment, fully refundable if we cannot fulfil the job',
      'Vetted, insured recovery operators across England, Scotland and Wales',
      'Requests handled 24/7, with an average 15-minute response to new jobs',
    ],
    serviceType: 'Vehicle recovery',
    faq: [
      {
        q: 'How much does vehicle recovery cost?',
        a: 'Your price is worked out from the pick-up to drop-off distance and your vehicle, using the same pricing the TowMyCar network runs on. You see the exact fixed price at checkout before paying, so there are no surprises on the day.',
      },
      {
        q: 'Can you recover a car that will not start or is in gear?',
        a: 'Yes. Flatbed recovery does not need the vehicle to run or roll — the operator will winch and load non-runners, cars stuck in gear, and vehicles with flat batteries or seized brakes.',
      },
      {
        q: 'Do I have to be with the vehicle?',
        a: 'Ideally yes, so the driver can hand over safely, but for pre-arranged moves you can nominate someone else to be present at pick-up and drop-off. Add the details when you book.',
      },
    ],
    index: true,
    related: ['breakdown-transport', 'jump-start-battery', 'ev-recovery'],
  },
  {
    slug: 'jump-start-battery',
    cluster: 'service',
    ic: 'battery',
    name: 'Jump start & battery',
    h1: 'Jump Start & Battery Recovery',
    title:
      'Jump Start & Battery Help — Book Online, Fixed Price | Easy Car Recovery',
    metaDescription:
      'Flat battery? Book a mobile jump-start online with an upfront price, or recovery if the car will not restart. Vetted local drivers across England, Scotland & Wales.',
    keyword: 'book a jump start',
    intro:
      'A flat or dead battery is one of the most common reasons a car will not start. Book a mobile jump-start online and a local operator will attempt a roadside boost so you can get moving. If the battery will not hold or the fault is deeper, the same visit can turn into a flatbed recovery to your garage — you see the price for either outcome up front.',
    included: [
      'Roadside jump-start for most petrol and diesel makes and models',
      'A quick check of whether the battery will hold charge or needs replacing',
      'Onward flatbed recovery to a garage if the car will not restart',
      'A clear fixed price online before the operator is dispatched',
      'Local, vetted recovery operators, seven days a week',
    ],
    serviceType: 'Jump start',
    faq: [
      {
        q: 'What if the jump-start does not work?',
        a: 'If a boost will not get you going, the operator can recover the vehicle to a garage of your choice on the same visit. You will have already seen the recovery price online, so you can decide on the spot.',
      },
      {
        q: 'Can you jump-start a start-stop or AGM battery?',
        a: 'Yes — operators carry equipment suitable for modern start-stop and AGM batteries. If a battery is faulty rather than just discharged, a jump will only be temporary and a replacement or recovery is the safer option.',
      },
      {
        q: 'Do you replace batteries at the roadside?',
        a: 'The core service is a jump-start and, if needed, recovery. Some operators can source and fit a battery, but the reliable path when a battery has failed is recovery to a garage.',
      },
    ],
    index: true,
    related: ['vehicle-recovery', 'wrong-fuel-recovery', 'breakdown-transport'],
  },
  {
    slug: 'wrong-fuel-recovery',
    cluster: 'service',
    ic: 'fuel',
    name: 'Wrong fuel & empty',
    h1: 'Wrong Fuel & Empty Tank Recovery',
    title:
      'Wrong Fuel Recovery — Fixed Online Price | Easy Car Recovery',
    metaDescription:
      'Put the wrong fuel in, or run empty? Book recovery to a garage online at a fixed price. Do not start the engine — we will move it safely on a flatbed.',
    keyword: 'wrong fuel recovery',
    intro:
      'Putting petrol in a diesel (or diesel in a petrol) is easily done and can damage the engine if you drive on it. The safest step is simple: do not start the engine. Book recovery online and a vetted operator will move your car on a flatbed to a garage that can drain and flush the fuel system. The same applies if you have simply run out of fuel and are stranded.',
    included: [
      'Flatbed recovery to a garage that can drain and flush the system',
      'Safe handling that avoids running contaminated fuel through the engine',
      'Recovery when you have run out of fuel and cannot safely refuel roadside',
      'A fixed price for your route, shown before you pay online',
      'Vetted operators covering England, Scotland and Wales',
    ],
    serviceType: 'Misfuelling recovery',
    faq: [
      {
        q: 'I have put the wrong fuel in — should I start the car?',
        a: 'No. Do not turn the ignition on or start the engine, as that circulates the wrong fuel through the system and causes most of the damage. Leave it, book recovery online, and let a garage drain the tank.',
      },
      {
        q: 'Can the fuel be drained at the roadside?',
        a: 'Recovery to a properly equipped garage is the dependable option, especially on a busy road. Booking recovery gets the car somewhere the fuel system can be drained and flushed safely.',
      },
      {
        q: 'What if I have just run out of fuel?',
        a: 'If you are in a safe place a small top-up may get you going, but if you are stranded or in a live lane the safe choice is recovery to a fuel station or garage — book it online at a fixed price.',
      },
    ],
    index: true,
    related: ['vehicle-recovery', 'jump-start-battery', 'breakdown-transport'],
  },
  {
    slug: 'breakdown-transport',
    cluster: 'service',
    ic: 'wrench',
    name: 'Breakdown transport',
    h1: 'Breakdown & Non-Runner Transport',
    title:
      'Breakdown Transport — Move a Non-Runner, Fixed Price Online | Easy Car Recovery',
    metaDescription:
      'Move a non-runner, seized or accident-damaged vehicle. Fixed online price for your exact route, paid upfront, with vetted flatbed drivers nationwide.',
    keyword: 'non-runner car transport',
    intro:
      'Not every recovery is a roadside emergency. Breakdown and non-runner transport is for moving a vehicle that cannot drive — a project car, a non-runner you have bought, an accident-damaged vehicle, or something with a seized engine or gearbox. Book the move online, see the fixed price for the distance, and a flatbed operator will load and transport it safely.',
    included: [
      'Flatbed transport for non-runners, seized and accident-damaged vehicles',
      'Planned collection and delivery between any two UK addresses',
      'Winch loading for vehicles that cannot roll or steer',
      'A fixed price for your route, confirmed online before payment',
      'Vetted operators and secure strapping for the whole journey',
    ],
    serviceType: 'Vehicle transport',
    faq: [
      {
        q: 'Can you move a car that does not run at all?',
        a: 'Yes. Flatbed operators winch non-runners onto the bed, so the vehicle does not need to start, roll or steer. Let us know at booking if the wheels are locked or the steering is seized.',
      },
      {
        q: 'Can I book a move for a future date?',
        a: 'Yes — breakdown transport is often planned rather than urgent. Enter your pick-up and drop-off and choose a time that suits; you will see the fixed price before you pay.',
      },
      {
        q: 'Do you transport accident-damaged vehicles?',
        a: 'Yes, provided the vehicle is safe to load. Add a photo and a short description when you book so the operator arrives with the right equipment.',
      },
    ],
    index: true,
    related: ['vehicle-recovery', 'ev-recovery', 'wrong-fuel-recovery'],
  },
  {
    slug: 'ev-recovery',
    cluster: 'service',
    ic: 'zap',
    name: 'EV recovery',
    h1: 'EV & Hybrid Recovery',
    title: 'EV Recovery UK — Flatbed, Booked Online | Easy Car Recovery',
    metaDescription:
      'Electric or hybrid stuck? Book flatbed EV recovery online at a fixed price, matched to drivers with the right kit. Safe, wheels-up handling for EVs and PHEVs.',
    keyword: 'EV recovery UK',
    intro:
      'Electric and plug-in hybrid vehicles need to be recovered the right way. Because the driven wheels are permanently connected to the motor, most EVs should be transported fully off the ground on a flatbed rather than towed on their wheels. Book EV recovery online and we match you to an operator with flatbed equipment suited to electric and hybrid vehicles.',
    included: [
      'Flatbed, wheels-up transport that protects the motor and drivetrain',
      'Operators matched to EV and PHEV handling requirements',
      'Recovery for a flat traction battery, fault or roadside breakdown',
      'A fixed price for your route, shown online before you pay',
      'Coverage across England, Scotland and Wales',
    ],
    serviceType: 'EV recovery',
    faq: [
      {
        q: 'Why can’t my EV be towed on its wheels?',
        a: 'On most electric cars the wheels drive the motor even when the car is off, so towing on the road wheels can damage the drivetrain or generate current. Flatbed recovery lifts all four wheels clear, which is the manufacturer-recommended method for the majority of EVs.',
      },
      {
        q: 'Can you recover an EV with a flat traction battery?',
        a: 'Yes. A flat main battery is one of the most common reasons an EV needs recovery — a flatbed operator will load and transport it to a charge point or garage.',
      },
      {
        q: 'Do you cover plug-in hybrids too?',
        a: 'Yes. Plug-in and self-charging hybrids are handled the same careful way, on a flatbed, so there is no risk to the electric drivetrain.',
      },
    ],
    index: true,
    related: ['vehicle-recovery', 'breakdown-transport', 'jump-start-battery'],
  },

  // --- Vehicle-type niches (/recovery/$slug) ---
  {
    slug: 'motorcycle',
    cluster: 'vehicle',
    ic: 'truck',
    name: 'Motorcycle recovery',
    h1: 'Motorcycle Recovery, Booked Online',
    title:
      'Motorcycle Recovery UK — Fixed Price Online | Easy Car Recovery',
    metaDescription:
      'Book motorbike recovery online with a fixed upfront price. Strapped and transported safely by vetted operators with the right kit. Nationwide coverage.',
    keyword: 'motorcycle recovery UK',
    intro:
      'A bike that has broken down, been dropped or simply will not start needs recovering with equipment made for two wheels — a proper chock and soft straps that hold the bike upright without damaging forks or bodywork. Book motorcycle recovery online, see the fixed price for your route, and an operator with the right kit will collect and transport your bike safely.',
    included: [
      'Wheel chock and soft-strap securing that protects forks and fairings',
      'Recovery for motorbikes, scooters and mopeds that will not run',
      'Planned collection and delivery between any two UK addresses',
      'A fixed price for your route, shown online before payment',
      'Vetted operators experienced with two-wheel loads',
    ],
    serviceType: 'Motorcycle recovery',
    faq: [
      {
        q: 'How is my motorbike secured for transport?',
        a: 'The bike is loaded onto a flatbed, held upright in a front wheel chock and tied down with soft straps at the correct points, so the forks and bodywork are protected for the whole journey.',
      },
      {
        q: 'Can you recover a bike that will not start or is damaged?',
        a: 'Yes. The bike does not need to run — operators can load a non-runner or a dropped, damaged machine. Add a note or photo at booking so the right equipment turns up.',
      },
    ],
    index: true,
    related: ['van', 'vehicle-recovery', 'breakdown-transport'],
  },
  {
    slug: 'van',
    cluster: 'vehicle',
    ic: 'truck',
    name: 'Van recovery',
    h1: 'Van & Light Commercial Recovery',
    title:
      'Van Recovery UK — Up to 3.5t, Booked Online | Easy Car Recovery',
    metaDescription:
      'Van broken down? Book recovery for vans and light commercials up to 3.5t online at a fixed price. Vetted flatbed operators, no call-out fee.',
    keyword: 'van recovery UK',
    intro:
      'A van off the road can stop a whole day’s work, so getting it moved quickly matters. Easy Car Recovery covers vans and light commercials up to 3.5 tonnes — book online, see the fixed price for the distance, and a flatbed operator will recover the van to a garage, depot or wherever you need it.',
    included: [
      'Flatbed recovery for vans and light commercials up to 3.5 tonnes',
      'Recovery for breakdowns, non-runners and accident-damaged vans',
      'Collection and delivery between any two UK addresses',
      'A fixed price for your route, confirmed online before you pay',
      'Vetted operators covering England, Scotland and Wales',
    ],
    serviceType: 'Van recovery',
    faq: [
      {
        q: 'What size of van can you recover?',
        a: 'Vans and light commercials up to 3.5 tonnes gross weight are covered on a standard flatbed. If you are unsure of the weight, add the make and model at booking and we will match the right operator.',
      },
      {
        q: 'Can you recover a loaded van?',
        a: 'For safety, recovery is priced and handled for the vehicle itself. If the van is carrying a load, mention it at booking so the operator can advise on weight and access.',
      },
    ],
    index: true,
    related: ['motorcycle', 'vehicle-recovery', 'breakdown-transport'],
  },
  {
    slug: 'ev',
    cluster: 'vehicle',
    ic: 'zap',
    name: 'Electric car recovery',
    h1: 'Electric Car Recovery',
    title:
      'Electric Car Recovery UK — Flatbed, Fixed Price | Easy Car Recovery',
    metaDescription:
      'Book electric-car recovery online. Flatbed handling that protects the battery and drivetrain, at a fixed price for your route.',
    keyword: 'electric car recovery near me',
    intro:
      'Electric cars should be recovered on a flatbed with all four wheels off the ground, protecting the motor and drivetrain. Book online and we match you to an operator equipped to handle EVs safely, at a fixed price for your route.',
    included: [
      'Flatbed, wheels-up transport for electric cars',
      'Operators equipped for EV handling',
      'Recovery for a flat traction battery, fault or breakdown',
      'A fixed price shown online before you pay',
    ],
    serviceType: 'EV recovery',
    faq: [
      {
        q: 'How should an electric car be recovered?',
        a: 'On a flatbed with all four wheels lifted clear of the road, which is the method most EV manufacturers recommend because the wheels remain connected to the motor.',
      },
    ],
    // Deliberately noindex to avoid self-cannibalising /services/ev-recovery,
    // which owns the EV keyword. Kept as a followable landing for internal
    // links and paid traffic.
    index: false,
    related: ['van', 'vehicle-recovery'],
  },
]

// Bump when content pages are materially updated — feeds sitemap <lastmod>.
export const CONTENT_LAST_UPDATED = '2026-08-23'

export function getSeoPage(slug: string): SeoPage | undefined {
  return SEO_PAGES.find((p) => p.slug === slug)
}

export const SERVICE_PAGES = SEO_PAGES.filter((p) => p.cluster === 'service')
export const VEHICLE_PAGES = SEO_PAGES.filter((p) => p.cluster === 'vehicle')
export const INDEXABLE_SEO_PAGES = SEO_PAGES.filter((p) => p.index)

/** Route path for a page, e.g. `/services/vehicle-recovery`. */
export function seoPagePath(page: SeoPage): string {
  return page.cluster === 'service'
    ? `/services/${page.slug}`
    : `/recovery/${page.slug}`
}
