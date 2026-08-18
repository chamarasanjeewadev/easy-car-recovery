/** Format an integer pence amount as GBP, hiding ".00" for whole pounds. */
export function formatPounds(amountPence: number): string {
  return amountPence % 100 === 0
    ? `£${amountPence / 100}`
    : `£${(amountPence / 100).toFixed(2)}`
}
