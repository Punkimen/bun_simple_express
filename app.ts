type TMethods = 'GET' | 'POST' | 'DELETE' | 'PUT' | 'UPDATE';
type TMethodsCallbacks = (
  req: Request,
  res: Response,
  next?: TMethodsCallbacks,
) => any;
type Routes = Map<string, Record<string, TMethodsCallbacks>>;

const createRoute = (
  routes: Routes,
  path: string,
  method: TMethods,
  cb: TMethodsCallbacks,
): boolean => {
  if (!path || !path.trim()) {
    throw new Error('Path cannot be empty');
  }

  const handler = routes.get(path);

  if (handler?.[method]) {
    throw new Error(`Method ${method} already exists for path ${path}`);
  }

  if (handler) {
    handler[method] = cb;
  } else {
    routes.set(path, { [method]: cb });
  }

  return true;
};

export const createApp = () => {
  const middleware: TMethodsCallbacks[] = [];
  const routes: Routes = new Map();

  const wrapResponse = (result: any): Response => {
    if (result instanceof Response) {
      return result;
    }
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const createCbWithMiddleware = (
    cb: TMethodsCallbacks,
    next?: TMethodsCallbacks,
  ) => {
    return async (req: Request, res: Response) => {
      if (middleware.length) {
        let index = 0;
        const nextMiddleware = async () => {
          const mw = middleware[index];
          index++;
          if (mw) {
            return await mw(req, res, nextMiddleware);
          } else {
            return await cb(req, res, next);
          }
        };
        const result = await nextMiddleware();
        return wrapResponse(result);
      } else {
        const result = await cb(req, res, next);
        return wrapResponse(result);
      }
    };
  };

  const methodGet = (
    path: string,
    cb: TMethodsCallbacks,
    next?: TMethodsCallbacks,
  ) => {
    const cbWithMiddleware = createCbWithMiddleware(cb, next);
    createRoute(routes, path, 'GET', cbWithMiddleware);
  };

  const methodPost = (
    path: string,
    cb: TMethodsCallbacks,
    next?: TMethodsCallbacks,
  ) => {
    const cbWithMiddleware = createCbWithMiddleware(cb, next);
    createRoute(routes, path, 'POST', cbWithMiddleware);
  };

  const methodDelete = (
    path: string,
    cb: TMethodsCallbacks,
    next?: TMethodsCallbacks,
  ) => {
    const cbWithMiddleware = createCbWithMiddleware(cb, next);
    createRoute(routes, path, 'DELETE', cbWithMiddleware);
  };

  const methodPut = (
    path: string,
    cb: TMethodsCallbacks,
    next?: TMethodsCallbacks,
  ) => {
    const cbWithMiddleware = createCbWithMiddleware(cb, next);
    createRoute(routes, path, 'PUT', cbWithMiddleware);
  };

  const methodUpdate = (
    path: string,
    cb: TMethodsCallbacks,
    next?: TMethodsCallbacks,
  ) => {
    const cbWithMiddleware = createCbWithMiddleware(cb, next);
    createRoute(routes, path, 'UPDATE', cbWithMiddleware);
  };

  const use = (cb: TMethodsCallbacks) => {
    middleware.push(cb);
  };

  const listen = (port: number, callback?: () => void) => {
    Bun.serve({
      port,
      fetch: async (request: Request) => {
        const url = new URL(request.url);
        const pathname = url.pathname;
        const method = request.method as TMethods;

        const handlers = routes.get(pathname);
        if (handlers && handlers[method]) {
          return await handlers[method](request, new Response());
        }

        return new Response('Not found', { status: 404 });
      },
    });

    callback?.();
  };

  return {
    methodDelete,
    methodGet,
    methodPost,
    methodPut,
    methodUpdate,
    use,
    listen,
  };
};
