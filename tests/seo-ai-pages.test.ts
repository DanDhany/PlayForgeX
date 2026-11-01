import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("SEO, AI Search & GitHub Pages Capabilities", () => {
  const rootDir = process.cwd();
  const indexHtmlPath = path.join(rootDir, "index.html");
  const indexHtml = fs.readFileSync(indexHtmlPath, "utf-8");

  describe("HTML Head Metadata & OpenGraph", () => {
    it("contains comprehensive SEO title and meta description", () => {
      expect(indexHtml).toContain("<title>TuneBridge — Universal Music Library & Migration Hub</title>");
      expect(indexHtml).toMatch(/<meta\s+name="description"\s+content="[^"]{50,}"/);
      expect(indexHtml).toMatch(/<meta\s+name="keywords"\s+content="[^"]*tunebridge[^"]*"/);
      expect(indexHtml).toContain('<meta name="robots" content="index, follow');
      expect(indexHtml).toContain('<link rel="canonical" href="https://tunebridge.app/"');
    });

    it("declares OpenGraph and Twitter card metadata with relative/resolvable assets", () => {
      expect(indexHtml).toContain('<meta property="og:type" content="website"');
      expect(indexHtml).toContain('<meta property="og:title" content="TuneBridge — Universal Music Library & Migration Hub"');
      expect(indexHtml).toContain('<meta property="og:image" content="og-image.svg"');
      expect(indexHtml).toContain('<meta name="twitter:card" content="summary_large_image"');
      expect(indexHtml).toContain('<meta name="twitter:image" content="og-image.svg"');
    });

    it("references AI discoverability links (llms.txt and author)", () => {
      expect(indexHtml).toContain('<link rel="help" href="llms.txt"');
      expect(indexHtml).toContain('<link rel="author" href="https://github.com/ramadhanykrismaliq/TuneBridge"');
    });
  });

  describe("JSON-LD Structured Data Schema", () => {
    it("includes a valid JSON-LD script tag with Schema.org graph", () => {
      const jsonLdMatch = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      expect(jsonLdMatch).not.toBeNull();
      const rawJson = jsonLdMatch![1].trim();

      let parsed: any;
      expect(() => {
        parsed = JSON.parse(rawJson);
      }).not.toThrow();

      expect(parsed["@context"]).toBe("https://schema.org");
      expect(Array.isArray(parsed["@graph"])).toBe(true);
    });

    it("declares SoftwareApplication with feature list and open source pricing", () => {
      const jsonLdMatch = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      const parsed = JSON.parse(jsonLdMatch![1].trim());

      const appNode = parsed["@graph"].find((node: any) => node["@type"] === "SoftwareApplication");
      expect(appNode).toBeDefined();
      expect(appNode.name).toBe("TuneBridge");
      expect(appNode.applicationCategory).toBe("MultimediaApplication");
      expect(appNode.offers.price).toBe("0");
      expect(appNode.featureList.length).toBeGreaterThan(4);
    });

    it("declares FAQPage with rich answer entities for AI search citations", () => {
      const jsonLdMatch = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      const parsed = JSON.parse(jsonLdMatch![1].trim());

      const faqNode = parsed["@graph"].find((node: any) => node["@type"] === "FAQPage");
      expect(faqNode).toBeDefined();
      expect(Array.isArray(faqNode.mainEntity)).toBe(true);
      expect(faqNode.mainEntity.length).toBeGreaterThanOrEqual(4);

      for (const item of faqNode.mainEntity) {
        expect(item["@type"]).toBe("Question");
        expect(item.name.length).toBeGreaterThan(10);
        expect(item.acceptedAnswer["@type"]).toBe("Answer");
        expect(item.acceptedAnswer.text.length).toBeGreaterThan(20);
      }
    });
  });

  describe("AI Search Crawler Protocols & Files", () => {
    it("provides public/robots.txt permitting major AI search crawlers", () => {
      const robotsPath = path.join(rootDir, "public", "robots.txt");
      expect(fs.existsSync(robotsPath)).toBe(true);

      const robots = fs.readFileSync(robotsPath, "utf-8");
      expect(robots).toContain("GPTBot");
      expect(robots).toContain("ClaudeBot");
      expect(robots).toContain("PerplexityBot");
      expect(robots).toContain("Sitemap: https://tunebridge.app/sitemap.xml");
    });

    it("provides public/sitemap.xml with landing page section anchors", () => {
      const sitemapPath = path.join(rootDir, "public", "sitemap.xml");
      expect(fs.existsSync(sitemapPath)).toBe(true);

      const sitemap = fs.readFileSync(sitemapPath, "utf-8");
      expect(sitemap).toContain("<loc>https://tunebridge.app/</loc>");
      expect(sitemap).toContain("<loc>https://tunebridge.app/#interactive-preview</loc>");
      expect(sitemap).toContain("<loc>https://tunebridge.app/#faq-section</loc>");
    });

    it("provides public/llms.txt and public/llms-full.txt conforming to LLM search specs", () => {
      const llmsPath = path.join(rootDir, "public", "llms.txt");
      const llmsFullPath = path.join(rootDir, "public", "llms-full.txt");

      expect(fs.existsSync(llmsPath)).toBe(true);
      expect(fs.existsSync(llmsFullPath)).toBe(true);

      const llms = fs.readFileSync(llmsPath, "utf-8");
      expect(llms).toContain("# TuneBridge");
      expect(llms).toContain("Core Capabilities");
      expect(llms).toContain("Architecture");

      const llmsFull = fs.readFileSync(llmsFullPath, "utf-8");
      expect(llmsFull).toContain("YouTube Music");
      expect(llmsFull).toContain("Apple Music");
      expect(llmsFull).toContain("Spotify");
    });

    it("provides public/favicon.svg and public/og-image.svg", () => {
      const faviconPath = path.join(rootDir, "public", "favicon.svg");
      const ogImagePath = path.join(rootDir, "public", "og-image.svg");

      expect(fs.existsSync(faviconPath)).toBe(true);
      expect(fs.existsSync(ogImagePath)).toBe(true);
    });
  });

  describe("GitHub Pages Deployment Workflow & Vite Configuration", () => {
    it("configures relative base './' in vite.config.ts for arbitrary subpath hosting", () => {
      const viteConfigPath = path.join(rootDir, "vite.config.ts");
      const viteConfig = fs.readFileSync(viteConfigPath, "utf-8");
      expect(viteConfig).toContain('base: "./"');
      expect(viteConfig).toContain('BUILD_TARGET === "web"');
    });

    it("defines build:pages script in package.json", () => {
      const pkgPath = path.join(rootDir, "package.json");
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      expect(pkg.scripts["build:pages"]).toBeDefined();
    });

    it("provides .github/workflows/deploy-pages.yml GitHub Actions workflow", () => {
      const workflowPath = path.join(rootDir, ".github", "workflows", "deploy-pages.yml");
      expect(fs.existsSync(workflowPath)).toBe(true);

      const workflow = fs.readFileSync(workflowPath, "utf-8");
      expect(workflow).toContain("actions/deploy-pages@v4");
      expect(workflow).toContain("actions/upload-pages-artifact@v3");
      expect(workflow).toContain("npm run build:pages");
    });
  });
});
