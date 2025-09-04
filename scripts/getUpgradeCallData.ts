// import hre from "hardhat";
// import { ethers, upgrades } from "hardhat";
// import { attachProxyAdminV5, } from "@openzeppelin/hardhat-upgrades/dist/utils";


// const KnownContracts = new Map<string, string>([
//     ["DiamondDao", "0xDA0da0da0Da0Da0Da0DA00DA0da0da0DA0DA0dA0"],
//     ["DiamondDaoLowMajority", "0x14e7fa086bD4afB577Dc2A82c638D117C8035046"]
// ]);


// async function getUpgradeCalldata() {

//     await getUpgradeCalldataForContract("DiamondDao");
//     await getUpgradeCalldataForContract("DiamondDaoLowMajority");

// }

// async function getUpgradeCalldataForContract(contractName: string) {
//     const contractAddress = KnownContracts.get(contractName);

//     if (!contractAddress) {
//         throw new Error(`Contract address for ${contractName} not found`);
//     }

//     const proxyAdmin = await attachProxyAdminV5(
//         hre,
//         await upgrades.erc1967.getAdminAddress(contractAddress)
//     );
    
//     console.log("Proxy Admin: ", proxyAdmin.target)
//     const factory = await ethers.getContractFactory(contractName);
//     const newImplementation = await upgrades.deployImplementation(factory);

//     console.log("New imp. address: ", newImplementation)
//     const calldata = proxyAdmin.interface.encodeFunctionData("upgradeAndCall", [
//         contractAddress,
//         newImplementation,
//         ethers.hexlify(new Uint8Array()),
//     ]);
//     console.log("Calldata: ", calldata);
// }

// getUpgradeCalldata().catch((error) => {
//     console.error(error);
//     process.exitCode = 1;
// });