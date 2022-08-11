const { assert, expect } = require("chai");
const { network, deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Finding", () => {
      let fundingContract, mockV3Aggregator, deployer;
      const sendValue = ethers.utils.parseEther("1");

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        fundingContract = await ethers.getContract("Web3Funding", deployer);
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });

      describe("constructor", function () {
        it("sets the aggregator address correctly", async () => {
          const response = await fundingContract.getPriceFeed();
          assert.equal(response, mockV3Aggregator.address);
        });
      });

      describe("fund", () => {
        it("should fail if you don't send enough eth", async () => {
          await expect(fundingContract.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          );
        });

        it("should update the amount funded data strcuture", async () => {
          await fundingContract.fund({ value: sendValue });
          const response = await fundingContract.getAddressToAmountFunded(
            deployer
          );
          assert.equal(response.toString(), sendValue.toString());
        });

        it("should add funder to array of funders", async () => {
          await fundingContract.fund({ value: sendValue });
          const response = await fundingContract.getFunder(0);
          assert.equal(response, deployer);
        });
      });

      describe("withdraw", () => {
        beforeEach(async () => {
          await fundingContract.fund({ value: sendValue });
        });

        it("withdraws ETH from a single funder", async () => {
          const startingContractBalance =
            await fundingContract.provider.getBalance(fundingContract.address);
          const startingDeployerBalance =
            await fundingContract.provider.getBalance(deployer);

          const txResponse = await fundingContract.withdraw();
          const txReceipt = await txResponse.wait();
          const { gasUsed, effectiveGasPrice } = txReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await fundingContract.provider.getBalance(
            fundingContract.address
          );
          const endingDeployerBalance =
            await fundingContract.provider.getBalance(deployer);

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingContractBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );
        });

        it("should allow us to withdraw from multiple funders", async () => {
          const accounts = await ethers.getSigners();
          for (i = 1; i < 6; i++) {
            const accountConnectedContract = await fundingContract.connect(
              accounts[i]
            );
            await accountConnectedContract.fund({ value: sendValue });
          }
          const startingContractBalance =
            await fundingContract.provider.getBalance(fundingContract.address);
          const startingDeployerBalance =
            await fundingContract.provider.getBalance(deployer);

          const txResponse = await fundingContract.cheaperWithdraw();
          const txReceipt = await txResponse.wait();
          const { gasUsed, effectiveGasPrice } = txReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await fundingContract.provider.getBalance(
            fundingContract.address
          );
          const endingDeployerBalance =
            await fundingContract.provider.getBalance(deployer);

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingContractBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );
          await expect(fundingContract.getFunder(0)).to.be.reverted;
          for (i = 1; i < 6; i++) {
            assert.equal(
              await fundingContract.getAddressToAmountFunded(
                accounts[i].address
              ),
              0
            );
          }
        });

        it("Only allows the owner to withdraw", async () => {
          const accounts = await ethers.getSigners();
          const accountConnectedContract = fundingContract.connect(accounts[1]);
          await expect(accountConnectedContract.withdraw()).to.be.revertedWith(
            "Web3Funding_NotOwner"
          );
        });
      });
    });
