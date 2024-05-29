"use client";

import { type ReactNode } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";

const ToasterProvider = () => {
  const { theme } = useTheme() as {
    theme: "light" | "dark" | "system";
  };
  return <Toaster theme={theme} />;
};

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      enableSystem
      disableTransitionOnChange
      defaultTheme="system"
    >
      <ToasterProvider />
      {children}
    </ThemeProvider>
  );
}
