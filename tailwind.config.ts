import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: ["class"],
    theme: {
        extend: {
            colors: {
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                chart: {
                    "1": "hsl(var(--chart-1))",
                    "2": "hsl(var(--chart-2))",
                    "3": "hsl(var(--chart-3))",
                    "4": "hsl(var(--chart-4))",
                    "5": "hsl(var(--chart-5))",
                },
                sidebar: {
                    DEFAULT: "hsl(var(--sidebar))",
                    foreground: "hsl(var(--sidebar-foreground))",
                    primary: "hsl(var(--sidebar-primary))",
                    "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
                    accent: "hsl(var(--sidebar-accent))",
                    "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
                    border: "hsl(var(--sidebar-border))",
                    ring: "hsl(var(--sidebar-ring))",
                },
            },
            boxShadow: {
                'clay-sm': '4px 4px 10px rgba(0, 0, 0, 0.2), -4px -4px 10px rgba(255, 255, 255, 0.05), inset 2px 2px 5px rgba(255, 255, 255, 0.1), inset -2px -2px 5px rgba(0, 0, 0, 0.4)',
                'clay-md': '8px 8px 16px rgba(0, 0, 0, 0.25), -8px -8px 16px rgba(255, 255, 255, 0.05), inset 4px 4px 8px rgba(255, 255, 255, 0.1), inset -4px -4px 8px rgba(0, 0, 0, 0.5)',
                'clay-lg': '12px 12px 24px rgba(0, 0, 0, 0.3), -12px -12px 24px rgba(255, 255, 255, 0.05), inset 6px 6px 12px rgba(255, 255, 255, 0.1), inset -6px -6px 12px rgba(0, 0, 0, 0.6)',
                'clay-light-sm': '4px 4px 10px rgba(0, 0, 0, 0.1), -4px -4px 10px rgba(255, 255, 255, 1), inset 2px 2px 5px rgba(255, 255, 255, 1), inset -2px -2px 5px rgba(0, 0, 0, 0.05)',
                'clay-light-md': '8px 8px 16px rgba(0, 0, 0, 0.15), -8px -8px 16px rgba(255, 255, 255, 1), inset 4px 4px 8px rgba(255, 255, 255, 1), inset -4px -4px 8px rgba(0, 0, 0, 0.1)',
                'clay-light-lg': '12px 12px 24px rgba(0, 0, 0, 0.2), -12px -12px 24px rgba(255, 255, 255, 1), inset 6px 6px 12px rgba(255, 255, 255, 1), inset -6px -6px 12px rgba(0, 0, 0, 0.15)',
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};
export default config;
