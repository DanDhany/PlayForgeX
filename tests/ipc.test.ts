import { describe, it, expect } from "vitest";
import { IPC_CHANNELS } from "../src/shared/ipc";

describe("IPC Channel Definitions", () => {
  it("defines standard channel names", () => {
    expect(IPC_CHANNELS.LOGIN_YOUTUBE).toBe("auth:login-youtube");
    expect(IPC_CHANNELS.LOGIN_APPLE).toBe("auth:login-apple");
    expect(IPC_CHANNELS.GET_STATUS).toBe("auth:get-status");
    expect(IPC_CHANNELS.LOGOUT).toBe("auth:logout");
    expect(IPC_CHANNELS.FETCH_PLAYLISTS).toBe("playlists:fetch");
    expect(IPC_CHANNELS.FETCH_TRACKS).toBe("playlists:fetch-tracks");
    expect(IPC_CHANNELS.SEARCH_APPLE_CATALOG).toBe("search:apple-catalog");
    expect(IPC_CHANNELS.EXECUTE_TRANSFER).toBe("transfer:execute");
  });
});
