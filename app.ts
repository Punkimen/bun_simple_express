import type { BunRequest } from "bun";

type TMethods = "GET" | "POST" | "DELETE" | "PUT";
type TMethodsCallbacks<T = any> = (
  req: Omit<BunRequest, "json"> & { json: () => Promise<T> },
  res?: Response,
) => any;
type BunRoutes = Record<string, any>;
type MiddlewareCallback = (
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
    cb: (req: BunRequest, res?: Response) => Promise<string>,
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
    console.log("Wrapping HTML response");
    return new Response(html, {
      headers: { "Content-Type": "text/html" },
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
        console.log("Middleware returned Response", result);
        return result;
      }

      return null;
    };

    return dispatch(0);
  };
  const wrapWithMiddleware = (cb: TMethodsCallbacks) => {
    return async (req: BunRequest, res: Response) => {
      const mwResult = await executeMiddleware(req, res);
      console.log({ mwResult });
      if (mwResult) {
        console.log("retrun mwResult", { mwResult });
        return mwResult;
      }

      const result = await cb(req, res);
      return wrapResponse(result);
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
    cb: (req: BunRequest, res?: Response) => Promise<string>,
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
      fetch() {
        return new Response("Not Found", { status: 404 });
      },
    });
    console.log(`Server running at ${server.url}`);
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
