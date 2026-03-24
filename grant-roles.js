const {
  Client,
  PrivateKey,
  AccountId,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractId,
  Hbar,
} = require("@hashgraph/sdk");
const dotenv = require("dotenv");

dotenv.config();

const OPERATOR_ID = process.env["HEDERA_OPERATOR_ACCOUNT_ID"];
const OPERATOR_KEY = process.env["HEDERA_OPERATOR_PRIVATE_KEY"];
const BATCH_REGISTRY_ID = process.env["HEDERA_CONTRACT_ID"];
const RECALL_MANAGER_ID = process.env["HEDERA_RECALL_MANAGER_CONTRACT_ID"];

const decodeHex = (hex) => {
    const s = hex.startsWith("0x") ? hex.slice(2) : hex;
    const res = new Uint8Array(s.length / 2);
    for (let i = 0; i < s.length; i += 2) {
        res[i / 2] = parseInt(s.substr(i, 2), 16);
    }
    return res;
};

async function main() {
  const client = Client.forTestnet();
  const operatorId = AccountId.fromString(OPERATOR_ID);
  const operatorKey = PrivateKey.fromStringECDSA(OPERATOR_KEY);
  client.setOperator(operatorId, operatorKey);

  const registryId = ContractId.fromString(BATCH_REGISTRY_ID);
  const managerId = ContractId.fromString(RECALL_MANAGER_ID);
  const solidityAddr = operatorId.toSolidityAddress();
  const evmAddr = "0x0c9057aEC49395D8EB3432f60B7BE2efB1724bf8";

  console.log(`Payer Solidity Address: 0x${solidityAddr}`);
  console.log(`Payer EVM Address: ${evmAddr}`);

  const FARM_ROLE_HASH = decodeHex("08e2fe187e4fb484bb675d870bd92d638b9fe0a6ca9c0c64fe8209d4beb48519");
  const RECALL_AGENT_ROLE_HASH = decodeHex("050ddbee4ef36104f9a78f2dbcf9ba536ee51f9647ba3574d4b6d3ca90379b6d");

  // Grant to Solidity Addr
  console.log("Granting roles to Solidity address...");
  await (await new ContractExecuteTransaction()
    .setContractId(registryId)
    .setGas(200000)
    .setFunction("grantRole", new ContractFunctionParameters()
        .addBytes32(FARM_ROLE_HASH)
        .addAddress(solidityAddr)
    )
    .execute(client)).getReceipt(client);
  console.log("✅ Granted FARM_ROLE to Solidity addr");

  await (await new ContractExecuteTransaction()
    .setContractId(registryId)
    .setGas(200000)
    .setFunction("grantRole", new ContractFunctionParameters()
        .addBytes32(RECALL_AGENT_ROLE_HASH)
        .addAddress(solidityAddr)
    )
    .execute(client)).getReceipt(client);
  console.log("✅ Granted RECALL_AGENT_ROLE to Solidity addr");

  // Grant to EVM Addr
  console.log("Granting roles to EVM address...");
  await (await new ContractExecuteTransaction()
    .setContractId(registryId)
    .setGas(200000)
    .setFunction("grantRole", new ContractFunctionParameters()
        .addBytes32(FARM_ROLE_HASH)
        .addAddress(evmAddr)
    )
    .execute(client)).getReceipt(client);
  console.log("✅ Granted FARM_ROLE to EVM addr");

  await (await new ContractExecuteTransaction()
    .setContractId(registryId)
    .setGas(200000)
    .setFunction("grantRole", new ContractFunctionParameters()
        .addBytes32(RECALL_AGENT_ROLE_HASH)
        .addAddress(evmAddr)
    )
    .execute(client)).getReceipt(client);
  console.log("✅ Granted RECALL_AGENT_ROLE to EVM addr");

  client.close();
}

main().catch(err => {
    console.error(err);
    if (err.transactionReceipt) console.error("Receipt status:", err.transactionReceipt.status.toString());
});
