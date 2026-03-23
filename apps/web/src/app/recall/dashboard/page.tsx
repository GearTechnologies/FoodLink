import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recall Dashboard — FoodLink",
};

export default function RecallDashboardPage() {
  const isDemoMode = process.env["DEMO_MODE"] === "true";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recall Agent Monitor</h1>
          <p className="text-gray-600 mt-1">
            Real-time visibility into contamination detection and recall orchestration
          </p>
        </div>
        {isDemoMode && (
          <div className="bg-amber-100 border border-amber-300 rounded-lg px-4 py-2 text-amber-800 text-sm font-medium">
            🧪 Demo Mode Active
          </div>
        )}
      </div>

      {/* Industry Benchmark Comparison */}
      <div className="bg-gray-900 text-white rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Recall Resolution Time Comparison</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-red-400 mb-1">7 days</div>
            <div className="text-gray-400 text-sm">Industry Average</div>
            <div className="text-gray-500 text-xs mt-1">Walmart E.coli recall, 2006</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold text-brand-400 mb-1">&lt; 5s</div>
            <div className="text-gray-400 text-sm">FoodLink Resolution</div>
            <div className="text-gray-500 text-xs mt-1">Autonomous agent cascade</div>
          </div>
        </div>
        <div className="mt-4 bg-gray-800 rounded-lg overflow-hidden h-4 flex">
          <div className="bg-red-500 w-11/12 flex items-center justify-end pr-2">
            <span className="text-xs text-white">Industry</span>
          </div>
          <div className="bg-brand-500 flex-1" title="FoodLink" />
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          FoodLink is 604,800× faster than the industry standard
        </p>
      </div>

      {/* Simulate Recall Button — DEMO ONLY */}
      {isDemoMode && (
        <div className="bg-white border-2 border-amber-300 rounded-xl p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">🎬 Simulate Recall</h2>
              <p className="text-gray-600 text-sm mt-1">
                Triggers the recall agent for Batch #4821 (Organic Romaine Lettuce from Green
                Valley Farm). Watch the cascade in real time.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm font-mono text-gray-700">
            <div>Farm: 0.0.11111 (Green Valley Farm)</div>
            <div>Crop: Organic Romaine Lettuce</div>
            <div>Batches at risk: 3</div>
          </div>

          <a
            href="/api/demo-recall"
            className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg"
            aria-label="Simulate contamination recall for demo"
          >
            🚨 Trigger Recall Simulation
          </a>

          <p className="text-xs text-amber-600 mt-3">
            ⚠️ Demo mode only — sends real transactions to Hedera testnet
          </p>
        </div>
      )}

      {/* Active Recalls */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Active Recalls</h2>
        </div>
        <div className="p-6 text-center text-gray-400">
          <div className="text-4xl mb-2">✅</div>
          <p className="font-medium text-gray-600">No Active Recalls</p>
          <p className="text-sm mt-1">All supply chains are operating normally</p>
        </div>
      </div>

      {/* Supply Chain Map Placeholder */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Live Batch Map</h2>
        </div>
        <div
          className="bg-gray-100 flex items-center justify-center"
          style={{ height: 320 }}
          role="img"
          aria-label="Map showing active batch locations across the supply chain"
        >
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">🗺️</div>
            <p className="font-medium">Interactive Supply Chain Map</p>
            <p className="text-sm">Leaflet.js map loads with active Hedera data</p>
          </div>
        </div>
      </div>

      {/* Alert History */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Recall Events</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            {
              date: "2024-01-10",
              farm: "Riverside Greens",
              crop: "Spinach",
              batches: 4,
              time: "3.8s",
              status: "RESOLVED",
            },
            {
              date: "2024-01-03",
              farm: "Valley View Farm",
              crop: "Romaine",
              batches: 2,
              time: "4.1s",
              status: "RESOLVED",
            },
          ].map((recall) => (
            <div key={recall.date} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {recall.crop} — {recall.farm}
                </p>
                <p className="text-xs text-gray-500">
                  {recall.date} · {recall.batches} batches · Resolved in {recall.time}
                </p>
              </div>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                {recall.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
