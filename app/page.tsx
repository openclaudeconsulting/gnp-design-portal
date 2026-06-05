import Link from "next/link";
import { BRAND } from "@/lib/config/brand";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl text-center">
          <div className="text-xs uppercase tracking-wider text-amber-500 font-semibold mb-2">
            Barndominium · Post-Frame Buildings · Engineered Plan Packages
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-100">
            {BRAND.name}{" "}
            <span className="text-amber-500">Design Portal</span>
          </h1>
          <p className="mt-4 text-lg text-zinc-400">
            Configure your building, see an instant ballpark quote, and
            submit your design for engineering review by a licensed PE.
            Sealed plans for your specific site.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/wizard"
              className="inline-flex items-center justify-center px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-md shadow-lg shadow-amber-500/20 transition-colors"
            >
              Start designing →
            </Link>
            <a
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100 rounded-md transition-colors"
            >
              ← Back to main site
            </a>
          </div>

          <p className="mt-10 text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
            Designs submitted here are{" "}
            <strong className="text-zinc-300">
              submitted for engineering review
            </strong>{" "}
            — never auto-approved. {BRAND.name} supplies engineered + sealed
            plan packages and the steel truss / kit components.
          </p>
        </div>
      </main>

      <footer className="border-t border-zinc-800 text-center text-xs text-zinc-500 py-4">
        © 2026 {BRAND.name} · {BRAND.serviceArea}
      </footer>
    </div>
  );
}
