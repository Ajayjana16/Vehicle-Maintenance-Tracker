import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password — AutoPulse",
  description: "Recover your AutoPulse account credentials.",
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-[#07090b] text-[#f0f4f8]">{children}</div>;
}
