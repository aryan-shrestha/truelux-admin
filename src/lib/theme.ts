import { useUiStore, type ThemePreference } from "@/stores/ui.store";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function isDarkTheme(theme: ThemePreference): boolean {
  return theme === "dark" || (theme === "system" && window.matchMedia(DARK_QUERY).matches);
}

function applyTheme(): void {
  const isDark = isDarkTheme(useUiStore.getState().theme);
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

// Called once before the first render, so the persisted theme is on <html> before
// anything paints. An inline script in index.html would do it earlier but needs a
// CSP exception for inline scripts.
export function syncThemeWithDocument(): void {
  applyTheme();
  useUiStore.subscribe(applyTheme);
  window.matchMedia(DARK_QUERY).addEventListener("change", applyTheme);
}
