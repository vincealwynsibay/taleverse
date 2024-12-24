export type FormState = {
    message: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fields?: Record<string, any>,
    success?: boolean
  }