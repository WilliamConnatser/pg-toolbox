import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      outputDir: "dist/types",
      tsConfigFilePath: "./tsconfig.json",
      skipDiagnostics: false,
      logDiagnostics: true,
    }),
  ],
  build: {
    lib: {
      entry: {
        main: "./src/index.ts",
        types: "./src/types.ts",
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) => {
        if (entryName === "types") return `types.${format}.js`;
        return `index.${format}.js`;
      },
    },
    rollupOptions: {
      external: [], // Add your external dependencies here
    },
  },
});
