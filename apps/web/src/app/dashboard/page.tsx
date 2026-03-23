import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Supply Chain Dashboard — FoodLink",
};

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Supply Chain Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage your batches and record supply chain handoffs</p>
      </div>

      {/* Auth Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-start gap-3">
        <span className="text-xl">🔐</span>
        <div>
          <h2 className="font-semibold text-blue-900">Connect Your Hedera Wallet</h2>
          <p className="text-blue-700 text-sm mt-1">
            Connect your HashPack wallet to authenticate and manage your supply chain batches.
          </p>
          <button
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            aria-label="Connect HashPack wallet"
          >
            Connect HashPack Wallet
          </button>
        </div>
      </div>

      {/* Active Batches */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Active Batches</h2>
          <a
            href="/farm/register"
            className="bg-brand-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            + New Batch
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {["Batch ID", "Crop Type", "Current Stage", "Location", "Last Event", "Status", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Demo rows */}
              {[
                {
                  id: "4821",
                  crop: "Organic Romaine Lettuce",
                  stage: "Retailer",
                  location: "New York, NY",
                  lastEvent: "2 hours ago",
                  status: "Clean",
                },
                {
                  id: "4822",
                  crop: "Baby Spinach",
                  stage: "Distributor",
                  location: "Chicago, IL",
                  lastEvent: "6 hours ago",
                  status: "Clean",
                },
                {
                  id: "4823",
                  crop: "Kale",
                  stage: "Processor",
                  location: "Mountain View, CA",
                  lastEvent: "1 day ago",
                  status: "Clean",
                },
              ].map((batch) => (
                <tr key={batch.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-brand-600">#{batch.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{batch.crop}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{batch.stage}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{batch.location}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{batch.lastEvent}</td>
                  <td className="px-4 py-3">
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                      ✓ {batch.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <a
                        href={`/verify/${batch.id}`}
                        className="text-xs text-brand-600 hover:underline"
                      >
                        View
                      </a>
                      <button className="text-xs text-gray-500 hover:text-gray-700">
                        Handoff
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Batches", value: "147", icon: "📦" },
          { label: "Active Batches", value: "23", icon: "🔄" },
          { label: "Completed", value: "124", icon: "✅" },
          { label: "Recalls", value: "0", icon: "🚨" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
