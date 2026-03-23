// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title RecallManager
 * @notice Manages the lifecycle of food safety recall events on Hedera EVM.
 *         Each recall event captures the farm, affected crop, and all impacted
 *         batch serial numbers — creating an immutable audit trail.
 *
 * @dev Works in tandem with BatchRegistry. When a recall is initiated,
 *      RecallManager records the recall event while BatchRegistry flags
 *      individual batches. The recall agent operates both contracts.
 */
contract RecallManager is AccessControl {
    // ─── Roles ────────────────────────────────────────────────────────────────

    bytes32 public constant RECALL_AGENT_ROLE = keccak256("RECALL_AGENT_ROLE");

    // ─── Data Structures ──────────────────────────────────────────────────────

    struct RecallEvent {
        string farmId;
        string cropType;
        string detectionDate;
        uint256[] affectedSerials;
        uint256 timestamp;
        bool resolved;
        string reason;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    RecallEvent[] public recalls;

    // ─── Events ───────────────────────────────────────────────────────────────

    event RecallInitiated(
        uint256 indexed recallId,
        string farmId,
        string cropType,
        uint256 affectedCount
    );

    event RecallResolved(uint256 indexed recallId);

    // ─── Constructor ──────────────────────────────────────────────────────────

    /**
     * @param admin Initial admin who also receives RECALL_AGENT_ROLE
     */
    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(RECALL_AGENT_ROLE, admin);
    }

    // ─── Mutations ────────────────────────────────────────────────────────────

    /**
     * @notice Initiates a new contamination recall.
     * @param farmId Hedera account ID of the originating farm
     * @param cropType Affected crop type
     * @param detectionDate ISO 8601 date when contamination was detected
     * @param affectedSerials Array of HTS NFT serial numbers being recalled
     * @param reason Human-readable contamination reason
     * @return recallId Index of the new recall event in the recalls array
     */
    function initiateRecall(
        string calldata farmId,
        string calldata cropType,
        string calldata detectionDate,
        uint256[] calldata affectedSerials,
        string calldata reason
    ) external onlyRole(RECALL_AGENT_ROLE) returns (uint256) {
        recalls.push(
            RecallEvent({
                farmId: farmId,
                cropType: cropType,
                detectionDate: detectionDate,
                affectedSerials: affectedSerials,
                timestamp: block.timestamp,
                resolved: false,
                reason: reason
            })
        );

        uint256 recallId = recalls.length - 1;
        emit RecallInitiated(recallId, farmId, cropType, affectedSerials.length);
        return recallId;
    }

    /**
     * @notice Marks a recall as resolved (e.g., all affected product removed).
     * @param recallId Index of the recall to resolve
     */
    function resolveRecall(uint256 recallId) external onlyRole(RECALL_AGENT_ROLE) {
        require(recallId < recalls.length, "RecallManager: invalid recallId");
        require(!recalls[recallId].resolved, "RecallManager: already resolved");
        recalls[recallId].resolved = true;
        emit RecallResolved(recallId);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    /**
     * @return Total number of recall events initiated
     */
    function getRecallCount() external view returns (uint256) {
        return recalls.length;
    }

    /**
     * @notice Returns all serial numbers affected by a specific recall.
     * @param recallId The recall event to query
     */
    function getAffectedSerials(
        uint256 recallId
    ) external view returns (uint256[] memory) {
        require(recallId < recalls.length, "RecallManager: invalid recallId");
        return recalls[recallId].affectedSerials;
    }
}
