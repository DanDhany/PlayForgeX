import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  "/usr/bin/google-chrome",
];

function findChrome() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("Chrome not found");
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // iPhone 15 specs: 393 x 852 px, dpr 3
  await page.setViewport({
    width: 393,
    height: 852,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  await page.goto("http://localhost:3080", { waitUntil: "networkidle0" });

  const outDir = "/tmp/tunebridge-audit";
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // 1. Navigate to Transfer Studio
  await page.evaluate(() => {
    // Find Transfer tab button in mobile bottom nav
    const buttons = Array.from(document.querySelectorAll("nav button"));
    const transferBtn = buttons.find((b) => b.textContent?.includes("Transfer"));
    if (transferBtn) transferBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  // 2. Select playlist "Random mixed 3 August"
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll("button"));
    const plCard = cards.find((c) => c.textContent?.includes("Random mixed 3 August"));
    if (plCard) plCard.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // 3. Switch to "Review Lagu" segmented tab
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll("button"));
    const reviewTab = tabs.find((t) => t.textContent?.includes("Review Lagu"));
    if (reviewTab) reviewTab.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.screenshot({ path: path.join(outDir, "iphone15-review-before-play.png") });
  console.log("Captured review before play");

  // 4. Click play button on the first track
  const playClicked = await page.evaluate(() => {
    const playBtns = Array.from(document.querySelectorAll("button")).filter(
      (b) => b.querySelector("svg") && (b.className.includes("absolute") || b.title?.includes("cuplikan"))
    );
    if (playBtns.length > 0) {
      playBtns[0].click();
      return true;
    }
    return false;
  });
  console.log("Play clicked:", playClicked);
  await new Promise((r) => setTimeout(r, 800));

  // 5. Screenshot with MusicPlayerBar active
  await page.screenshot({ path: path.join(outDir, "iphone15-player-active.png") });
  console.log("Captured player active on iPhone 15");

  const layoutMetrics = await page.evaluate(() => {
    const nav = document.querySelector("nav");
    const player = document.querySelector(".fixed.z-50.animate-sheet-up");
    const transferBar = document.querySelector(".md\\:hidden.fixed.z-30");

    const getBox = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, height: r.height, left: r.left, right: r.right, width: r.width };
    };

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      nav: getBox(nav),
      player: getBox(player),
      transferBar: getBox(transferBar),
    };
  });
  console.log("Layout Metrics:", JSON.stringify(layoutMetrics, null, 2));

  await browser.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
