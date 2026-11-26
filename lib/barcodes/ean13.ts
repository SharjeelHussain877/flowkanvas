/** EAN-13 encoder. Accepts 12 digits (check digit is computed) or 13 digits (check digit is verified). */
const L_CODES = [
  "0001101", "0011001", "0010011", "0111101", "0100011",
  "0110001", "0101111", "0111011", "0110111", "0001011",
]

/** Parity pattern for the left half, selected by the first digit (L = L-code, G = G-code). */
const PARITY = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"]

export const EAN13_QUIET_ZONE = 9

function rCode(digit: number): string {
  return L_CODES[digit].replace(/[01]/g, (bit) => (bit === "0" ? "1" : "0"))
}

function gCode(digit: number): string {
  return rCode(digit).split("").reverse().join("")
}

function ean13CheckDigit(digits12: string): number {
  let sum = 0

  for (let i = 0; i < 12; i += 1) {
    const digit = Number(digits12[i])
    sum += i % 2 === 0 ? digit : digit * 3
  }

  return (10 - (sum % 10)) % 10
}

export type Ean13Encoding = {
  modules: string
  /** The full 13 digits, including the check digit. */
  digits: string
}

export function encodeEan13(value: string): Ean13Encoding | null {
  const trimmed = value.replace(/[\s-]/g, "")

  if (!/^\d{12,13}$/.test(trimmed)) {
    return null
  }

  const check = ean13CheckDigit(trimmed.slice(0, 12))

  if (trimmed.length === 13 && Number(trimmed[12]) !== check) {
    return null
  }

  const digits = trimmed.slice(0, 12) + String(check)
  const parity = PARITY[Number(digits[0])]
  let modules = "101"

  for (let i = 1; i <= 6; i += 1) {
    const digit = Number(digits[i])
    modules += parity[i - 1] === "L" ? L_CODES[digit] : gCode(digit)
  }

  modules += "01010"

  for (let i = 7; i <= 12; i += 1) {
    modules += rCode(Number(digits[i]))
  }

  modules += "101"

  return { modules, digits }
}
