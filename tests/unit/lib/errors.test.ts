import { describe, it, expect } from "vitest";
import {
  AppError,
  ValidationError,
  NetworkError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  handleApiError,
  isNetworkError,
} from "@/lib/errors";

describe("AppError", () => {
  it("creates error with default values", () => {
    const err = new AppError("test");
    expect(err.message).toBe("test");
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe("APP_ERROR");
    expect(err.name).toBe("AppError");
    expect(err).toBeInstanceOf(Error);
  });

  it("creates error with custom statusCode and code", () => {
    const err = new AppError("custom", 422, "CUSTOM_CODE");
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe("CUSTOM_CODE");
  });
});

describe("ValidationError", () => {
  it("creates validation error with fields", () => {
    const err = new ValidationError("invalid", { email: "Email requis" });
    expect(err.message).toBe("invalid");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.fields).toEqual({ email: "Email requis" });
    expect(err).toBeInstanceOf(AppError);
  });

  it("defaults to empty fields", () => {
    const err = new ValidationError("invalid");
    expect(err.fields).toEqual({});
  });
});

describe("NetworkError", () => {
  it("creates with default message", () => {
    const err = new NetworkError();
    expect(err.message).toBe("Erreur réseau. Vérifiez votre connexion.");
    expect(err.statusCode).toBe(0);
    expect(err.code).toBe("NETWORK_ERROR");
  });
});

describe("AuthError", () => {
  it("creates with default message", () => {
    const err = new AuthError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("AUTH_ERROR");
  });
});

describe("ForbiddenError", () => {
  it("creates with default message", () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
  });
});

describe("NotFoundError", () => {
  it("creates with default message", () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
  });
});

describe("handleApiError", () => {
  it("handles AppError", () => {
    const result = handleApiError(new ValidationError("bad input"));
    expect(result).toEqual({ message: "bad input", statusCode: 400 });
  });

  it("handles regular Error", () => {
    const result = handleApiError(new Error("oops"));
    expect(result).toEqual({ message: "oops", statusCode: 500 });
  });

  it("handles unknown error", () => {
    const result = handleApiError("string error");
    expect(result).toEqual({ message: "Une erreur inattendue est survenue.", statusCode: 500 });
  });
});

describe("isNetworkError", () => {
  it("returns true for NetworkError", () => {
    expect(isNetworkError(new NetworkError())).toBe(true);
  });

  it("returns true for Failed to fetch TypeError", () => {
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
  });

  it("returns false for other errors", () => {
    expect(isNetworkError(new Error("random"))).toBe(false);
  });

  it("returns false for non-error values", () => {
    expect(isNetworkError(null)).toBe(false);
    expect(isNetworkError(42)).toBe(false);
  });
});
