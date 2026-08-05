export type AppMutationMeta = {
  /** Silent background work - do not show the global spinner. */
  background?: boolean
}

export const backgroundMutationMeta: AppMutationMeta = {
  background: true,
}
