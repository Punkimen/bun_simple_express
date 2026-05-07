import { AuthController, TokenController } from "auth_package";
import { passwordController } from "./libs/passwordHasher";
import { prismaUserController } from "../users/libs/prismaUserRepo";
import { prismaTokenController } from "./libs/prismaToken";

export const tokenController = new TokenController(prismaTokenController, {
  secret: process.env.JWT_SECRET!,
  accessTokenExpiry: "15m",
  refreshTokenExpiry: "7d",
});

export const authController = new AuthController(
  tokenController,
  prismaUserController,
  passwordController,
);
