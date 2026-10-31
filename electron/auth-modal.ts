import { BrowserWindow, session } from "electron";

export interface YouTubeAuthResult {
  success: boolean;
  cookieString?: string;
  error?: string;
}

export interface AppleAuthResult {
  success: boolean;
  musicUserToken?: string;
  developerToken?: string;
  error?: string;
}

export async function openYouTubeLoginModal(parent: BrowserWindow): Promise<YouTubeAuthResult> {
  return new Promise((resolve) => {
    const modal = new BrowserWindow({
      width: 900,
      height: 720,
      parent,
      modal: true,
      title: "Sign in to YouTube Music",
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    const targetUrl = "https://music.youtube.com";
    modal.loadURL(targetUrl);

    let isResolved = false;

    const checkCookies = async () => {
      if (isResolved) return;
      try {
        const cookies = await session.defaultSession.cookies.get({ domain: "youtube.com" });
        const googleCookies = await session.defaultSession.cookies.get({ domain: "google.com" });
        const allCookies = [...cookies, ...googleCookies];

        const hasSapisid = allCookies.some(
          (c) => c.name === "SAPISID" || c.name === "__Secure-3PAPISID"
        );

        if (hasSapisid) {
          const cookieString = allCookies
            .map((c) => `${c.name}=${c.value}`)
            .join("; ");

          isResolved = true;
          modal.close();
          resolve({ success: true, cookieString });
        }
      } catch (err) {
        console.error("Error reading YouTube cookies:", err);
      }
    };

    // Poll on navigation finish
    modal.webContents.on("did-finish-load", () => {
      checkCookies();
    });

    const interval = setInterval(checkCookies, 2000);

    modal.on("closed", () => {
      clearInterval(interval);
      if (!isResolved) {
        resolve({ success: false, error: "Login window was closed by user" });
      }
    });
  });
}

export async function openAppleMusicLoginModal(parent: BrowserWindow): Promise<AppleAuthResult> {
  return new Promise((resolve) => {
    const modal = new BrowserWindow({
      width: 950,
      height: 750,
      parent,
      modal: true,
      title: "Sign in to Apple Music",
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    const targetUrl = "https://music.apple.com";
    modal.loadURL(targetUrl);

    let isResolved = false;
    let capturedDevToken: string | undefined;
    let capturedUserToken: string | undefined;

    // Intercept web requests to amp-api.music.apple.com to capture exact Music-User-Token & dev token
    const filter = { urls: ["*://*.apple.com/*"] };

    session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
      if (!isResolved) {
        const authHeader = details.requestHeaders["Authorization"] || details.requestHeaders["authorization"];
        const userTokenHeader = details.requestHeaders["Music-User-Token"] || details.requestHeaders["music-user-token"];

        if (authHeader && authHeader.startsWith("Bearer ")) {
          capturedDevToken = authHeader.replace("Bearer ", "").trim();
        }

        if (userTokenHeader) {
          capturedUserToken = userTokenHeader.trim();
        }

        if (capturedUserToken) {
          isResolved = true;
          setTimeout(() => {
            try {
              modal.close();
            } catch {}
            resolve({
              success: true,
              musicUserToken: capturedUserToken,
              developerToken: capturedDevToken,
            });
          }, 500);
        }
      }
      callback({ requestHeaders: details.requestHeaders });
    });

    // Fallback cookie check for media-user-token
    const checkAppleCookies = async () => {
      if (isResolved) return;
      try {
        const cookies = await session.defaultSession.cookies.get({ domain: "apple.com" });
        const mediaUserTokenCookie = cookies.find((c) => c.name === "media-user-token");
        if (mediaUserTokenCookie && mediaUserTokenCookie.value) {
          isResolved = true;
          modal.close();
          resolve({
            success: true,
            musicUserToken: mediaUserTokenCookie.value,
            developerToken: capturedDevToken,
          });
        }
      } catch (err) {
        console.error("Error reading Apple Music cookies:", err);
      }
    };

    modal.webContents.on("did-finish-load", () => {
      checkAppleCookies();
    });

    const interval = setInterval(checkAppleCookies, 2000);

    modal.on("closed", () => {
      clearInterval(interval);
      if (!isResolved) {
        resolve({ success: false, error: "Apple Music login window was closed" });
      }
    });
  });
}
