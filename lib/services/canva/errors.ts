export class CanvaServiceError extends Error {
  status: number
  code: string

  constructor(message: string, status = 500, code = "CANVA_ERROR") {
    super(message)
    this.name = "CanvaServiceError"
    this.status = status
    this.code = code
  }
}
