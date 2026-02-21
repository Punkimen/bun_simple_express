import type { AppMethods } from '../app';
import { userController } from './controller';

export const initUsersRoutes = (app: AppMethods) => {
  app.methodGet('/users/:id', (req) => {
    console.log('Fetching user with ID:', req.params.id);
    return userController.getUsers();
  });

  app.methodGet<{ name: string }>('/createUser', (req) => {
    return userController.createUser('Max');
  });

  app.methodDelete('/deleteUsers', () => {
    return userController.deleteAllUsers();
  });
};
