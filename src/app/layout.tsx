import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/app-shell";
import ApiInterceptor from "@/components/api-interceptor";
import { AuthProvider } from "@/components/auth-context";
import { VehicleSummaryProvider } from "@/components/vehicle-summary-provider";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "AutoPulse — Personal Vehicle Health & Intelligence Platform",
  description:
    "Intelligent vehicle health companion, OBD-II diagnostic troubleshooting, maintenance tracking, and predictive component wear forecasting.",
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#090b0d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-[#090b0d] text-[#f0f4f8] min-h-screen flex flex-col selection:bg-amber-400 selection:text-black`}
      >
        <ApiInterceptor />
        <AuthProvider>
          <VehicleSummaryProvider>
            <AppShell>{children}</AppShell>
          </VehicleSummaryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
