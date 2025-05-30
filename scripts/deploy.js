// scripts/deploy.js
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const Voting = await ethers.getContractFactory("Voting");
    const votingContract = await Voting.deploy();

    // Menunggu kontrak selesai di-deploy (penting di skrip)
    // Untuk ethers v5 dan Hardhat lama: await votingContract.deployed();
    // Untuk ethers v6+ dengan Hardhat: alamat sudah tersedia langsung, tapi menunggu konfirmasi bisa baik
    // Cara yang lebih robust untuk menunggu deployment adalah dengan menunggu konfirmasi transaksi:
    const deployTxReceipt = await votingContract.deploymentTransaction().wait(1); // Tunggu 1 konfirmasi

    // console.log("Voting contract deployed to:", votingContract.address); // ethers v5
    console.log("Voting contract deployed to:", deployTxReceipt.contractAddress); // ethers v6, atau dari receipt
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });