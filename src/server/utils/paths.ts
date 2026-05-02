import { join } from "path";

const isBundled = !import.meta.path.includes("/src/");

export const CLIENT_DIR = isBundled
  ? join(import.meta.dir, "client")
  : join(import.meta.dir, "../../client");
