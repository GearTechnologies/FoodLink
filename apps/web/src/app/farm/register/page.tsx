import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register Farm — FoodLink",
};

export default function FarmRegisterPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <a href="/" className="text-brand-600 hover:underline text-sm">
          ← Back to FoodLink
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mt-3">Register Your Farm</h1>
        <p className="text-gray-600 mt-1">
          Join FoodLink and start tracing your batches on Hedera. Each registration creates a new
          Hedera account for your farm.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-0 mb-10">
        {[
          { n: 1, label: "Farm Details" },
          { n: 2, label: "Crop Info" },
          { n: 3, label: "Connect Wallet" },
        ].map((step, i) => (
          <div key={step.n} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step.n === 1
                    ? "bg-brand-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
                aria-current={step.n === 1 ? "step" : undefined}
              >
                {step.n}
              </div>
              <span className="text-xs text-gray-500 mt-1 whitespace-nowrap">{step.label}</span>
            </div>
            {i < 2 && <div className="flex-1 h-0.5 bg-gray-200 mx-2 mb-4" />}
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Step 1: Farm Details</h2>

        <form className="space-y-6" aria-label="Farm registration form">
          <div>
            <label htmlFor="farmName" className="block text-sm font-medium text-gray-700 mb-1">
              Farm Name <span className="text-red-500">*</span>
            </label>
            <input
              id="farmName"
              type="text"
              required
              placeholder="e.g. Green Valley Organic Farm"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                id="city"
                type="text"
                required
                placeholder="Salinas"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <input
                id="state"
                type="text"
                required
                placeholder="CA"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certifications
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "organic", label: "USDA Organic" },
                { id: "fair-trade", label: "Fair Trade" },
                { id: "non-gmo", label: "Non-GMO" },
                { id: "gap", label: "GAP Certified" },
              ].map((cert) => (
                <label
                  key={cert.id}
                  htmlFor={cert.id}
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-brand-400 transition-colors"
                >
                  <input
                    id={cert.id}
                    type="checkbox"
                    className="accent-brand-600 w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">{cert.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors"
              aria-label="Continue to crop registration"
            >
              Continue →
            </button>
          </div>
        </form>
      </div>

      {/* Why Register */}
      <div className="mt-6 bg-brand-50 rounded-xl p-4 text-sm text-brand-800">
        <p className="font-medium mb-1">🌿 What happens when you register?</p>
        <ul className="space-y-1 text-brand-700">
          <li>✓ A new Hedera account is created for your farm</li>
          <li>✓ You receive printable QR code labels for your batches</li>
          <li>✓ Every handoff is immutably recorded on Hedera HCS</li>
          <li>✓ Consumers can verify your certifications with one scan</li>
        </ul>
      </div>
    </div>
  );
}
