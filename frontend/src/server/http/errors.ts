// No "server-only" guard: this module is unit-tested with Vitest and used by
// standalone scripts, both of which run outside the Next.js build where the
// guard would throw unconditionally.
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { JwtInvalidError } from "@/server/auth/jwt";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
  static badRequest(message: string) {
    return new ApiError(400, message);
  }
  static unauthorized(message: string) {
    return new ApiError(401, message);
  }
  static forbidden(message: string) {
    return new ApiError(403, message);
  }
  static notFound(message: string) {
    return new ApiError(404, message);
  }
  static conflict(message: string) {
    return new ApiError(409, message);
  }
  static badGateway(message: string) {
    return new ApiError(502, message);
  }
  static serviceUnavailable(message: string) {
    return new ApiError(503, message);
  }
}

const STATUS_TEXT: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  429: "Too Many Requests",
  500: "Internal Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable",
};

function errorBody(status: number, message: string) {
  return {
    timestamp: new Date().toISOString(),
    status,
    error: STATUS_TEXT[status] ?? "Error",
    message,
  };
}

function zodMessage(err: ZodError): string {
  return err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
}

/**
 * Wraps a Route Handler body: ApiError -> mapped status, ZodError -> 400 with
 * "field: message; field2: message2" (mirrors Spring's
 * MethodArgumentNotValidException formatting), JwtInvalidError -> 401,
 * anything else -> generic 500 (never leak internals/provider errors to the
 * client).
 */
export async function withRoute(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json(errorBody(err.status, err.message), { status: err.status });
    }
    if (err instanceof ZodError) {
      return NextResponse.json(errorBody(400, zodMessage(err)), { status: 400 });
    }
    if (err instanceof JwtInvalidError) {
      return NextResponse.json(errorBody(401, "invalid or expired token"), { status: 401 });
    }
    console.error(err);
    return NextResponse.json(errorBody(500, "unexpected error"), { status: 500 });
  }
}
