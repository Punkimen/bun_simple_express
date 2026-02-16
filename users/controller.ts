import db from '../db/db';
import { AppError } from '../utils/error';

class Users {
  async createUser(name: string) {
    try {
      const newUser =
        await db`INSERT INTO users (name) VALUES (${name}) RETURNING *`;
      if (!newUser[0]) {
        throw new AppError('Failed to create user', 500);
      }

      return newUser;
    } catch (error: any) {
      throw new AppError(JSON.stringify(error), 500);
    }
  }
  async getUsers() {
    try {
      const users = await db`SELECT * FROM users`;
      return users;
    } catch (error: any) {
      throw new AppError(JSON.stringify(error), 500);
    }
  }

  async deleteAllUsers() {
    try {
      await db`DELETE FROM users`;
      const result = await db`DELETE FROM users`;
      return {
        success: true,
        deletedCount: result.count,
      };
    } catch (error: any) {
      throw new AppError(JSON.stringify(error), 500);
    }
  }
}

export const userController = new Users();
