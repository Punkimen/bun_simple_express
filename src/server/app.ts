import type { BunRequest } from "bun";
import { AppError } from "./utils/error";
import { join } from "path";
import { CLIENT_DIR } from "./utils/paths";

type TMethods = "GET" | "POST" | "DELETE" | "PUT";
type TMethodsCallbacks<T = any> = (
  req: Omit<BunRequest, "json"> & { json: () => Promise<T> },
  res?: Response,
) => any;
type BunRoutes = Record<string, any>;

export type MiddlewareCallback = (
  req: BunRequest,
  res?: Response,
  next?: () => Promise<Response | null | undefined>,
) => any;

export interface AppMethods {
  methodGet: <T = any>(path: string, cb: TMethodsCallbacks<T>) => void;
  methodPost: <T = any>(path: string, cb: TMethodsCallbacks<T>) => void;
  methodDelete: <T = any>(path: string, cb: TMethodsCallbacks<T>) => void;
  methodPut: <T = any>(path: string, cb: TMethodsCallbacks<T>) => void;
  methodHtml: (
    path: string,
    cb: (req: BunRequest, res?: Response) => Promise<string> | string,
  ) => void;
  use: (cb: MiddlewareCallback) => void;
  listen: (port: number, callback?: () => void) => void;
}

export const createApp = (): AppMethods => {
  const middleware: MiddlewareCallback[] = [];
  const routes: BunRoutes = {};

  const wrapResponse = (result: any): Response => {
    if (result instanceof Response) {
      return result;
    }
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  };

  const htmlWrap = (html: string): Response => {
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  };

  const executeMiddleware = async (
    req: BunRequest,
    res: Response,
  ): Promise<Response | null> => {
    let index = -1;

    const dispatch = async (i: number): Promise<Response | null> => {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }

      index = i;

      const mw = middleware[i];
      if (!mw) return null;

      const result = await mw(req, res, () => dispatch(i + 1));

      if (result instanceof Response) {
        return result;
      }

      return null;
    };

    return dispatch(0);
  };

  const wrapWithMiddleware = (cb: TMethodsCallbacks) => {
    return async (req: BunRequest, res: Response) => {
      try {
        const mwResult = await executeMiddleware(req, res);

        if (mwResult) {
          return mwResult;
        }

        const result = await cb(req, res);
        return wrapResponse(result);
      } catch (error) {
        let status = 500;
        let message = "Internal Server Error";

        if (error instanceof AppError) {
          status = error.status;
          message = error.message;
        } else if (error instanceof Error) {
          message = error.message;
        }

        const url = new URL(req.url);
        console.error(
          `[${new Date().toISOString()}] ${req.method} ${url.pathname} → ${status}: ${message}`,
          error instanceof AppError ? "" : error,
        );

        return new Response(JSON.stringify({ error: message }), {
          status,
          headers: { "Content-Type": "application/json" },
        });
      }
    };
  };

  const createMethodHandler = (
    path: string,
    method: TMethods,
    cb: TMethodsCallbacks,
  ) => {
    if (!path || !path.trim()) {
      throw new Error("Path cannot be empty");
    }

    const wrappedCallback = wrapWithMiddleware(cb);

    if (!routes[path]) {
      routes[path] = {};
    }

    if (typeof routes[path] === "object" && routes[path][method]) {
      throw new Error(`Method ${method} already exists for path ${path}`);
    }

    if (
      typeof routes[path] === "object" &&
      Object.keys(routes[path]).length === 0
    ) {
      routes[path] = { [method]: wrappedCallback };
    } else if (typeof routes[path] === "object") {
      routes[path][method] = wrappedCallback;
    } else {
      routes[path] = { [method]: wrappedCallback };
    }
  };

  const methodGet = <T = any>(path: string, cb: TMethodsCallbacks<T>) => {
    createMethodHandler(path, "GET", cb);
  };

  const methodPost = <T = any>(path: string, cb: TMethodsCallbacks<T>) => {
    createMethodHandler(path, "POST", cb);
  };

  const methodDelete = <T = any>(path: string, cb: TMethodsCallbacks<T>) => {
    createMethodHandler(path, "DELETE", cb);
  };

  const methodPut = <T = any>(path: string, cb: TMethodsCallbacks<T>) => {
    createMethodHandler(path, "PUT", cb);
  };

  const methodHtml = (
    path: string,
    cb: (req: BunRequest, res?: Response) => Promise<string> | string,
  ) => {
    createMethodHandler(path, "GET", async (req, res) => {
      const html = await cb(req, res);
      return htmlWrap(html);
    });
  };

  const use = (cb: MiddlewareCallback) => {
    middleware.push(cb);
  };

  const listen = (port: number, callback?: () => void) => {
    const server = Bun.serve({
      port,
      routes,
      async fetch(req) {
        const url = new URL(req.url);
        const path = url.pathname;

        if (!path.startsWith("/public")) {
          return new Response(null, {
            status: 302,
            headers: {
              Location: "/login",
            },
          });
        }

        try {
          const fileUrl = join(CLIENT_DIR, path);
          const file = Bun.file(fileUrl);

          if (!(await file.exists())) {
            return new Response("Not Found", { status: 404 });
          }

          return new Response(file);
        } catch (e) {
          console.error("Static middleware error:", e);
          return new Response("Internal Server Error", { status: 500 });
        }
      },
    });

    callback?.();
  };

  return {
    methodDelete,
    methodGet,
    methodPost,
    methodPut,
    methodHtml,
    use,
    listen,
  };
};
