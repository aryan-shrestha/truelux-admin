import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemePreference = "light" | "dark" | "system";

interface UiState {
  isSidebarOpen: boolean;
  theme: ThemePreference;
  setSidebarOpen: (isOpen: boolean) => void;
  setTheme: (theme: ThemePreference) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      theme: "system",
      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: "truelux-admin-ui" },
  ),
);
