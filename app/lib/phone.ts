/**
 * Normalize a UK mobile number to E.164 (+447xxxxxxxxx).
 * Accepts 07…, 447…, +447…, with spaces/dashes/parens. Returns null if invalid.
 */
export function normalizeUkMobile(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, '')
  let national: string
  if (digits.startsWith('+447')) {
    national = digits.slice(3)
  } else if (digits.startsWith('447')) {
    national = digits.slice(2)
  } else if (digits.startsWith('07')) {
    national = digits.slice(1)
  } else {
    return null
  }
  // national is now 7xxxxxxxxx (10 digits)
  if (!/^7\d{9}$/.test(national)) return null
  return `+44${national}`
}
