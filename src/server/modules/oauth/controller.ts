import * as client from "openid-client";
import { oAuthClient } from "./utils/client";
import type { BunRequest } from "bun";
import { BadRequestError, UnauthorizedError } from "../../utils/error";
import { prisma } from "../../prisma/db";
import { tokenController } from "../auth/controller";

class OAuthController {
  async authWithGoogle(req: Request) {
    const config = await oAuthClient.getGoogleConfig();

    let redirect_uri = process.env.GOOGLE_CALLBACK_URL || "";
    let scope = "openid email profile";

    let code_verifier = client.randomPKCECodeVerifier();
    let code_challenge = await client.calculatePKCECodeChallenge(code_verifier);

    let state = "";

    const params = {
      redirect_uri,
      scope,
      code_challenge,
      code_challenge_method: "S256",
      state,
    };

    if (!config.serverMetadata().supportsPKCE()) {
      state = client.randomState();
      params.state = state;
    }

    const redirectTo = client.buildAuthorizationUrl(config, params);
    const headers = new Headers();

    headers.append(
      "Set-Cookie",
      `oauth_cv=${code_verifier}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax`,
    );
    headers.append("Location", String(redirectTo));

    return new Response(null, { status: 302, headers });
  }

  async afterAuthGoogle(req: BunRequest) {
    const code_verifer = req.cookies.get("oauth_cv");
    if (!code_verifer) {
      throw new UnauthorizedError("Missing OAuth code");
    }
    const config = await oAuthClient.getGoogleConfig();
    const tokens = await client.authorizationCodeGrant(
      config,
      new URL(req.url),
      { pkceCodeVerifier: code_verifer },
    );

    const claims = tokens.claims();
    if (!claims) {
      throw new BadRequestError("claims not found");
    }

    const email = claims.email as string;
    const name = claims.name;

    const sub = claims.sub;
    const userId = await this.findOrCreateUser(
      sub,
      email,
      (name as string) ?? email,
    );

    const accessToken = await tokenController.createAccessToken({ userId });
    const refreshToken = await tokenController.createRefreshToken(userId);

    const headers = new Headers({ Location: "/home" });
    headers.append(
      "Set-Cookie",
      `access_token=${accessToken}; HttpOnly; Path=/; Max-Age=${60 * 15}`,
    );
    headers.append(
      "Set-Cookie",
      `refresh_token=${refreshToken}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}`,
    );
    headers.append("Set-Cookie", "oauth_cv=; HttpOnly; Path=/; Max-Age=0");

    return new Response(null, { status: 302, headers });
  }

  private async findOrCreateUser(
    sub: string,
    email: string,
    name: string,
  ): Promise<string> {
    const existing = await prisma.oAuthAccount.findUnique({
      where: { provider_provider_id: { provider: "google", provider_id: sub } },
    });

    if (existing) return existing.user_id;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      await prisma.oAuthAccount.create({
        data: {
          provider: "google",
          provider_id: sub,
          user_id: existingUser.id,
        },
      });
      return existingUser.id;
    }

    const newUser = await prisma.user.create({ data: { name, email } });
    await prisma.oAuthAccount.create({
      data: { provider: "google", provider_id: sub, user_id: newUser.id },
    });
    return newUser.id;
  }
}

export const oAuthController = new OAuthController();
