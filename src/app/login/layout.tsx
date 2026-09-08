import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — AutoPulse",
  description: "Secure login for personal vehicle health & intelligence.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-[#07090b] text-[#f0f4f8]">{children}</div>;
}
