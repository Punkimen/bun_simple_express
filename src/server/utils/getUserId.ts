import { UnauthorizedError } from "./error";
import { getRequestContext } from "./requestContext";

export const getUserId = (req: object): string => {
  const ctx = getRequestContext(req);
  if (!ctx?.userId) throw new UnauthorizedError();
  return ctx.userId;
};
