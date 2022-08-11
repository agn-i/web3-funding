const { assert } = require("chai");
const { network, getNamedAccounts, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
  ? describe.skip
  : describe("Funding Contract Staging Tests", () => {
      let deployer, fundingContract;
      const sendValue = ethers.utils.parseEther("0.1");
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        fundingContract = await ethers.getContractAt("Web3Funding", deployer);
      });

      it("allows people to fund  and withdraw", async () => {
        await fundingContract.fund({ value: sendValue });
        console.log("funds deposited");
        await fundingContract.withdraw();
        console.log("funds withdraw");

        const endingContractBalance = await fundingContract.provider.getBalance(
          fundingContract.address
        );
        console.log(
          endingContractBalance.toString() +
            " should equal 0, running assert equal..."
        );
        assert.equal(endingContractBalance.toString(), "0");
      });
    });
