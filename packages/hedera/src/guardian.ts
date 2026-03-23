// ─── Guardian API Integration ─────────────────────────────────────────────────
// Hedera Guardian provides verifiable credentials (VCs) for sustainability claims.
// Guardian verifies off-chain evidence and issues on-chain credential records.

const GUARDIAN_API_URL = process.env["GUARDIAN_API_URL"] ?? "https://guardian.hedera.com";
const GUARDIAN_API_KEY = process.env["GUARDIAN_API_KEY"] ?? "";

// ─── Response Types ───────────────────────────────────────────────────────────

interface GuardianOrganicResponse {
  vcId: string;
  guardianTxId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

interface GuardianCertificateResponse {
  certificateId: string;
  guardianTxId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

interface GuardianVerifyResponse {
  valid: boolean;
  issueDate: string;
  expiryDate: string;
  issuer: string;
  subject: string;
}

// ─── HTTP Helper ─────────────────────────────────────────────────────────────

async function guardianPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${GUARDIAN_API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GUARDIAN_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Guardian API POST ${path} failed: ${response.status} — ${text}`);
  }

  return response.json() as Promise<T>;
}

async function guardianGet<T>(path: string): Promise<T> {
  const response = await fetch(`${GUARDIAN_API_URL}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${GUARDIAN_API_KEY}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Guardian API GET ${path} failed: ${response.status} — ${text}`);
  }

  return response.json() as Promise<T>;
}

// ─── Organic Certification ────────────────────────────────────────────────────

/**
 * Submits a farm's organic practice evidence to Guardian for certification.
 * Guardian verifies the IPFS document and issues a Verifiable Credential.
 *
 * @param farmId - Hedera account ID of the farm (e.g., "0.0.12345")
 * @param evidenceIpfsCid - IPFS CID of the organic practice evidence document
 * @returns Guardian VC ID and transaction ID for HashScan verification
 * @throws Error if Guardian API call fails
 */
export async function submitOrganicCertification(
  farmId: string,
  evidenceIpfsCid: string
): Promise<{ vcId: string; guardianTxId: string }> {
  const result = await guardianPost<GuardianOrganicResponse>(
    "/api/v1/certifications/organic",
    {
      farmId,
      evidenceIpfsCid,
      policy: "ORGANIC_CERTIFICATION_POLICY",
      submittedAt: new Date().toISOString(),
    }
  );

  return { vcId: result.vcId, guardianTxId: result.guardianTxId };
}

// ─── Batch Safety Certificate ─────────────────────────────────────────────────

/**
 * Submits batch lab test results to Guardian for food safety certification.
 * The lab result hash (SHA-256 of the lab report) is recorded on-chain.
 *
 * @param batchId - HTS NFT serial number of the batch
 * @param labResultHash - SHA-256 hash of the lab results document
 * @returns Guardian certificate ID and transaction ID
 * @throws Error if Guardian API call fails
 */
export async function issueBatchSafetyCertificate(
  batchId: string,
  labResultHash: string
): Promise<{ certificateId: string; guardianTxId: string }> {
  const result = await guardianPost<GuardianCertificateResponse>(
    "/api/v1/certifications/food-safety",
    {
      batchId,
      labResultHash,
      policy: "FOOD_SAFETY_POLICY",
      submittedAt: new Date().toISOString(),
    }
  );

  return { certificateId: result.certificateId, guardianTxId: result.guardianTxId };
}

// ─── Credential Verification ──────────────────────────────────────────────────

/**
 * Verifies a Guardian-issued credential is still valid and unexpired.
 *
 * @param credentialId - The Guardian VC ID or certificate ID to verify
 * @returns Verification result with validity status and dates
 * @throws Error if Guardian API call fails
 */
export async function verifyCertification(credentialId: string): Promise<{
  valid: boolean;
  issueDate: string;
  expiryDate: string;
}> {
  const result = await guardianGet<GuardianVerifyResponse>(
    `/api/v1/certifications/${credentialId}/verify`
  );

  return {
    valid: result.valid,
    issueDate: result.issueDate,
    expiryDate: result.expiryDate,
  };
}
