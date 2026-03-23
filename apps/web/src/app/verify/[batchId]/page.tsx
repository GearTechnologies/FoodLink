import type { Metadata } from "next";
import { HASHSCAN_BASE_URL, MIRROR_NODE_BASE_URL } from "@foodlink/shared";
import type { ProvenanceEvent, BatchVerificationResult } from "@foodlink/shared";

interface PageProps {
  params: { batchId: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Batch #${params.batchId} Provenance — FoodLink`,
    description: `Verify the farm-to-fork journey of food batch #${params.batchId} on Hedera blockchain`,
  };
}

// ─── Server-side data fetch ───────────────────────────────────────────────────

async function getBatchData(batchId: string): Promise<BatchVerificationResult | null> {
  const apiUrl = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";
  try {
    const res = await fetch(`${apiUrl}/trpc/batch.verify?input=${encodeURIComponent(JSON.stringify({ batchId }))}`, {
      next: { revalidate: 30 }, // Cache for 30 seconds
    });
    if (!res.ok) return null;
    const json = await res.json() as { result?: { data?: BatchVerificationResult } };
    return json.result?.data ?? null;
  } catch {
    return null;
  }
}

// ─── Components ──────────────────────────────────────────────────────────────

function EventTypeIcon({ type }: { type: ProvenanceEvent["eventType"] }) {
  const icons: Record<ProvenanceEvent["eventType"], string> = {
    HARVEST: "🌾",
    PROCESS: "🏭",
    SHIP: "🚛",
    RECEIVE: "📦",
    RETAIL: "🏪",
    CONTAMINATION_ALERT: "⚠️",
  };
  return <span role="img" aria-label={type}>{icons[type]}</span>;
}

function RoleBadge({ role }: { role: ProvenanceEvent["actorRole"] }) {
  const colors: Record<ProvenanceEvent["actorRole"], string> = {
    FARM: "bg-green-100 text-green-800",
    PROCESSOR: "bg-blue-100 text-blue-800",
    DISTRIBUTOR: "bg-orange-100 text-orange-800",
    RETAILER: "bg-purple-100 text-purple-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[role]}`}>
      {role}
    </span>
  );
}

// ─── Page Component ────────────────────────────────────────────────────────────

export default async function VerifyPage({ params }: PageProps) {
  const { batchId } = params;
  const data = await getBatchData(batchId);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Batch Not Found</h1>
          <p className="text-gray-600 mb-6">
            Batch #{batchId} could not be found on the Hedera network. Check the batch ID or
            scan the QR code again.
          </p>
          <a
            href="/scan"
            className="bg-brand-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-700 transition-colors"
          >
            Scan Again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Recall Banner */}
      {data.isRecalled && (
        <div
          className="bg-red-50 border-2 border-red-500 rounded-xl p-4 mb-6 flex items-start gap-3"
          role="alert"
          aria-live="assertive"
        >
          <span className="text-2xl flex-shrink-0">🚨</span>
          <div>
            <h2 className="font-bold text-red-700 text-lg">BATCH RECALLED</h2>
            <p className="text-red-600 text-sm mt-1">
              This batch has been flagged for contamination and should not be consumed. Contact your
              retailer immediately.
            </p>
          </div>
        </div>
      )}

      {/* Safe Banner */}
      {!data.isRecalled && (
        <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <h2 className="font-bold text-green-700">Verified Clean</h2>
            <p className="text-green-600 text-sm">
              This batch has not been recalled and is safe for consumption.
            </p>
          </div>
        </div>
      )}

      {/* Batch Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {data.farmDetails.cropType}
        </h1>
        <p className="text-gray-500 text-sm mb-4">Batch #{batchId}</p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Farm</span>
            <p className="font-medium text-gray-900">{data.farmDetails.farmName}</p>
          </div>
          <div>
            <span className="text-gray-500">Harvested</span>
            <p className="font-medium text-gray-900">
              {new Date(data.farmDetails.harvestDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Weight</span>
            <p className="font-medium text-gray-900">{data.farmDetails.weightKg} kg</p>
          </div>
          <div>
            <span className="text-gray-500">Chain Events</span>
            <p className="font-medium text-gray-900">{data.chain.length}</p>
          </div>
        </div>

        {/* Certifications */}
        {data.certifications.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Certifications</p>
            <div className="flex flex-wrap gap-2">
              {data.certifications.map((cert) => (
                <span
                  key={cert}
                  className="bg-brand-100 text-brand-700 px-3 py-1 rounded-full text-xs font-medium"
                >
                  ✓ {cert.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Provenance Timeline */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Supply Chain Journey</h2>
        <div className="relative">
          {data.chain.map((event, index) => (
            <div key={`${event.eventType}-${index}`} className="flex gap-4 mb-4 last:mb-0">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-brand-100 border-2 border-brand-400 flex items-center justify-center text-lg flex-shrink-0">
                  <EventTypeIcon type={event.eventType} />
                </div>
                {index < data.chain.length - 1 && (
                  <div className="w-0.5 flex-1 bg-gray-200 mt-1 min-h-[2rem]" />
                )}
              </div>

              {/* Event Card */}
              <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 mb-2">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {event.eventType.replace(/_/g, " ")}
                    </span>
                    <RoleBadge role={event.actorRole} />
                  </div>
                  <time
                    className="text-xs text-gray-400"
                    dateTime={event.timestamp}
                  >
                    {new Date(event.timestamp).toLocaleString()}
                  </time>
                </div>

                <p className="text-sm text-gray-600 mb-2">
                  📍 {event.location.name}
                </p>

                {/* Event-specific data */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                  {Object.entries(event.data)
                    .filter(([k]) => !["topicId", "signature"].includes(k))
                    .slice(0, 4)
                    .map(([key, value]) => (
                      <div key={key}>
                        <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}:</span>{" "}
                        <span className="text-gray-700 font-medium">
                          {typeof value === "object" ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                </div>

                {/* HashScan Link */}
                <a
                  href={`${HASHSCAN_BASE_URL}/transaction/${event.actorId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-brand-600 hover:underline"
                  aria-label={`View ${event.eventType} event on HashScan explorer`}
                >
                  🔗 View on HashScan
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HCS Topic Link */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm">
        <p className="text-gray-500 mb-2">Hedera Consensus Service Topic</p>
        <a
          href={`${HASHSCAN_BASE_URL}/topic/${data.topicId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 hover:underline font-mono text-xs break-all"
          aria-label="View full provenance chain on HashScan"
        >
          {data.topicId} →
        </a>
        <p className="text-xs text-gray-400 mt-1">
          All {data.chain.length} events are permanently recorded on Hedera&apos;s immutable ledger
        </p>
      </div>

      {/* Social Share */}
      <div className="text-center text-sm text-gray-600">
        <p>
          I verified my food&apos;s journey — from{" "}
          <strong>{data.farmDetails.farmName}</strong> to my plate. 🌿
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Powered by FoodLink × Hedera Blockchain
        </p>
      </div>
    </div>
  );
}
