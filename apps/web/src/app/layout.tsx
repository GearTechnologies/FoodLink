import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FoodLink — Farm-to-Fork Traceability on Hedera",
  description:
    "Decentralized food traceability powered by Hedera HCS and HTS. Trace your food from farm to fork in 2 seconds.",
  keywords: ["food traceability", "Hedera", "blockchain", "farm-to-fork", "food safety"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {/* Navigation */}
        <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 font-bold text-xl text-brand-700">
              <span className="text-2xl" role="img" aria-label="leaf">
                🌿
              </span>
              FoodLink
            </a>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <a href="/scan" className="hover:text-brand-700 transition-colors">
                Scan Food
              </a>
              <a href="/dashboard" className="hover:text-brand-700 transition-colors">
                Dashboard
              </a>
              <a href="/agents" className="hover:text-brand-700 transition-colors">
                Agents
              </a>
              <a href="/recall/dashboard" className="hover:text-brand-700 transition-colors">
                Recalls
              </a>
            </div>
            <a
              href="/farm/register"
              className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              Register Farm
            </a>
          </div>
        </nav>

        {/* Page Content */}
        <main>{children}</main>

        {/* Footer */}
        <footer className="border-t border-gray-100 mt-20 py-8 text-center text-sm text-gray-400">
          <p>
            Built on{" "}
            <a
              href="https://hedera.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 hover:underline"
            >
              Hedera
            </a>{" "}
            · $0.0001 per batch trace · Carbon-negative network
          </p>
          <p className="mt-1">
            FoodLink — Hedera Hello Future Apex Hackathon 2026 · Sustainability Track
          </p>
        </footer>
      </body>
    </html>
  );
}
