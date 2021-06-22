import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();

import { HardhatUserConfig } from "hardhat/types";

import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
// TODO: reenable solidity-coverage when it works
// import "solidity-coverage";

const LOCALHOST_URL: string = process.env.LOCALHOST_URL || "";
const ALCHEMY_MAINNET_KEY: string = process.env.ALCHEMY_MAINNET_KEY || "";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [
      { version: "0.6.12", settings: {} },
      { version: "0.7.6", settings: {} },
    ],
  },
  networks: {
    hardhat: {
      forking: {
        url: LOCALHOST_URL ? LOCALHOST_URL : ALCHEMY_MAINNET_KEY,
      },
    },
  },
};

export default config;
