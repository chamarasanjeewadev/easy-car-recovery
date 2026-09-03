// Anonymous request-photo upload against the TowMyCar platform. Runs in the
// browser (like the free DVLA lookup) so uploads use the visitor's connection,
// and requires easycarrecovery.uk in the backend CORS allowlist. The backend
// returns a short-lived uploadToken + up to 3 presigned S3 PUT URLs; at booking
// creation it links every photo uploaded under that token to the request, so we
// only need to carry the token (not the S3 URLs) through the funnel.

export const MAX_PHOTOS = 3
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024 // 8 MB
export const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function apiBase(): string {
  return import.meta.env.VITE_TOWMYCAR_API_BASE_URL || 'https://api.towmycar.uk'
}

interface PresignedResponse {
  uploadToken: string
  presignedUrls: { photoNumber: number; presignedUrl: string; s3Path: string }[]
}

function extensionFor(file: File): string {
  if (file.type === 'image/png') return '.png'
  if (file.type === 'image/webp') return '.webp'
  return '.jpg'
}

/**
 * Uploads up to MAX_PHOTOS files to S3 via anonymous presigned URLs and returns
 * the uploadToken that links them at booking creation. Call this once, on
 * continue, with the final selected set — so removed photos are never uploaded.
 * Returns null when there are no files.
 */
export async function uploadPhotos(
  files: File[],
): Promise<{ uploadToken: string; photoUrls: string[] } | null> {
  const list = files.slice(0, MAX_PHOTOS)
  if (list.length === 0) return null

  let res: Response
  try {
    res = await fetch(
      `${apiBase()}/user/get-anonymous-request-photo-presigned-url?extension=${encodeURIComponent(extensionFor(list[0]))}`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20_000) },
    )
  } catch {
    throw new Error('Could not prepare photo upload. Please try again.')
  }
  if (!res.ok) throw new Error('Could not prepare photo upload. Please try again.')

  const data = (await res.json()) as PresignedResponse
  const slots = [...(data.presignedUrls ?? [])].sort((a, b) => a.photoNumber - b.photoNumber)
  const photoUrls: string[] = []

  for (let i = 0; i < list.length; i++) {
    const slot = slots[i]
    if (!slot) break
    let put: Response
    try {
      put = await fetch(slot.presignedUrl, {
        method: 'PUT',
        body: list[i],
        headers: { 'Content-Type': list[i].type },
      })
    } catch {
      throw new Error('A photo failed to upload. Please try again.')
    }
    if (!put.ok) throw new Error('A photo failed to upload. Please try again.')
    photoUrls.push(slot.s3Path)
  }

  return { uploadToken: data.uploadToken, photoUrls }
}

/** Client-side guard mirroring the backend's accepted types + a size cap. */
export function validatePhoto(file: File): string | null {
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
    return 'Photos must be JPG, PNG or WebP.'
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return 'Each photo must be under 8 MB.'
  }
  return null
}
