export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 500, code = "APP_ERROR") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class ValidationError extends AppError {
  public readonly fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string> = {}) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
    this.fields = fields;
  }
}

export class NetworkError extends AppError {
  constructor(message = "Erreur réseau. Vérifiez votre connexion.") {
    super(message, 0, "NETWORK_ERROR");
    this.name = "NetworkError";
  }
}

export class AuthError extends AppError {
  constructor(message = "Vous devez être connecté pour effectuer cette action.") {
    super(message, 401, "AUTH_ERROR");
    this.name = "AuthError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Vous n'avez pas les permissions nécessaires.") {
    super(message, 403, "FORBIDDEN_ERROR");
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Ressource introuvable.") {
    super(message, 404, "NOT_FOUND_ERROR");
    this.name = "NotFoundError";
  }
}

export function handleApiError(error: unknown): { message: string; statusCode: number } {
  if (error instanceof AppError) {
    return { message: error.message, statusCode: error.statusCode };
  }
  if (error instanceof Error) {
    return { message: error.message, statusCode: 500 };
  }
  return { message: "Une erreur inattendue est survenue.", statusCode: 500 };
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof NetworkError) return true;
  if (error instanceof TypeError && error.message === "Failed to fetch") return true;
  return false;
}
