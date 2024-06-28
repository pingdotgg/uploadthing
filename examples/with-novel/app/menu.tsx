"use client";

import { Button } from "@/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import { Check, Menu as MenuIcon, Monitor, Moon, SunDim } from "lucide-react";
import { useTheme } from "next-themes";

const appearances = [
  {
    theme: "System",
    icon: <Monitor className="h-4 w-4" />,
  },
  {
    theme: "Light",
    icon: <SunDim className="h-4 w-4" />,
  },
  {
    theme: "Dark",
    icon: <Moon className="h-4 w-4" />,
  },
];
export function Menu() {
  const { theme: currentTheme, setTheme } = useTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <MenuIcon width={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2" align="end">
        <p className="text-muted-foreground p-2 text-xs font-medium">
          Appearance
        </p>
        {appearances.map(({ theme, icon }) => (
          <Button
            variant="ghost"
            key={theme}
            className="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm"
            onClick={() => {
              setTheme(theme.toLowerCase());
            }}
          >
            <div className="flex items-center space-x-2">
              <div className="rounded-sm border p-1">{icon}</div>
              <span>{theme}</span>
            </div>
            {currentTheme === theme.toLowerCase() && (
              <Check className="h-4 w-4" />
            )}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
