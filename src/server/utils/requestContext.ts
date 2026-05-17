type RequestContext = { userId: string };

const store = new WeakMap<object, RequestContext>();

export const setRequestContext = (req: object, ctx: RequestContext) =>
  store.set(req, ctx);

export const getRequestContext = (req: object): RequestContext | undefined =>
  store.get(req);
