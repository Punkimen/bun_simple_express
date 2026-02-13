import db from '../db/db';
import { AppError } from '../utils/error';

class Transaction {
  path: string;
  constructor(path: string) {
    this.path = path;
  }

  createTransition() {}
}

class Users {
  async createUser(name: string) {
    const newUser = await db`INSERT INTO users (name) VALUES (${name})`;
    console.log({ newUser });
    return newUser;
  }
  async getUsers() {
    try {
      const users = await db`SELECT * FROM userss`;
      console.log({ users });
      return users;
    } catch (error: any) {
      console.error(error);
      throw new AppError(JSON.stringify(error), 500);
    }
  }
}

export const userController = new Users();
