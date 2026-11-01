import React from "react";
import {
  LayoutDashboard,
  ArrowRightLeft,
  ListMusic,
  Users,
  History,
  Settings,
  Disc3,
  Server,
  Sparkles,
} from "lucide-react";

export type NavTab = "overview" | "transfer" | "library" | "accounts" | "activity" | "settings";

interface NavigationRailProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  connectedCount: number;
  onOpenLanding?: () => void;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  activeTab,
  onChangeTab,
  connectedCount,
  onOpenLanding,
}) => {
  const desktopNavItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "transfer", label: "Transfer & Merge", icon: ArrowRightLeft },
    { id: "library", label: "Library", icon: ListMusic },
    { id: "accounts", label: "Accounts", icon: Users },
    { id: "activity", label: "Activity", icon: History },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // Mobile Bottom Tab Bar has 5 primary items; Settings is in the mobile top header
  const mobileTabItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: "overview", label: "Home", icon: LayoutDashboard },
    { id: "transfer", label: "Transfer", icon: ArrowRightLeft },
    { id: "library", label: "Library", icon: ListMusic },
    { id: "accounts", label: "Accounts", icon: Users },
    { id: "activity", label: "Activity", icon: History },
  ];

  return (
    <>
      {/* Desktop Left Rail (Linear Style) */}
      <aside className="hidden md:flex flex-col w-60 bg-surface border-r border-border select-none flex-shrink-0 z-30 justify-between h-full">
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="h-14 px-5 flex items-center gap-3 border-b border-border/80">
            <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-accent shadow-sm">
              <Disc3 className="w-4 h-4 animate-spin-slow" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold tracking-tight text-text-primary">TuneBridge</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-accent/15 text-accent font-medium rounded-md border border-accent/20">
                  v1.2
                </span>
              </div>
              <p className="text-[11px] text-text-secondary truncate leading-tight">
                Your Music, Woven Together
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-text-secondary/70">
              Workspace
            </div>
            {desktopNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onChangeTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors btn-press ${
                    isActive
                      ? "bg-surface-elevated text-text-primary border border-border shadow-sm font-semibold"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-accent" : "text-text-secondary"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.id === "accounts" && connectedCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent font-mono font-medium">
                      {connectedCount}
                    </span>
                  )}
                  {isActive && item.id !== "accounts" && (
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  )}
                </button>
              );
            })}

            {onOpenLanding && (
              <div className="pt-2 mt-2 border-t border-border/50">
                <button
                  onClick={onOpenLanding}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors btn-press group"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
                    <span>Tentang TuneBridge</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-accent/10 text-accent font-medium border border-accent/20">
                    Landing
                  </span>
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* Desktop Self-Hosted Footer */}
        <div className="p-3 border-t border-border/80">
          <div className="px-3 py-2 rounded-lg bg-surface-elevated/50 border border-border/60 flex items-center justify-between text-xs text-text-secondary">
            <div className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-status-success" />
              <span className="text-[11px] font-mono">Self-Hosted</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
          </div>
        </div>
      </aside>

      {/* Mobile Top Brand Bar (Full Width Block at Top) */}
      <header className="md:hidden w-full h-14 bg-surface/95 backdrop-blur-md border-b border-border px-4 flex items-center justify-between sticky top-0 z-40 select-none flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-accent">
            <Disc3 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-text-primary tracking-tight">TuneBridge</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenLanding && (
            <button
              onClick={onOpenLanding}
              className="p-1.5 rounded-lg border bg-surface-elevated border-border text-text-secondary hover:text-accent btn-press transition-colors"
              title="Tentang TuneBridge / Landing Page"
            >
              <Sparkles className="w-4 h-4 text-accent" />
            </button>
          )}

          <button
            onClick={() => onChangeTab("accounts")}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-elevated border border-border text-[11px] text-text-secondary font-mono btn-press"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
            <span>{connectedCount} Akun</span>
          </button>

          <button
            onClick={() => onChangeTab("settings")}
            className={`p-1.5 rounded-lg border btn-press transition-colors ${
              activeTab === "settings"
                ? "bg-accent/20 border-accent/40 text-accent"
                : "bg-surface-elevated border-border text-text-secondary hover:text-text-primary"
            }`}
            title="Pengaturan"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Linear / Apple Tabbar Style) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 w-full bg-surface/95 backdrop-blur-md border-t border-border z-40 px-1 py-1 flex items-center justify-around select-none pb-safe">
        {mobileTabItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-lg btn-press transition-colors ${
                isActive ? "text-accent" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.id === "accounts" && connectedCount > 0 && (
                  <span className="absolute -top-1 -right-2 text-[9px] w-3.5 h-3.5 rounded-full bg-accent text-background flex items-center justify-center font-bold">
                    {connectedCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight ${isActive ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
