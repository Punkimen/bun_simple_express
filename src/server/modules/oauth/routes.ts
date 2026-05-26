import type { AppMethods } from "../../app";
import { oAuthController } from "./controller";

export const initOAuthRoutes = (app: AppMethods) => {
  app.methodGet("/api/getGoogleOauth", async (req) => {
    return await oAuthController.authWithGoogle(req);
  });
  app.methodGet("/auth/google/callback", async (req) => {
    return await oAuthController.afterAuthGoogle(req);
  });
};
