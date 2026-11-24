/**
 * Code 128 encoder (subsets B and C with automatic switching).
 * Each pattern lists bar/space widths in modules, starting with a bar.
 */
const PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232",
]

const STOP_PATTERN = "2331112"

const START_B = 104
const START_C = 105
const CODE_B = 100
const CODE_C = 99

export const CODE128_QUIET_ZONE = 10

function isDigit(char: string): boolean {
  return char >= "0" && char <= "9"
}

function digitRun(value: string, index: number): number {
  let run = 0

  while (index + run < value.length && isDigit(value[index + run])) {
    run += 1
  }

  return run
}

function patternToModules(pattern: string): string {
  let modules = ""

  for (let i = 0; i < pattern.length; i += 1) {
    modules += (i % 2 === 0 ? "1" : "0").repeat(Number(pattern[i]))
  }

  return modules
}

/** Returns the module string ("1" = bar, "0" = space) or null for unsupported characters. */
export function encodeCode128(value: string): string | null {
  if (value.length === 0) {
    return null
  }

  for (const char of value) {
    const code = char.charCodeAt(0)

    if (code < 32 || code > 126) {
      return null
    }
  }

  const codes: number[] = []
  let index = 0
  let subset: "B" | "C"

  if (digitRun(value, 0) >= 4 && (value.length === digitRun(value, 0) || digitRun(value, 0) % 2 === 0)) {
    codes.push(START_C)
    subset = "C"
  } else {
    codes.push(START_B)
    subset = "B"
  }

  while (index < value.length) {
    const run = digitRun(value, index)

    if (subset === "B") {
      const remaining = value.length - index
      const shouldSwitch = run >= 4 && (run === remaining || run % 2 === 0)

      if (shouldSwitch) {
        codes.push(CODE_C)
        subset = "C"
        continue
      }

      codes.push(value.charCodeAt(index) - 32)
      index += 1
      continue
    }

    if (run >= 2) {
      codes.push(Number(value.slice(index, index + 2)))
      index += 2
      continue
    }

    codes.push(CODE_B)
    subset = "B"
  }

  let checksum = codes[0]

  for (let i = 1; i < codes.length; i += 1) {
    checksum += codes[i] * i
  }

  codes.push(checksum % 103)

  let modules = ""

  for (const code of codes) {
    modules += patternToModules(PATTERNS[code])
  }

  modules += patternToModules(STOP_PATTERN)

  return modules
}
