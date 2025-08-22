"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner";

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        style: {
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          background: 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
        },
      }}
      style={
        {
          "--normal-bg": "hsl(var(--background))",
          "--normal-text": "hsl(var(--foreground))",
          "--normal-border": "hsl(var(--border))",
          "--success-bg": "#10b981",
          "--success-text": "white",
          "--error-bg": "#ef4444",
          "--error-text": "white",
          "--info-bg": "#0076bc",
          "--info-text": "white",
          "--warning-bg": "#f59e0b",
          "--warning-text": "white",
          "--loading-bg": "hsl(var(--muted))",
          "--loading-text": "hsl(var(--muted-foreground))",
          "--normal-backdrop": "rgba(0, 0, 0, 0.1)",
          "--success-backdrop": "rgba(16, 185, 129, 0.1)",
          "--error-backdrop": "rgba(239, 68, 68, 0.1)",
          "--info-backdrop": "rgba(0, 118, 188, 0.1)",
          "--warning-backdrop": "rgba(245, 158, 11, 0.1)",
          "--loading-backdrop": "rgba(0, 0, 0, 0.1)"
        }
      }
      {...props} />
  );
}

export { Toaster }
