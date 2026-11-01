import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("PlayForgeX Branding & Infrastructure Configuration", () => {
  const rootDir = path.resolve(__dirname, "..");
  const packageJsonPath = path.join(rootDir, "package.json");
  const dockerComposePath = path.join(rootDir, "docker-compose.yml");
  const dockerfilePath = path.join(rootDir, "Dockerfile");
  const indexHtmlPath = path.join(rootDir, "index.html");

  it("package.json has name playforgex and no legacy branding references", () => {
    const raw = fs.readFileSync(packageJsonPath, "utf-8");
    const pkg = JSON.parse(raw);

    expect(pkg.name).toBe("playforgex");
    expect(raw).not.toMatch(/mirrorsong/i);
    expect(raw).not.toMatch(/music2anywhere/i);
    expect(raw).not.toMatch(/tunebridge/i);
  });

  it("docker-compose.yml defines playforgex-app and with-db mysql service", () => {
    const composeContent = fs.readFileSync(dockerComposePath, "utf-8");

    expect(composeContent).toContain("container_name: playforgex-app");
    expect(composeContent).toContain("image: playforgex-app:latest");
    expect(composeContent).toContain("profiles:\n      - with-db");
    expect(composeContent).toContain("./data/mysql:/var/lib/mysql");
    expect(composeContent).toContain("playforgex-mysql");
    expect(composeContent).toContain("MYSQL_DATABASE: playforgex");

    expect(composeContent).not.toMatch(/mirrorsong/i);
    expect(composeContent).not.toMatch(/music2anywhere/i);
    expect(composeContent).not.toMatch(/tunebridge/i);
  });

  it("index.html title is PlayForgeX — Universal Music Library & Migration Hub", () => {
    const html = fs.readFileSync(indexHtmlPath, "utf-8");

    expect(html).toContain("<title>PlayForgeX — Universal Music Library & Migration Hub</title>");
    expect(html).not.toMatch(/mirrorsong/i);
    expect(html).not.toMatch(/music2anywhere/i);
    expect(html).not.toMatch(/tunebridge/i);
  });

  it("Dockerfile has no leftover legacy references", () => {
    const dockerfile = fs.readFileSync(dockerfilePath, "utf-8");

    expect(dockerfile).not.toMatch(/mirrorsong/i);
    expect(dockerfile).not.toMatch(/music2anywhere/i);
    expect(dockerfile).not.toMatch(/tunebridge/i);
  });
});
