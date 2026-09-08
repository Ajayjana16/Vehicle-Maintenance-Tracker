import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome Setup — AutoPulse",
  description: "Set up your personal garage and run your initial baseline vehicle health scan.",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-[#07090b] text-[#f0f4f8]">{children}</div>;
}
