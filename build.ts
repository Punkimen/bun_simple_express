import { cp } from "fs/promises";

await Bun.build({
  entrypoints: ["./src/server/index.ts"],
  outdir: "./build",
  target: "bun",
  external: ["ejs"],
});

await cp("./src/client", "./build/client", { recursive: true });
console.log("Build complete: build/index.js + build/client/");
