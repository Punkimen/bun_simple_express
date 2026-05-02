await Bun.build({
  entrypoints: ["./src/server/index.ts"],
  outdir: "./build",
  target: "bun",
});
