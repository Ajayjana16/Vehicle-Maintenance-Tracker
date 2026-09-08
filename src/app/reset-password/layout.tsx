import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set New Password — AutoPulse",
  description: "Set a new secure password for your AutoPulse account.",
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-[#07090b] text-[#f0f4f8]">{children}</div>;
}
