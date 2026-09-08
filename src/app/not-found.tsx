import Link from "next/link";
import { Car, ArrowLeft, Activity } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-[65vh] items-center justify-center px-4">
      <section className="surface-panel w-full max-w-md p-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400">
          <Car className="h-6 w-6" />
        </div>

        <div>
          <span className="eyebrow">
            <Activity className="h-3 w-3" /> Error 404
          </span>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-white">
            Page Not Found
          </h1>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            The requested vehicle page, diagnostic report, or log could not be located.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/" className="action-primary text-xs">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
