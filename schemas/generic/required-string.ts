import { z } from "zod"

const stringTypeError = "This field must be a string"

export function requiredString(requiredMessage: string) {
  return z.string({ error: stringTypeError }).min(1, requiredMessage)
}
