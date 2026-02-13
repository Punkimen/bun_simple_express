import { userController } from '../controllers';

export const initRoutes = (app: any) => {
  app.methodGet('/users', () => {
    return userController.getUsers();
  });

  app.methodGet('/createUser', () => {
    return userController.createUser('John');
  });
};
