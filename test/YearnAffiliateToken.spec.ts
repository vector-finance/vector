import { BigNumber } from "@ethersproject/bignumber";
import { parseEther } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { YearnAffiliateToken } from "../typechain/YearnAffiliateToken";
import { YearnAffiliateToken__factory } from "../typechain/factories/YearnAffiliateToken__factory";
import { ISwapRouter__factory } from "../typechain/factories/ISwapRouter__factory";
import { IERC20 } from "../typechain/IERC20";
import { ISwapRouter } from "../typechain/ISwapRouter";

chai.use(chaiAsPromised);
const { expect } = chai;

const daiAddress: string = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const registryAddress: string = "0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804";
const uniswapRouterAddress: string =
  "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const WETHAddress: string = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const tokenName: string = "Affiliate DAI";
const tokenSymbol: string = "afDAI";

const yDAI: string = "0x19D3364A399d251E894aC732651be8B0E4e85001";

describe("YearnAffiliateToken", () => {
  let signers: SignerWithAddress[];
  let affiliate: SignerWithAddress;
  let newAffiliate: SignerWithAddress;
  let guardian: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let affiliateToken: YearnAffiliateToken;
  let uniswapRouter: ISwapRouter;
  let WETHContract: IERC20;
  let daiContract: IERC20;

  beforeEach(async () => {
    signers = await ethers.getSigners();
    affiliate = signers[0];
    newAffiliate = signers[1];
    guardian = signers[2];
    alice = signers[3]; // vault user
    bob = signers[4]; // attacker

    const affiliateTokenFactory = (await ethers.getContractFactory(
      "YearnAffiliateToken",
      affiliate
    )) as YearnAffiliateToken__factory;
    affiliateToken = await affiliateTokenFactory.deploy(
      daiAddress,
      registryAddress,
      tokenName,
      tokenSymbol
    );
    await affiliateToken.deployed();

    // test config
    const affiliateAddress = await affiliateToken.affiliate();
    const afToken = await affiliateToken.token();
    const registry = await affiliateToken.registry();
    const afTokenName = await affiliateToken.name();
    const afTokenSymbol = await affiliateToken.symbol();

    expect(affiliateAddress).to.eq(affiliate.address);
    expect(afToken).to.eq(daiAddress);
    expect(registry).to.eq(registryAddress);
    expect(afTokenName).to.eq(tokenName);
    expect(afTokenSymbol).to.eq(tokenSymbol);
  });

  describe("setAffiliate()", async () => {
    it("Should set affiliate by affiliate", async () => {
      await affiliateToken
        .connect(affiliate)
        .setAffiliate(newAffiliate.address);

      const pendingAddress = await affiliateToken.pendingAffiliate();
      expect(pendingAddress).to.eq(newAffiliate.address);

      // only new affiliate address can accept
      await expect(affiliateToken.connect(bob).acceptAffiliate()).to.be
        .reverted;

      await affiliateToken.connect(newAffiliate).acceptAffiliate();
      const affiliateAddress = await affiliateToken.affiliate();
      expect(affiliateAddress).to.eq(newAffiliate.address);
    });

    it("Should not set affiliate by other accounts except for affiliate", async () => {
      await expect(affiliateToken.connect(bob).setAffiliate(bob.address)).to.be
        .reverted;
    });
  });

  describe("setRegistry()", async () => {
    it("Should set registry only by governance", async () => {
      await expect(
        affiliateToken.connect(affiliate).setRegistry(affiliate.address)
      ).to.be.reverted;
    });
  });

  describe("deposit & withdraw()", async () => {
    before("swap WETH to DAI for deposit", async () => {
      // swap 10WETH to DAI
      uniswapRouter = ISwapRouter__factory.connect(uniswapRouterAddress, alice);

      const curBlock = await ethers.provider.getBlockNumber();
      const timeLock =
        (await ethers.provider.getBlock(curBlock)).timestamp + 1000000;

      const params = {
        tokenIn: WETHAddress,
        tokenOut: daiAddress,
        fee: 3000,
        recipient: alice.address,
        deadline: timeLock,
        amountIn: parseEther("10"),
        amountOutMinimum: 1,
        sqrtPriceLimitX96:
          WETHAddress.toLowerCase() < daiAddress.toLowerCase()
            ? BigNumber.from("4295128740")
            : BigNumber.from(
              "1461446703485210103287273052203988822378723970341"
            ),
      };

      await uniswapRouter.exactInputSingle(params, { value: parseEther("10") });
    });

    /*it("should deposit DAI", async () => {
      // deposit amount    10000000000000000000000
      // totalVaultBalance  9999999999999999995089

      // totalDebt      542146612917323702403992216
      // totalAssets    542312294554700934748373347
      // totalSupply    518240516320506098132714806
      // deposit amount     10000000000000000000000

      const totalVaultBalance = await affiliateToken.totalVaultBalance(
        affiliateToken.address
      );

      await daiContract.approve(affiliateToken.address, parseEther("10000"));
      const daiAllowance = await daiContract.allowance(
        alice.address,
        affiliateToken.address
      );

      await affiliateToken
        .connect(alice)
      ["deposit(uint256)"](parseEther("10000"));

      await affiliateToken.connect(alice)["withdraw()"]();
    });*/
  });
});
