export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_SERVER_ERROR",
    public details?: unknown
  ) {
    super(message)
    this.name = this.constructor.name
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      details: this.details,
    }
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Erro interno do servidor", details?: unknown) {
    super(message, 500, "INTERNAL_SERVER_ERROR", details)
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso não encontrado", details?: unknown) {
    super(message, 404, "NOT_FOUND", details)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acesso negado", details?: unknown) {
    super(message, 403, "FORBIDDEN", details)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autorizado", details?: unknown) {
    super(message, 401, "UNAUTHORIZED", details)
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Requisição inválida", details?: unknown) {
    super(message, 400, "BAD_REQUEST", details)
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflito", details?: unknown) {
    super(message, 409, "CONFLICT", details)
  }
}

export class ValidationError extends AppError {
  constructor(message = "Dados inválidos", details?: unknown) {
    super(message, 422, "VALIDATION_ERROR", details)
  }
}
