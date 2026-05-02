import type { AppMethods } from "../../app";
import { userController } from "./controller";

export const initUsersRoutes = (app: AppMethods) => {
  app.methodGet("/users/:id", (req) => {
    const { id } = req.params;
    return userController.getUserById(id);
  });

  app.methodGet("/users", (req) => {
    return userController.getUsers();
  });

  app.methodPost<{ name: string }>("/createUser", async (req) => {
    const { name } = await req.json();
    return userController.createUser(name);
  });

  app.methodDelete("/deleteUsers", () => {
    return userController.deleteAllUsers();
  });
};
