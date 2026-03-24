import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const OPERATOR_KEY = process.env.HEDERA_OPERATOR_PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    hedera_testnet: {
      url: "https://testnet.hashio.io/api",
      accounts: OPERATOR_KEY ? [OPERATOR_KEY] : [],
      gasPrice: 1500000000000, // 1500 Gwei
      gas: 2000000,
    },
  },
};

export default config;
