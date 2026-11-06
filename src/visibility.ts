// Welke items van een lang lijstje buiten beeld staan (F29).

/** Hoeveel items boven en onder buiten beeld staan (F29). */
export interface Hidden {
  above: number
  below: number
}

/**
 * Telt de items die boven het scherm of onder de invoerregel buiten beeld staan (F29).
 * Een item telt als buiten beeld als minder dan de helft te zien is.
 */
export function countHidden(rows: readonly { top: number; bottom: number }[], top: number, bottom: number): Hidden {
  let above = 0
  let below = 0
  for (const row of rows) {
    const middle = (row.top + row.bottom) / 2
    if (middle < top) above += 1
    else if (middle > bottom) below += 1
  }
  return { above, below }
}
