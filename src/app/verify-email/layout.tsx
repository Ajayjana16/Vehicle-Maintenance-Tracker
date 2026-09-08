import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Email — AutoPulse",
  description: "Confirm your AutoPulse account email address.",
};

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-[#07090b] text-[#f0f4f8]">{children}</div>;
}
