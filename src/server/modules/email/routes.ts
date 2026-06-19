import type { AppMethods } from "../../app";
import { sendEmailController } from "./controller";

export const initEmailRoutes = (app: AppMethods) => {
  app.methodGet("/api/email/verify", sendEmailController.verifyTransporter);
  app.methodGet("/api/email/testMessage", sendEmailController.sendMessage);
};
