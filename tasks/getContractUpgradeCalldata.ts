import fs from "fs";
import { TASK_COMPILE } from "hardhat/builtin-tasks/task-names";
import { task, types } from 'hardhat/config';
import { attachProxyAdminV5 } from '@openzeppelin/hardhat-upgrades/dist/utils';
import { ContractFactory } from 'ethers';

const KnownContractNames = {
    DiamondDao: "DiamondDao",
    DiamondDaoLowMajority: "DiamondDaoLowMajority"
}

const KnownContracts = new Map<string, string>([
    [KnownContractNames.DiamondDao, "0xDA0da0da0Da0Da0Da0DA00DA0da0da0DA0DA0dA0"],
    [KnownContractNames.DiamondDaoLowMajority, "0x"]
]);


task("analyze", "analzyes contracts")
    .setAction(async (taskArgs, hre)=> {

        const ethers = hre.ethers;
        const upgrades = hre.upgrades;
        const daoAddress = KnownContracts.get(KnownContractNames.DiamondDao)!;
        
        const adminAddress = await upgrades.erc1967.getAdminAddress(daoAddress);
        const implementationAddress = await upgrades.erc1967.getImplementationAddress(daoAddress);

        console.log("DAO admin address:", adminAddress);
        console.log("daoAddress:", daoAddress);
        console.log("implementationAddress:", implementationAddress );


    });

task("deployLowMajorityContract", "deploys LowMajority contract")
    .setAction(async (taskArgs, hre) => {
        const ethers = hre.ethers;
        const upgrades = hre.upgrades;

        const [deployer] = await ethers.getSigners();

        const contractFactory = await ethers.getContractFactory(KnownContractNames.DiamondDaoLowMajority);
        const daoAddress = KnownContracts.get(KnownContractNames.DiamondDao)!;

        let newContract = await upgrades.deployProxy(
            contractFactory,
            [daoAddress],
            { initializer: 'initialize' }
        );

        newContract = await newContract.waitForDeployment();

        console.log("transfering ownership to DAO.");
        await upgrades.admin.transferProxyAdminOwnership(await newContract.getAddress(), daoAddress);

        const proxyAddress = await newContract.getAddress();
        console.log("Proxy address: ", proxyAddress);

        const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
        console.log("Implementation:", implementationAddress);

        // Get proxy admin address
        const adminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);
        console.log("Proxy Admin:", adminAddress);

        // const p = await ethers.getContractFactory("Proxy");
    });


task("forceImport", "force imports contracts")
    .setAction(async (taskArgs, hre) => {
        const ethers = hre.ethers;
        const upgrades = hre.upgrades;

    
    });


task("getUpgradeCalldata", "Get contract upgrade calldata to use in DAO proposal")
    .addParam("contract", "The core contract address to upgrade")
    .addOptionalParam("output", "Output file name", undefined, types.string)
    .addOptionalParam("impl", "Address of new core contract implementation", undefined, types.string)
    .addOptionalParam("initFunc", "Initialization or reinitialization function", undefined, types.string)
    .addOptionalVariadicPositionalParam("initArgs", "Contract constructor arguments.", [])
    .setAction(async (taskArgs, hre) => {
        const { contract, output, impl, initFunc, initArgs } = taskArgs;

        if (!KnownContracts.has(contract)) {
            throw new Error(`${contract} is unknown`);
        }

        await hre.run("validate-storage", { contract: contract });

        const [deployer] = await hre.ethers.getSigners();

        console.log("using address for deployment: ", deployer.address);

        const proxyAddress = KnownContracts.get(contract)!;
        const contractFactory = await hre.ethers.getContractFactory(contract, deployer) as ContractFactory;

        let implementationAddress: string = impl;
        if (impl == undefined) {
            const result = await hre.upgrades.deployImplementation(
                contractFactory,
                {
                    getTxResponse: false,
                    redeployImplementation: 'always',
                }
            );
            implementationAddress = result as string;
        }

        let initCalldata = hre.ethers.hexlify(new Uint8Array());
        if (initFunc != undefined) {
            const initializer = initFunc as string;

            initCalldata = contractFactory.interface.encodeFunctionData(initializer, initArgs);
        }

        const proxyAdminAddress = await hre.upgrades.erc1967.getAdminAddress(proxyAddress);
        const proxyAdmin = await attachProxyAdminV5(hre, proxyAdminAddress);

        const calldata = proxyAdmin.interface.encodeFunctionData("upgradeAndCall", [
            proxyAddress,
            implementationAddress,
            initCalldata,
        ]);

        const data = `contract: ${contract}\n`
            + `calldata: ${calldata}\n`
            + `  target: ${proxyAdminAddress}\n`;
        if (output != undefined) {
            fs.writeFileSync(output, data, { flag: 'a' });
        }
        console.log(data);

    });


task("validate-storage", "Validate contract upgrade storage compatibility")
    .addParam("contract", "Name of the contract to validate")
    .setAction(async (taskArgs, hre) => {
        await hre.run(TASK_COMPILE);

        if (!KnownContracts.has(taskArgs.contract)) {
            throw new Error(`${taskArgs.contract} is unknown`);
        }

        const proxyAddress = KnownContracts.get(taskArgs.contract)!;
        const contractFactory = await hre.ethers.getContractFactory(taskArgs.contract) as ContractFactory;

        console.log("Validating upgrade compatibility of contract ", taskArgs.contract);

        await hre.upgrades.validateImplementation(contractFactory);
        await hre.upgrades.validateUpgrade(
            proxyAddress,
            contractFactory,
            {
                unsafeAllowRenames: false,
                unsafeSkipStorageCheck: false,
                kind: "transparent",
            },
        );

        console.log("done!")
    });