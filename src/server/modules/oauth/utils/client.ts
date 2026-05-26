import * as client from "openid-client";

class OAuthClients {
  async getGoofleConfig() {
    return await client.discovery(
      new URL(process.env.GOOGLE_URL as string),
      process.env.GOOGLE_CLIENT_ID as string,
      process.env.GOOGLE_CLIENT_SECRET,
    );
  }
}

export const oAuthClient = new OAuthClients();
