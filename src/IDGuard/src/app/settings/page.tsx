"use client";

import { useTheme, type AccentColor, type ThemeMode, type CardStyle, type BorderStyle, type LockView, type CardDensity } from "@/contexts/ThemeContext";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

const ACCENTS: { value: AccentColor; label: string; ring: string }[] = [
  { value: "blue",   label: "Blue",   ring: "bg-[#183B6B]" },
  { value: "green",  label: "Green",  ring: "bg-[#22C55E]" },
  { value: "purple", label: "Purple", ring: "bg-purple-500" },
  { value: "orange", label: "Orange", ring: "bg-orange-500" },
  { value: "teal",   label: "Teal",   ring: "bg-teal-500" },
  { value: "pink",   label: "Pink",   ring: "bg-pink-500" },
];

const INTERVALS = [
  { value: 0, label: "Off" },
  { value: 15, label: "15s" },
  { value: 30, label: "30s" },
  { value: 60, label: "60s" },
  { value: 120, label: "120s" },
];

function SettingCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 mb-4 shadow-card">
      <h2 className="text-lg font-heading font-semibold text-[#183B6B] mb-4">{title}</h2>
      {children}
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-[#E5E7EB]/50 last:border-b-0">
      <span className="text-sm text-[#6B7280] font-body">{label}</span>
      <div className="flex items-center gap-2 self-start sm:self-center">{children}</div>
    </div>
  );
}

function ToggleBtn<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-[#E5E7EB]">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-xs font-medium transition-colors font-body ${
            opt.value === value
              ? "bg-[#183B6B] text-white"
              : "bg-white text-[#6B7280] hover:text-[#1F2937]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { settings, updateSetting, resetSettings } = useTheme();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login");
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <p className="text-text-muted">Loading...</p>
    </div>
  );
  if (!isAuthenticated) return null;

  return (
    <div className="container-settings py-4 sm:py-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#183B6B] font-heading">Settings</h1>
        <Link
          href="/dashboard"
          className="text-sm text-[#3B82F6] hover:text-[#183B6B] transition-colors font-body shrink-0"
        >
          &larr; Back
        </Link>
      </div>

      {/* Theme & Colors */}
      <SettingCard title="Theme & Colors">
        <SettingRow label="Theme">
          <ToggleBtn<ThemeMode>
            options={[
              { value: "dark", label: "Dark" },
              { value: "light", label: "Light" },
              { value: "system", label: "System" },
            ]}
            value={settings.theme}
            onChange={(v) => updateSetting("theme", v)}
          />
        </SettingRow>

        <SettingRow label="Accent Color">
          <div className="flex gap-1.5 flex-wrap">
            {ACCENTS.map((a) => (
              <button
                key={a.value}
                onClick={() => updateSetting("accent", a.value)}
                title={a.label}
                className={`w-7 h-7 rounded-full ${a.ring} transition-all ${
                  settings.accent === a.value
                    ? "ring-2 ring-white ring-offset-2 ring-offset-card scale-110"
                    : "ring-1 ring-white/20 hover:scale-105"
                }`}
              />
            ))}
          </div>
        </SettingRow>

        <SettingRow label="Card Style">
          <ToggleBtn<CardStyle>
            options={[
              { value: "solid", label: "Solid" },
              { value: "glass", label: "Glass" },
            ]}
            value={settings.cardStyle}
            onChange={(v) => updateSetting("cardStyle", v)}
          />
        </SettingRow>

        <SettingRow label="Borders">
          <ToggleBtn<BorderStyle>
            options={[
              { value: "full", label: "Full" },
              { value: "subtle", label: "Subtle" },
              { value: "none", label: "None" },
            ]}
            value={settings.borderStyle}
            onChange={(v) => updateSetting("borderStyle", v)}
          />
        </SettingRow>
      </SettingCard>

      {/* Layout & Display */}
      <SettingCard title="Layout & Display">
        <SettingRow label="Lock View">
          <ToggleBtn<LockView>
            options={[
              { value: "grid", label: "Grid" },
              { value: "list", label: "List" },
            ]}
            value={settings.lockView}
            onChange={(v) => updateSetting("lockView", v)}
          />
        </SettingRow>

        <SettingRow label="Card Density">
          <ToggleBtn<CardDensity>
            options={[
              { value: "default", label: "Default" },
              { value: "compact", label: "Compact" },
            ]}
            value={settings.cardDensity}
            onChange={(v) => updateSetting("cardDensity", v)}
          />
        </SettingRow>

        <SettingRow label="Show Summary Cards">
          <button
            onClick={() => updateSetting("showSummary", !settings.showSummary)}
            className={`w-10 h-5 rounded-full transition-colors relative ${
              settings.showSummary ? "bg-[#183B6B]" : "bg-[#E5E7EB]"
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                settings.showSummary ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </SettingRow>
      </SettingCard>

      {/* Data & Refresh */}
      <SettingCard title="Data & Refresh">
        <SettingRow label="Auto-refresh Interval">
          <select
            value={settings.refreshInterval}
            onChange={(e) => updateSetting("refreshInterval", Number(e.target.value))}
            className="px-3 py-1.5 rounded bg-white border border-[#E5E7EB] text-[#1F2937] text-sm focus:outline-none focus:border-[#3B82F6]"
          >
            {INTERVALS.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
        </SettingRow>
      </SettingCard>

      {/* Reset */}
      <div className="text-center mt-6 sm:mt-8">
        <button
          onClick={resetSettings}
          className="px-4 py-2 rounded bg-red-50 text-[#EF4444] text-sm hover:bg-red-100 border border-red-200 transition-colors font-body"
        >
          Reset All Settings to Default
        </button>
      </div>
    </div>
  );
}
