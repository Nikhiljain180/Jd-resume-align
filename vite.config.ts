import { defineConfig } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { copyFileSync, mkdirSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readPackageVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf8")) as {
      version?: string;
    };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function extensionManifestPlugin() {
  return {
    name: "extension-manifest-and-assets",
    closeBundle() {
      const dist = resolve(__dirname, "dist");
      if (!existsSync(dist)) return;
      const manifestSrc = resolve(__dirname, "src/manifest.json");
      const manifest = JSON.parse(readFileSync(manifestSrc, "utf8")) as Record<string, unknown>;
      manifest.version = readPackageVersion();
      writeFileSync(resolve(dist, "manifest.json"), JSON.stringify(manifest, null, 2));
      const nestedPanel = resolve(dist, "src/sidepanel/index.html");
      const flatPanelDir = resolve(dist, "sidepanel");
      if (existsSync(nestedPanel)) {
        if (!existsSync(flatPanelDir)) mkdirSync(flatPanelDir, { recursive: true });
        let html = readFileSync(nestedPanel, "utf8");
        html = html.replaceAll("../../sidepanel.js", "../sidepanel.js");
        html = html.replaceAll("../../assets/", "../assets/");
        writeFileSync(resolve(flatPanelDir, "index.html"), html);
      }
      const legacySrc = resolve(dist, "src");
      if (existsSync(legacySrc)) {
        try {
          rmSync(legacySrc, { recursive: true, force: true });
        } catch {
          /* ignore */
        }
      }
      const pub = resolve(__dirname, "public");
      const iconsDir = resolve(dist, "icons");
      if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });
      for (const name of ["icon48.png", "icon128.png"]) {
        const from = resolve(pub, "icons", name);
        if (existsSync(from)) copyFileSync(from, resolve(iconsDir, name));
      }
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [extensionManifestPlugin()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background/index.ts"),
        sidepanel: resolve(__dirname, "src/sidepanel/index.html"),
        "content/linkedin": resolve(__dirname, "src/content/linkedin.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name][extname]",
        format: "es",
      },
    },
    target: "es2022",
  },
});
