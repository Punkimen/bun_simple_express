import db from '../db/db';
import { AppError } from '../utils/error';

class Users {
  async createUser(name: string) {
    console.log(
      'example',
      `INSERT INTO users (name) VALUES (${name}) RETURNING *`,
    );
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

  async getUserById(id: string) {
    try {
      const user = await db`SELECT * FROM users WHERE id = ${id}`;
      if (!user[0]) {
        throw new AppError('User not found', 404);
      }
      return user[0];
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
