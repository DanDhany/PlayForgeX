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
} from "lucide-react";

export type NavTab = "overview" | "transfer" | "library" | "accounts" | "activity" | "settings";

interface NavigationRailProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  connectedCount: number;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  activeTab,
  onChangeTab,
  connectedCount,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "transfer", label: "Transfer & Merge", icon: ArrowRightLeft },
    { id: "library", label: "Library", icon: ListMusic },
    { id: "accounts", label: "Accounts", icon: Users },
    { id: "activity", label: "Activity", icon: History },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Desktop Left Rail (Linear Style) */}
      <aside className="hidden md:flex flex-col w-60 bg-surface border-r border-border select-none flex-shrink-0 z-30 justify-between">
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
            {navItems.map((item) => {
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

      {/* Mobile Top Brand Bar */}
      <header className="md:hidden h-14 bg-surface/95 backdrop-blur-md border-b border-border px-4 flex items-center justify-between sticky top-0 z-40 select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-accent">
            <Disc3 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-text-primary tracking-tight">TuneBridge</h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-elevated border border-border text-[11px] text-text-secondary font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
          <span>{connectedCount} Akun</span>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Linear / Apple Tabbar Style) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface/95 backdrop-blur-md border-t border-border z-40 px-2 py-1 flex items-center justify-around select-none pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-lg btn-press transition-colors ${
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
              <span className="text-[10px] mt-1 font-medium tracking-tight">
                {item.id === "transfer" ? "Transfer" : item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
