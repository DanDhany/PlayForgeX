import React, { useState } from "react";
import { X, KeyRound, ExternalLink, AlertCircle } from "lucide-react";

interface AuthModalWebProps {
  service: "youtube" | "apple" | null;
  onClose: () => void;
  onSubmitYouTube: (cookieString: string) => Promise<void>;
  onSubmitApple: (userToken: string, devToken?: string) => Promise<void>;
}

export const AuthModalWeb: React.FC<AuthModalWebProps> = ({
  service,
  onClose,
  onSubmitYouTube,
  onSubmitApple,
}) => {
  if (!service) return null;

  const [cookieString, setCookieString] = useState("");
  const [appleUserToken, setAppleUserToken] = useState("");
  const [appleDevToken, setAppleDevToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (service === "youtube") {
        if (!cookieString.trim()) throw new Error("Cookie string cannot be empty");
        await onSubmitYouTube(cookieString.trim());
      } else {
        if (!appleUserToken.trim()) throw new Error("Music-User-Token cannot be empty");
        await onSubmitApple(appleUserToken.trim(), appleDevToken.trim() || undefined);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to authenticate");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                service === "youtube" ? "bg-red-500/20 text-red-400" : "bg-primary/20 text-primary"
              }`}
            >
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {service === "youtube" ? "Connect YouTube Music (Web)" : "Connect Apple Music (Web)"}
              </h3>
              <p className="text-xs text-slate-400">
                Session credentials will be saved in persistent storage.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {service === "youtube" ? (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300 block">
                YouTube Music Cookie Header
              </label>
              <p className="text-[11px] text-slate-400">
                Open{" "}
                <a
                  href="https://music.youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-red-400 underline inline-flex items-center gap-0.5"
                >
                  music.youtube.com <ExternalLink className="w-3 h-3" />
                </a>{" "}
                in your browser, inspect network request headers, and paste the `Cookie` string
                (containing SAPISID or __Secure-3PAPISID).
              </p>
              <textarea
                value={cookieString}
                onChange={(e) => setCookieString(e.target.value)}
                placeholder="SAPISID=...; __Secure-3PAPISID=...; SID=..."
                rows={4}
                className="w-full bg-card border border-border rounded-lg p-2.5 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-red-500 transition"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">
                  Apple Music-User-Token (media-user-token)
                </label>
                <p className="text-[11px] text-slate-400">
                  From{" "}
                  <a
                    href="https://music.apple.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline inline-flex items-center gap-0.5"
                  >
                    music.apple.com <ExternalLink className="w-3 h-3" />
                  </a>{" "}
                  cookie `media-user-token` or request header `Music-User-Token`.
                </p>
                <textarea
                  value={appleUserToken}
                  onChange={(e) => setAppleUserToken(e.target.value)}
                  placeholder="Paste media-user-token here..."
                  rows={3}
                  className="w-full bg-card border border-border rounded-lg p-2.5 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 block">
                  Developer Token (Optional - fallback is embedded)
                </label>
                <input
                  type="text"
                  value={appleDevToken}
                  onChange={(e) => setAppleDevToken(e.target.value)}
                  placeholder="Bearer token (optional)"
                  className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary transition"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-card hover:bg-card-hover border border-border text-slate-300 rounded-lg text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-1.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5"
            >
              {isLoading ? "Saving..." : "Save & Connect"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
