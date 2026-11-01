import { PlatformAdapter, PlatformId, PlatformProvider } from "./adapters/types";
import { youtubeAdapter, youtubeProvider } from "./adapters/youtube-adapter";
import { appleAdapter, appleProvider } from "./adapters/apple-adapter";
import { spotifyAdapter, spotifyProvider } from "./adapters/spotify-adapter";
import { tidalAdapter, tidalProvider } from "./adapters/tidal-adapter";
import { deezerAdapter, deezerProvider } from "./adapters/deezer-adapter";
import { soundCloudAdapter, soundCloudProvider } from "./adapters/soundcloud-adapter";
import { subsonicAdapter, subsonicProvider } from "./adapters/subsonic-adapter";

export class PlatformRegistry {
  private static providers = new Map<PlatformId, PlatformProvider>();
  private static adapters = new Map<PlatformId, PlatformAdapter>();

  static {
    PlatformRegistry.initializeDefaults();
  }

  public static initializeDefaults(): void {
    PlatformRegistry.providers.clear();
    PlatformRegistry.adapters.clear();

    const builtInAdapters: PlatformAdapter[] = [
      youtubeAdapter,
      appleAdapter,
      spotifyAdapter,
      tidalAdapter,
      deezerAdapter,
      soundCloudAdapter,
      subsonicAdapter,
    ];

    for (const adapter of builtInAdapters) {
      PlatformRegistry.registerAdapter(adapter);
    }
  }

  public static register(provider: PlatformProvider): void {
    PlatformRegistry.providers.set(provider.id, provider);
  }

  public static registerAdapter(adapter: PlatformAdapter): void {
    PlatformRegistry.register(adapter.provider);
    PlatformRegistry.adapters.set(adapter.provider.id, adapter);
  }

  public static get(id: PlatformId): PlatformProvider | undefined {
    return PlatformRegistry.providers.get(id);
  }

  public static getAdapter(id: PlatformId): PlatformAdapter | undefined {
    return PlatformRegistry.adapters.get(id);
  }

  public static list(): PlatformProvider[] {
    return Array.from(PlatformRegistry.providers.values());
  }

  public static listActive(): PlatformProvider[] {
    return PlatformRegistry.list().filter((p) => p.status === "active");
  }

  public static listPlanned(): PlatformProvider[] {
    return PlatformRegistry.list().filter((p) => p.status === "planned");
  }

  public static reset(): void {
    PlatformRegistry.initializeDefaults();
  }
}

export * from "./adapters/types";
export {
  youtubeProvider,
  youtubeAdapter,
  appleProvider,
  appleAdapter,
  spotifyProvider,
  spotifyAdapter,
  tidalProvider,
  tidalAdapter,
  deezerProvider,
  deezerAdapter,
  soundCloudProvider,
  soundCloudAdapter,
  subsonicProvider,
  subsonicAdapter,
};
