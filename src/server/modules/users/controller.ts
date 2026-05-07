import { AppError } from "../../utils/error";

class Users {
  async createUser(_name: string) {
    throw new AppError("Not implemented", 501);
  }

  async getUsers() {
    throw new AppError("Not implemented", 501);
  }

  async getUserById(_id?: string) {
    throw new AppError("Not implemented", 501);
  }

  async deleteAllUsers() {
    throw new AppError("Not implemented", 501);
  }
}

export const userController = new Users();
