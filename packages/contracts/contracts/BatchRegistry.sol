// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title BatchRegistry
 * @notice Stores on-chain provenance state for FoodLink crop batches.
 *         Each batch (identified by its HTS NFT serial number) has an owner,
 *         recall flag, and link to its HCS provenance chain.
 *
 * @dev Deployed on Hedera EVM. Role-based access via OpenZeppelin AccessControl.
 *      Mirrors state that is fully verifiable on HCS but provides fast on-chain
 *      query capability for smart contract integrations.
 */
contract BatchRegistry is AccessControl {
    // ─── Roles ────────────────────────────────────────────────────────────────

    bytes32 public constant FARM_ROLE = keccak256("FARM_ROLE");
    bytes32 public constant PROCESSOR_ROLE = keccak256("PROCESSOR_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");
    bytes32 public constant RECALL_AGENT_ROLE = keccak256("RECALL_AGENT_ROLE");

    // ─── Data Structures ──────────────────────────────────────────────────────

    struct Batch {
        address currentOwner;
        bool recalled;
        string hcsTopicId;
        string cropType;
        uint256 registeredAt;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    /// @notice Maps HTS NFT serial number to batch state
    mapping(uint256 => Batch) public batches;

    /// @notice Total number of registered batches
    uint256 public batchCount;

    // ─── Events ───────────────────────────────────────────────────────────────

    event BatchRegistered(
        uint256 indexed serialNumber,
        address indexed farmAccount,
        string hcsTopicId,
        string cropType
    );

    event CustodyTransferred(
        uint256 indexed serialNumber,
        address indexed from,
        address indexed to
    );

    event BatchRecalled(uint256 indexed serialNumber, string reason);

    // ─── Constructor ──────────────────────────────────────────────────────────

    /**
     * @param admin Initial admin address — receives DEFAULT_ADMIN_ROLE
     */
    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // ─── Mutations ────────────────────────────────────────────────────────────

    /**
     * @notice Registers a new crop batch in the registry.
     * @param serialNumber HTS NFT serial number identifying this batch globally
     * @param farmAccount Solidity address of the originating farm
     * @param hcsTopicId Hedera topic ID for this batch's provenance chain
     * @param cropType Human-readable crop type (e.g., "Romaine Lettuce")
     */
    function registerBatch(
        uint256 serialNumber,
        address farmAccount,
        string calldata hcsTopicId,
        string calldata cropType
    ) external onlyRole(FARM_ROLE) {
        require(batches[serialNumber].registeredAt == 0, "BatchRegistry: already registered");

        batches[serialNumber] = Batch({
            currentOwner: farmAccount,
            recalled: false,
            hcsTopicId: hcsTopicId,
            cropType: cropType,
            registeredAt: block.timestamp
        });

        batchCount++;
        emit BatchRegistered(serialNumber, farmAccount, hcsTopicId, cropType);
    }

    /**
     * @notice Transfers custody of a batch to the next supply chain actor.
     * @dev Caller must be the current owner or hold an actor role.
     * @param serialNumber Batch to transfer
     * @param newOwner Address of the next custody holder
     */
    function transferCustody(uint256 serialNumber, address newOwner) external {
        Batch storage batch = batches[serialNumber];
        require(batch.registeredAt != 0, "BatchRegistry: batch not found");
        require(!batch.recalled, "BatchRegistry: batch is recalled");
        require(
            batch.currentOwner == msg.sender ||
                hasRole(FARM_ROLE, msg.sender) ||
                hasRole(PROCESSOR_ROLE, msg.sender) ||
                hasRole(DISTRIBUTOR_ROLE, msg.sender),
            "BatchRegistry: not authorized"
        );

        address previous = batch.currentOwner;
        batch.currentOwner = newOwner;
        emit CustodyTransferred(serialNumber, previous, newOwner);
    }

    /**
     * @notice Flags a batch as recalled. Only the recall agent may call this.
     * @param serialNumber Batch to flag
     * @param reason Human-readable contamination reason
     */
    function flagRecall(
        uint256 serialNumber,
        string calldata reason
    ) external onlyRole(RECALL_AGENT_ROLE) {
        require(batches[serialNumber].registeredAt != 0, "BatchRegistry: batch not found");
        batches[serialNumber].recalled = true;
        emit BatchRecalled(serialNumber, reason);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    /**
     * @notice Returns the current state of a batch.
     * @param serialNumber Batch to query
     * @return owner Current custody holder address
     * @return recalled Whether this batch has been recalled
     * @return hcsTopicId Hedera HCS topic ID for the provenance chain
     */
    function getBatchStatus(
        uint256 serialNumber
    ) external view returns (address owner, bool recalled, string memory hcsTopicId) {
        Batch storage batch = batches[serialNumber];
        require(batch.registeredAt != 0, "BatchRegistry: batch not found");
        return (batch.currentOwner, batch.recalled, batch.hcsTopicId);
    }
}
