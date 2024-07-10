const esbuild = require("esbuild");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const entryPoints = ["./src/index.ts"];
const outDir = "dist";

// Clean the dist directory
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true });
}

// CommonJS build
esbuild
  .build({
    entryPoints,
    outdir: path.join(outDir, "cjs"),
    bundle: true,
    platform: "node",
    target: ["node14"],
    format: "cjs",
    sourcemap: true,
  })
  .catch(() => process.exit(1));

// ESM build
esbuild
  .build({
    entryPoints,
    outdir: path.join(outDir, "mjs"),
    bundle: true,
    platform: "node",
    target: ["node14"],
    format: "esm",
    sourcemap: true,
  })
  .catch(() => process.exit(1));

// Type definitions
exec("tsc --emitDeclarationOnly --outDir dist/types", (err, stdout, stderr) => {
  if (err) {
    console.error(`Error generating type definitions: ${stderr}`);
    process.exit(1);
  } else {
    console.log(stdout);
  }
});
