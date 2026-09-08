import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Your Account — AutoPulse",
  description: "Create your personal AutoPulse account and start managing your vehicle health.",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-[#07090b] text-[#f0f4f8]">{children}</div>;
}
