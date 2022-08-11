const { ethers, getNamedAccounts } = require("hardhat");

const main = async () => {
  const { deployer } = await getNamedAccounts();
  const fundingContract = await ethers.getContract("Web3Funding", deployer);
  console.log(`Found contract at ${fundingContract.address}`);
  console.log("Adding funds to contract ...");
  const txResponse = await fundingContract.fund({
    value: ethers.utils.parseEther("0.1"),
  });
  await txResponse.wait();
  console.log("Funded!");
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
