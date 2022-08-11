const { ethers, getNamedAccounts } = require("hardhat");

const main = async () => {
  const { deployer } = await getNamedAccounts();
  const fundingContract = await ethers.getContract("Web3Funding", deployer);
  console.log(`Found contract at ${fundingContract.address}`);
  console.log("Withdrawing funds from contract ...");
  const txResponse = await fundingContract.withdraw();
  await txResponse.wait();
  console.log("Withdrawal successful!");
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
