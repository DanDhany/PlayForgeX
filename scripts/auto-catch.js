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

// Parse command line arguments
const rawArgs = process.argv.slice(2);
let service = "youtube";
let alias = "";
let customProfile = "";
let shouldClean = false;
let isNew = false;
let serverUrl = "";

for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg === "youtube" || arg === "apple" || arg === "reset") {
    service = arg;
  } else if (arg === "--alias" || arg === "-a") {
    alias = rawArgs[++i] || "";
  } else if (arg === "--profile" || arg === "-p") {
    customProfile = rawArgs[++i] || "";
  } else if (arg === "--clean" || arg === "-c") {
    shouldClean = true;
  } else if (arg === "--new" || arg === "-n") {
    isNew = true;
  } else if (arg === "--server" || arg === "-s" || arg === "--url") {
    serverUrl = rawArgs[++i] || "";
  }
}

const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), "data");
const SESSION_FILE = path.join(DATA_DIR, "session.json");
const APP_PORT = process.env.APP_PORT || process.env.PORT || "3080";
const rawServer = serverUrl || process.env.SERVER_URL || `http://localhost:${APP_PORT}`;
const API_BASE = rawServer.replace(/\/+$/, "");

// Compute isolated profile directory so subsequent accounts don't collide
const slug = alias ? alias.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase() : "";
let profileDirName = "chrome-profile";
if (customProfile) {
  profileDirName = `chrome-profile-${customProfile}`;
} else if (slug) {
  profileDirName = `chrome-profile-${slug}`;
} else if (isNew) {
  profileDirName = `chrome-profile-new-${Date.now()}`;
}

const CHROME_PROFILE_DIR = path.resolve(DATA_DIR, profileDirName);

if (shouldClean && fs.existsSync(CHROME_PROFILE_DIR)) {
  console.log(`🧹 Membersihkan cache dan profil Chrome (${profileDirName})...`);
  try {
    fs.rmSync(CHROME_PROFILE_DIR, { recursive: true, force: true });
    console.log("✓ Profil Chrome berhasil dibersihkan.");
  } catch (e) {
    console.warn("Gagal menghapus profil:", e.message);
  }
}

if (service === "reset") {
  console.log("Reset selesai.");
  process.exit(0);
}

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
  console.log(`✓ Sesi disimpan di ${SESSION_FILE}`);
}

async function registerToTuneBridge(payload) {
  try {
    const res = await fetch(`${API_BASE}/api/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`\n✓ Sukses terdaftar di TuneBridge Multi-Account!`);
      console.log(`  - Account ID : ${data.account?.id}`);
      console.log(`  - Local Alias: ${data.account?.localAlias}`);
      console.log(`  - Status     : ${data.account?.status}`);
      return data.account;
    } else {
      const err = await res.text();
      console.warn(`! Server /api/accounts merespons: ${err}`);
    }
  } catch {
    console.log(`! Catatan: Server TuneBridge (${API_BASE}) tidak dapat dijangkau. Sesi tetap tersimpan di file lokal.`);
  }
  return null;
}

async function notifyDockerLegacy(endpoint, payload) {
  try {
    await fetch(`${API_BASE}/api/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {}
}

async function main() {
  const executablePath = findChromePath();
  console.log(`\n🎵 TuneBridge Auto-Catch Multi-Account Launcher`);
  console.log(`===============================================`);
  console.log(`Target Platform : ${service.toUpperCase()}`);
  console.log(`Account Alias   : ${alias || "(Default / Primary)"}`);
  console.log(`Chrome Profile  : ${profileDirName}`);
  console.log(`Server Endpoint : ${API_BASE}/api/accounts`);
  console.log(`Launching Chrome: ${executablePath}\n`);
  console.log(`Silakan login seperti biasa di jendela Chrome yang terbuka.`);
  console.log(`TuneBridge akan otomatis menangkap sesi login tanpa perlu membuka DevTools!\n`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: false,
    defaultViewport: null,
    userDataDir: CHROME_PROFILE_DIR,
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
        const currentUrl = page.url();
        // Do NOT capture while user is still typing on Google Accounts / login flow
        if (
          currentUrl.includes("accounts.google.com") ||
          currentUrl.includes("ServiceLogin") ||
          currentUrl.includes("signin/v2") ||
          currentUrl.includes("identifier")
        ) {
          return;
        }

        // Must be on music.youtube.com
        if (!currentUrl.includes("music.youtube.com")) {
          return;
        }

        const ytCookies = await page.cookies(
          "https://music.youtube.com",
          "https://youtube.com"
        );

        const hasLoginInfo = ytCookies.some((c) => c.name === "LOGIN_INFO");
        const hasSapisid = ytCookies.some(
          (c) => c.name === "SAPISID" || c.name === "__Secure-3PAPISID"
        );

        if (hasLoginInfo && hasSapisid) {
          isCaptured = true;
          // Capture deduplicated cookies strictly for music.youtube.com
          const ytCookiesAll = await page.cookies("https://music.youtube.com");
          const cookieMap = new Map();
          for (const c of ytCookiesAll) {
            cookieMap.set(c.name, c.value);
          }
          const cookieString = Array.from(cookieMap.entries())
            .map(([k, v]) => `${k}=${v}`)
            .join("; ");

          console.log(`\n🎉 Berhasil! Akun YouTube Music terverifikasi dan cookie sesi tertangkap!`);
          
          const accountAlias = alias || "Koleksi Utama (YouTube Music)";
          await registerToTuneBridge({
            platform: "youtube",
            cookieString,
            alias: accountAlias,
          });

          // Legacy backwards-compatibility
          saveSession({ ytCookieString: cookieString });
          await notifyDockerLegacy("youtube", { cookieString, alias: accountAlias });

          setTimeout(async () => {
            await browser.close();
            process.exit(0);
          }, 1500);
        }
      } catch {
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
        const finalizeApple = async (userTok, devTok) => {
          isCaptured = true;
          console.log(`\n🎉 Berhasil! Token Apple Music tertangkap!`);
          
          const accountAlias = alias || "Koleksi Utama (Apple Music)";
          await registerToTuneBridge({
            platform: "apple",
            musicUserToken: userTok,
            developerToken: devTok || undefined,
            alias: accountAlias,
          });

          // Legacy backwards-compatibility
          saveSession({
            appleUserToken: userTok,
            appleDevToken: devTok || undefined,
          });
          await notifyDockerLegacy("apple", {
            musicUserToken: userTok,
            developerToken: devTok || undefined,
            alias: accountAlias,
          });

          setTimeout(async () => {
            await browser.close();
            process.exit(0);
          }, 1000);
        };

        if (capturedUserToken) {
          await finalizeApple(capturedUserToken, capturedDevToken);
          return;
        }

        // Check cookies fallback
        const cookies = await page.cookies("https://music.apple.com");
        const mediaToken = cookies.find((c) => c.name === "media-user-token");
        if (mediaToken && mediaToken.value) {
          await finalizeApple(mediaToken.value, capturedDevToken);
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
