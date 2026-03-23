import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent Registry — FoodLink",
};

// Demo agent data for SSR (in production this comes from the API)
const demoAgents = [
  {
    agentId: "agent-farm-0.0.11111",
    role: "FARM" as const,
    hederaAccountId: "0.0.11111",
    trustScore: 98,
    activeBatches: ["4821", "4822", "4823"],
    status: "ACTIVE" as const,
    lastActivity: "2 minutes ago",
    totalHandoffs: 147,
    coldChainViolations: 0,
    recallInvolvements: 0,
  },
  {
    agentId: "agent-processor-0.0.22222",
    role: "PROCESSOR" as const,
    hederaAccountId: "0.0.22222",
    trustScore: 95,
    activeBatches: ["4821"],
    status: "ACTIVE" as const,
    lastActivity: "18 minutes ago",
    totalHandoffs: 89,
    coldChainViolations: 1,
    recallInvolvements: 0,
  },
  {
    agentId: "agent-distributor-0.0.33333",
    role: "DISTRIBUTOR" as const,
    hederaAccountId: "0.0.33333",
    trustScore: 92,
    activeBatches: ["4821", "4822"],
    status: "ACTIVE" as const,
    lastActivity: "1 hour ago",
    totalHandoffs: 213,
    coldChainViolations: 2,
    recallInvolvements: 0,
  },
  {
    agentId: "agent-retailer-0.0.44444",
    role: "RETAILER" as const,
    hederaAccountId: "0.0.44444",
    trustScore: 100,
    activeBatches: ["4821"],
    status: "IDLE" as const,
    lastActivity: "3 hours ago",
    totalHandoffs: 67,
    coldChainViolations: 0,
    recallInvolvements: 0,
  },
  {
    agentId: "agent-recall-system",
    role: "FARM" as const,
    hederaAccountId: "0.0.55555",
    trustScore: 100,
    activeBatches: [],
    status: "IDLE" as const,
    lastActivity: "On standby",
    totalHandoffs: 0,
    coldChainViolations: 0,
    recallInvolvements: 2,
  },
];

function TrustScoreBar({ score }: { score: number }) {
  const color =
    score >= 90 ? "bg-green-500" : score >= 70 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 bg-gray-100 rounded-full h-2"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Trust score: ${score}%`}
      >
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-700 w-8">{score}</span>
    </div>
  );
}

function RolePill({ role }: { role: string }) {
  const styles: Record<string, string> = {
    FARM: "bg-green-100 text-green-800",
    PROCESSOR: "bg-blue-100 text-blue-800",
    DISTRIBUTOR: "bg-orange-100 text-orange-800",
    RETAILER: "bg-purple-100 text-purple-800",
    RECALL: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[role] ?? "bg-gray-100 text-gray-700"}`}
    >
      {role}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  return (
    <span className="flex items-center gap-1.5 text-sm">
      <span
        className={`w-2 h-2 rounded-full ${
          status === "ACTIVE"
            ? "bg-green-500 animate-pulse"
            : status === "IDLE"
              ? "bg-gray-400"
              : "bg-red-500"
        }`}
        aria-hidden
      />
      {status}
    </span>
  );
}

export default function AgentsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">OpenClaw Agent Registry</h1>
        <p className="text-gray-600 mt-1">
          All autonomous supply chain agents registered on FoodLink × Hedera.
          Trust scores are computed from on-chain performance history.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Agents", value: demoAgents.length, icon: "🤖" },
          {
            label: "Active",
            value: demoAgents.filter((a) => a.status === "ACTIVE").length,
            icon: "🟢",
          },
          {
            label: "Avg Trust Score",
            value: Math.round(demoAgents.reduce((s, a) => s + a.trustScore, 0) / demoAgents.length),
            icon: "⭐",
          },
          {
            label: "Total Handoffs",
            value: demoAgents.reduce((s, a) => s + a.totalHandoffs, 0),
            icon: "🔄",
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Agent Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Registered Agents</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Humans observe only. Agents operate autonomously on Hedera.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Agent",
                  "Role",
                  "Hedera Account",
                  "Trust Score",
                  "Active Batches",
                  "Handoffs",
                  "Status",
                  "Last Activity",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {demoAgents.map((agent) => (
                <tr key={agent.agentId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900 font-mono">
                      {agent.agentId.slice(0, 24)}…
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RolePill role={agent.role} />
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">
                    {agent.hederaAccountId}
                  </td>
                  <td className="px-4 py-3 min-w-32">
                    <TrustScoreBar score={agent.trustScore} />
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-700">
                    {agent.activeBatches.length}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-700">
                    {agent.totalHandoffs}
                  </td>
                  <td className="px-4 py-3">
                    <StatusDot status={agent.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{agent.lastActivity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Trust scores are computed from HCS on-chain history: +1 per on-time handoff,
        −5 per cold-chain violation, −20 per recall involvement
      </p>
    </div>
  );
}
