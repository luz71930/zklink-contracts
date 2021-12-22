const hardhat = require('hardhat');
const { expect } = require('chai');

describe('DeployFactory unit tests', function () {
    let defaultSender,governor,validator,feeAccount;
    let zkSyncProxy, vaultProxy, governanceProxy;
    let token;
    beforeEach(async () => {
        [defaultSender,governor,validator,feeAccount] = await hardhat.ethers.getSigners();
        // governance
        const governanceFactory = await hardhat.ethers.getContractFactory('Governance');
        const governance = await governanceFactory.deploy();
        // verifier
        const verifierFactory = await hardhat.ethers.getContractFactory('Verifier');
        const verifier = await verifierFactory.deploy();
        // vault
        const vaultFactory = await hardhat.ethers.getContractFactory('Vault');
        const vault = await vaultFactory.deploy();
        // zkSyncBlock
        const zkSyncBlockFactory = await hardhat.ethers.getContractFactory('ZkLinkBlock');
        const zkSyncBlock = await zkSyncBlockFactory.deploy();
        // zkSyncExit
        const zkSyncExitFactory = await hardhat.ethers.getContractFactory('ZkLinkExit');
        const zkSyncExit = await zkSyncExitFactory.deploy();
        // zkSync
        const zkSyncFactory = await hardhat.ethers.getContractFactory('ZkLink');
        const zkSync = await zkSyncFactory.deploy();

        const genesisRoot = hardhat.ethers.utils.arrayify("0x209d742ecb062db488d20e7f8968a40673d718b24900ede8035e05a78351d956");

        // deployer
        const deployerFactory = await hardhat.ethers.getContractFactory('DeployFactory');
        const deployer = await deployerFactory.deploy(
            zkSyncBlock.address,
            zkSyncExit.address,
            governance.address,
            verifier.address,
            vault.address,
            zkSync.address,
            genesisRoot,
            validator.address,
            governor.address,
            feeAccount.address
        );
        const txr = await deployer.deployTransaction.wait();
        const log = deployer.interface.parseLog(txr.logs[4]);
        const zksyncAddr = log.args.zkLink;
        const vaultAddr = log.args.vault;
        zkSyncProxy = zkSyncFactory.attach(zksyncAddr);
        vaultProxy = vaultFactory.attach(vaultAddr);
        governanceProxy = governanceFactory.attach(log.args.governance);
        // token
        const erc20Factory = await hardhat.ethers.getContractFactory('cache/solpp-generated-contracts/dev-contracts/ERC20.sol:ERC20');
        token = await erc20Factory.deploy(10000);
        await governanceProxy.connect(governor).addToken(token.address, false); // tokenId = 1
    });

    it('deposit erc20 should success', async () => {
        await token.approve(zkSyncProxy.address, 100);
        await expect(zkSyncProxy.depositERC20(token.address, 30, defaultSender.address)).to
            .emit(zkSyncProxy, 'Deposit')
            .withArgs(1, 30);
    });
});
