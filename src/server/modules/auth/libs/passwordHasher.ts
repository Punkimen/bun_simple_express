import type { IPasswordHasher } from "auth_package";

class PasswordHasher implements IPasswordHasher {
  async hash(password: string): Promise<string> {
    return Bun.password.hash(password);
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return Bun.password.verify(password, hash);
  }
}

export const passwordController = new PasswordHasher();
