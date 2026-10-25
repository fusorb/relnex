import { NextResponse }    from "next/server";
import { ZodError }        from "zod";
import { ApiError }        from "./api-error";
import { SgError }   from "@/lib/sg/client";
import { FlowError }       from "@/core/flows";

export function handleError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { success: false, error: err.code, message: err.message },
      { status: err.statusCode }
    );
  }
  if (err instanceof SgError) {
    return NextResponse.json(
      { success: false, error: err.code, message: err.message },
      { status: err.status }
    );
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR", issues: err.flatten().fieldErrors },
      { status: 422 }
    );
  }
  if (err instanceof FlowError) {
    return NextResponse.json(
      { success: false, error: err.code, message: err.message },
      { status: err.statusCode }
    );
  }
  const msg = err instanceof Error ? err.message : "Internal Server Error";
  return NextResponse.json(
    { success: false, error: "INTERNAL_SERVER_ERROR",
      message: process.env.NODE_ENV === "production" ? "An unexpected error occurred" : msg },
    { status: 500 }
  );
}
