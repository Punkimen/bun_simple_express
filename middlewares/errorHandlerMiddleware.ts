import type { MiddlewareCallback } from "../app";
import { AppError } from "../utils/error";

export const errorHandlerMiddleware: MiddlewareCallback = async (
  req,
  res,
  next,
) => {
  try {
    return await next?.();
  } catch (error: any) {
    let status = 500;
    let message = "Internal Server Error";

    if (error instanceof AppError) {
      status = error.status;
      message = error.message;
    } else if (error instanceof Error) {
      message = error.message;
    }

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
};
