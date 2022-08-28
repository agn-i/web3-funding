const {
    frontEndContractsFile,
    frontEndAbiFile,
} = require("../helper-hardhat-config")
const fs = require("fs")
const { ethers, network } = require("hardhat")
require("dotenv").config()

const updateAbi = async () => {
    const fundingContract = await ethers.getContract("Web3Funding")
    fs.writeFileSync(
        frontEndAbiFile,
        fundingContract.interface.format(ethers.utils.FormatTypes.json)
    )
}

const updateContractAddresses = async () => {
    const fundingContract = await ethers.getContract("Web3Funding")
    const contractAddresses = JSON.parse(
        fs.readFileSync(frontEndContractsFile, "utf8")
    )
    const chainId = network.config.chainId.toString()
    if (chainId in contractAddresses) {
        if (!contractAddresses[chainId].includes(fundingContract.address)) {
            contractAddresses[chainId].push(fundingContract.address)
        }
    } else {
        contractAddresses[chainId] = [fundingContract.address]
    }
    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))
}

module.exports = async () => {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Writing to front end project....")
        await updateContractAddresses()
        await updateAbi()
        console.log("Front end successfully updated")
    }
}

module.exports.tags = ["all", "frontend"]
