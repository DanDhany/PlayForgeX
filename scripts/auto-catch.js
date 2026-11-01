import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
];

function findChromePath() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    "Google Chrome/Chromium not found. Please ensure Google Chrome is installed in /Applications."
  );
}

const service = (process.argv[2] || "youtube").toLowerCase();
const DATA_DIR = path.resolve(process.cwd(), "data");
const SESSION_FILE = path.join(DATA_DIR, "session.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadSession() {
  if (fs.existsSync(SESSION_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(SESSION_FILE, "utf-8"));
    } catch {}
  }
  return {};
}

function saveSession(data) {
  const current = loadSession();
  const updated = { ...current, ...data };
  fs.writeFileSync(SESSION_FILE, JSON.stringify(updated, null, 2), "utf-8");
  console.log(`\n✓ Credentials saved to ${SESSION_FILE}`);
}

async function notifyDocker(endpoint, payload) {
  try {
    const res = await fetch(`http://localhost:3080/api/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      console.log(`✓ Docker container updated via http://localhost:3080/api/auth/${endpoint}`);
    }
  } catch {
    // Docker container might not be running yet, which is fine since session.json is persistent!
  }
}

async function main() {
  const executablePath = findChromePath();
  console.log(`\n🎵 MirrorSong Auto-Catch Cookie Launcher`);
  console.log(`=========================================`);
  console.log(`Target: ${service.toUpperCase()}`);
  console.log(`Launching Chrome from: ${executablePath}`);
  console.log(`Silakan login seperti biasa di jendela Chrome yang terbuka.\nMirrorSong akan otomatis menangkap sesi login tanpa perlu membuka Network DevTools!\n`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: false,
    defaultViewport: null,
    userDataDir: path.resolve(DATA_DIR, "chrome-profile"),
    ignoreDefaultArgs: ["--enable-automation"],
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1200,800",
      "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    ],
  });

  const page = (await browser.pages())[0] || (await browser.newPage());

  // Mask automation properties to bypass Google security check
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  if (service === "youtube") {
    await page.goto("https://music.youtube.com", { waitUntil: "domcontentloaded" });
    console.log(`Menunggu login YouTube Music...`);

    let isCaptured = false;

    const checkCookies = async () => {
      if (isCaptured) return;
      try {
        const cookies = await page.cookies(
          "https://music.youtube.com",
          "https://youtube.com",
          "https://google.com"
        );

        const hasSapisid = cookies.some(
          (c) => c.name === "SAPISID" || c.name === "__Secure-3PAPISID"
        );

        if (hasSapisid) {
          isCaptured = true;
          const cookieString = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

          console.log(`\n🎉 Berhasil! Cookie sesi YouTube Music tertangkap otomatis!`);
          saveSession({ ytCookieString: cookieString });
          await notifyDocker("youtube", { cookieString });

          setTimeout(async () => {
            await browser.close();
            process.exit(0);
          }, 1000);
        }
      } catch (err) {
        // ignore polling errors
      }
    };

    const interval = setInterval(checkCookies, 2000);

    browser.on("disconnected", () => {
      clearInterval(interval);
      if (!isCaptured) {
        console.log("Jendela browser ditutup sebelum login selesai.");
        process.exit(1);
      }
    });
  } else if (service === "apple") {
    let isCaptured = false;
    let capturedDevToken = "";
    let capturedUserToken = "";

    await page.setRequestInterception(true);

    page.on("request", (req) => {
      const headers = req.headers();
      const auth = headers["authorization"] || headers["Authorization"];
      const userToken = headers["music-user-token"] || headers["Music-User-Token"];

      if (auth && auth.startsWith("Bearer ")) {
        capturedDevToken = auth.replace("Bearer ", "").trim();
      }
      if (userToken) {
        capturedUserToken = userToken.trim();
      }

      req.continue();
    });

    await page.goto("https://music.apple.com", { waitUntil: "domcontentloaded" });
    console.log(`Menunggu login Apple Music...`);

    const checkAppleSession = async () => {
      if (isCaptured) return;
      try {
        if (capturedUserToken) {
          isCaptured = true;
          console.log(`\n🎉 Berhasil! Token Apple Music tertangkap dari request!`);
          saveSession({
            appleUserToken: capturedUserToken,
            appleDevToken: capturedDevToken || undefined,
          });
          await notifyDocker("apple", {
            musicUserToken: capturedUserToken,
            developerToken: capturedDevToken || undefined,
          });

          setTimeout(async () => {
            await browser.close();
            process.exit(0);
          }, 1000);
          return;
        }

        // Check cookies fallback
        const cookies = await page.cookies("https://music.apple.com");
        const mediaToken = cookies.find((c) => c.name === "media-user-token");
        if (mediaToken && mediaToken.value) {
          isCaptured = true;
          console.log(`\n🎉 Berhasil! media-user-token tertangkap dari cookies!`);
          saveSession({
            appleUserToken: mediaToken.value,
            appleDevToken: capturedDevToken || undefined,
          });
          await notifyDocker("apple", {
            musicUserToken: mediaToken.value,
            developerToken: capturedDevToken || undefined,
          });

          setTimeout(async () => {
            await browser.close();
            process.exit(0);
          }, 1000);
        }
      } catch {}
    };

    const interval = setInterval(checkAppleSession, 2000);

    browser.on("disconnected", () => {
      clearInterval(interval);
      if (!isCaptured) {
        console.log("Jendela browser ditutup sebelum login selesai.");
        process.exit(1);
      }
    });
  }
}

main().catch((err) => {
  console.error("Auto-catch error:", err);
  process.exit(1);
});
