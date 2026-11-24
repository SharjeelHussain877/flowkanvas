import type {
  ConditionOperator,
  DesignElement,
  VisibilityCondition,
} from "@/schemas/templates/design"

export const CONDITION_OPERATOR_LABELS: Record<ConditionOperator, string> = {
  set: "has a value",
  empty: "is empty",
  equals: "equals",
  not_equals: "does not equal",
}

function hasValue(
  name: string,
  values: Record<string, string>,
  imageNames: ReadonlySet<string>
): boolean {
  if (imageNames.has(name)) {
    return true
  }

  const value = values[name]
  return typeof value === "string" && value.trim() !== ""
}

export function evaluateCondition(
  condition: VisibilityCondition,
  values: Record<string, string>,
  imageNames: ReadonlySet<string>
): boolean {
  switch (condition.operator) {
    case "set":
      return hasValue(condition.variable, values, imageNames)
    case "empty":
      return !hasValue(condition.variable, values, imageNames)
    case "equals":
      return (values[condition.variable] ?? "").trim() === condition.value.trim()
    case "not_equals":
      return (values[condition.variable] ?? "").trim() !== condition.value.trim()
    default:
      return true
  }
}

/** Elements without a condition are always visible. */
export function isElementVisible(
  element: DesignElement,
  values: Record<string, string>,
  imageNames: ReadonlySet<string>
): boolean {
  return element.condition ? evaluateCondition(element.condition, values, imageNames) : true
}

export function describeCondition(condition: VisibilityCondition): string {
  const base = `Shown when ${condition.variable} ${CONDITION_OPERATOR_LABELS[condition.operator]}`

  if (condition.operator === "equals" || condition.operator === "not_equals") {
    return `${base} "${condition.value}"`
  }

  return base
}
