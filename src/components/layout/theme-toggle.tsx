import { MoonIcon, SunIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useIsDarkTheme } from "@/lib/theme";
import { useUiStore } from "@/stores/ui.store";

export function ThemeToggle() {
  const isDark = useIsDarkTheme();
  const setTheme = useUiStore((state) => state.setTheme);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
