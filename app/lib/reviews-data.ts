import { GOOGLE_REVIEWS_URL, TRUSTPILOT_URL } from './site'

// Verbatim customer reviews of the TowMyCar recovery network (the network that
// fulfils Easy Car Recovery bookings). Source of truth:
// towmycar-frontend/apps/towmycar-user-app/src/data/reviews.ts — keep in sync.
export interface Review {
  id: string
  platform: 'google' | 'trustpilot'
  author: string
  date: string
  text: string
}

export const REVIEWS: Review[] = [
  {
    id: 'tp-4',
    platform: 'trustpilot',
    author: 'Faith Randalls',
    date: '2026-06-29',
    text: 'We had an amazing experience. Sal our driver was so lovely and got us home and the car! It was a long 5 hour journey and he stopped twice so we could all grab food and drinks and stretch our legs. Couldn’t fault them!',
  },
  {
    id: 'tp-6',
    platform: 'trustpilot',
    author: 'DG Kent',
    date: '2026-06-21',
    text: 'Used for the first time. Initial process was snappy. Accepted quote which was reasonable. Good comms from the driver, about 20 mins before arriving. Arrived on time. No hassles, no fuss. Friendly guys loaded my car up and recovered it. Paid by bank transfer.',
  },
  {
    id: 'g-4',
    platform: 'google',
    author: 'Sanjeewani Lakmali Ranasinghe',
    date: '2026-05-20',
    text: 'Very quick response in my situation, and I got the cheapest recovery driver through them. He was really helpful, and I can recommend this service to anyone who has problems when their car breaks down unexpectedly on the road.',
  },
  {
    id: 'g-6',
    platform: 'google',
    author: 'Dawn',
    date: '2026-05-13',
    text: 'Impressive service and would highly recommend. My vehicle was recovered within an hour of confirming the job. Thank you so much',
  },
  {
    id: 'g-8',
    platform: 'google',
    author: 'Dharshana Ranasinghe',
    date: '2026-02-03',
    text: "Absolutely fantastic service! I was stranded on the side of the road, and TowMyCar.uk arrived much faster than expected. The driver was professional, handled my car with great care, and got me to the garage safely. Highly recommend if you're in a tough spot!",
  },
  {
    id: 'g-10',
    platform: 'google',
    author: 'nuwan sanjeewa',
    date: '2025-08-03',
    text: 'I found TowMyCar.uk while Google searching for recovery services and decided to give it a try. I submitted my request and received five competitive quotes. I also compared prices with individual drivers outside the platform, but TowMyCar.uk offered the best deal — I saved £60! The service was really helpful and smooth. I’ll definitely use it again in the future. Thank you!',
  },
]

export const PLATFORM_RATINGS = [
  { platform: 'Google', rating: 4.8, totalReviews: 13, url: GOOGLE_REVIEWS_URL },
  { platform: 'Trustpilot', rating: 4.2, totalReviews: 9, url: TRUSTPILOT_URL },
] as const
