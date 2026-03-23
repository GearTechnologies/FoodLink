import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FoodLink — Farm-to-Fork Traceability",
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-50 to-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <span>🏆</span> Hedera Hello Future Apex Hackathon 2026 · Sustainability Track
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Walmart took{" "}
            <span className="text-red-500">7 days</span> to trace
            <br />
            an E.coli outbreak.
            <br />
            <span className="text-brand-600">FoodLink does it in 2 seconds.</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Autonomous supply chain agents publish every handoff to Hedera&apos;s immutable ledger.
            Consumers scan a QR code. Regulators get instant recall alerts. Farmers earn trust.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/scan"
              className="bg-brand-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-brand-700 transition-colors shadow-lg"
              aria-label="Scan your food QR code"
            >
              📱 Scan Your Food
            </a>
            <a
              href="/dashboard"
              className="border-2 border-brand-600 text-brand-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-brand-50 transition-colors"
              aria-label="Go to supply chain actor dashboard"
            >
              🏭 Actor Dashboard
            </a>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-gray-900 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-brand-400">$10B</div>
            <div className="text-sm text-gray-400 mt-1">US food recall costs/year</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-brand-400">99%</div>
            <div className="text-sm text-gray-400 mt-1">of food has no blockchain provenance</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-brand-400">$0.0001</div>
            <div className="text-sm text-gray-400 mt-1">per batch trace on Hedera</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-brand-400">2s</div>
            <div className="text-sm text-gray-400 mt-1">FoodLink recall resolution</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
          How FoodLink Works
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Autonomous OpenClaw agents operate each stage. Every handoff is an immutable HCS
          message. Every batch is an HTS NFT.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              icon: "🌾",
              title: "Farm",
              desc: "Farm agent mints an HTS NFT and creates a dedicated HCS topic. HARVEST event published.",
              color: "bg-green-50 border-green-200",
            },
            {
              icon: "🏭",
              title: "Processor",
              desc: "Processor agent validates chain integrity, publishes PROCESS event with cold chain data.",
              color: "bg-blue-50 border-blue-200",
            },
            {
              icon: "🚛",
              title: "Distributor",
              desc: "Distributor agent records SHIP event with GPS coordinates and temperature telemetry.",
              color: "bg-orange-50 border-orange-200",
            },
            {
              icon: "🏪",
              title: "Retailer",
              desc: "Retailer agent publishes RECEIVE event. Consumer scans QR and sees the full journey.",
              color: "bg-purple-50 border-purple-200",
            },
          ].map((step, i) => (
            <div
              key={step.title}
              className={`border-2 rounded-xl p-6 ${step.color} relative`}
            >
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {i + 1}
              </div>
              <div className="text-4xl mb-3">{step.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Hedera */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Why Hedera?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "⚡",
                title: "3-Second Finality",
                desc: "Hedera consensus is final in ~3 seconds. No forks, no reorgs.",
              },
              {
                icon: "💰",
                title: "$0.0001 Per Message",
                desc: "A full 4-stage supply chain costs $0.0005 on Hedera — economically viable at scale.",
              },
              {
                icon: "🌱",
                title: "Carbon-Negative",
                desc: "Hedera is the only major network that offsets more carbon than it uses.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to trace your supply chain?
          </h2>
          <p className="text-gray-600 mb-8">
            Register your farm and mint your first batch NFT in under 2 minutes.
          </p>
          <a
            href="/farm/register"
            className="bg-brand-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-brand-700 transition-colors shadow-lg inline-block"
          >
            Get Started — It&apos;s Free on Testnet
          </a>
        </div>
      </section>
    </div>
  );
}
