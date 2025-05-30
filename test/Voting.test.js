const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting Contract", function () {
    let Voting;
    let votingContract;
    let owner;
    let addr1;
    let addr2;

    // `beforeEach` akan berjalan sebelum setiap tes (`it` block)
    beforeEach(async function () {
        // Mendapatkan Signer (representasi akun Ethereum)
        // `owner` akan menjadi alamat yang men-deploy kontrak
        // `addr1`, `addr2` adalah akun lain untuk pengujian
        [owner, addr1, addr2] = await ethers.getSigners();

        // Mendapatkan artifact kontrak Voting
        Voting = await ethers.getContractFactory("Voting");

        // Men-deploy instance baru dari kontrak Voting sebelum setiap tes
        votingContract = await Voting.deploy();
        // Menunggu kontrak selesai di-deploy (tidak lagi diperlukan di ethers v6 dengan Hardhat)
        // await votingContract.deployed(); // Baris ini bisa di-skip jika menggunakan ethers v6+ dengan Hardhat terbaru
    });

    // Kelompok tes untuk fungsionalitas 'addProposal'
    describe("addProposal", function () {
        it("Should allow the owner to add a new proposal", async function () {
            const proposalDescription = "Proposal 1: Setuju dengan X?";
            
            // Owner menambahkan proposal
            await expect(votingContract.connect(owner).addProposal(proposalDescription))
                .to.not.be.reverted; // Kita harapkan transaksi ini tidak gagal (reverted)

            // Verifikasi bahwa proposal telah ditambahkan
            // nextProposalId akan menjadi ID dari proposal yang baru ditambahkan + 1
            // Jadi, proposal yang baru ditambahkan memiliki ID nextProposalId - 1
            // Karena kita mulai nextProposalId dari 0, proposal pertama akan memiliki ID 0
            const proposalId = 0; // ID proposal pertama
            const proposal = await votingContract.proposals(proposalId);

            expect(proposal.id).to.equal(proposalId);
            expect(proposal.description).to.equal(proposalDescription);
            expect(proposal.yesVotes).to.equal(0);
            expect(proposal.noVotes).to.equal(0);
            expect(proposal.exists).to.be.true;

            // Verifikasi bahwa nextProposalId telah bertambah
            expect(await votingContract.nextProposalId()).to.equal(1);
        });

        it("Should revert if a non-owner tries to add a proposal", async function () {
            const proposalDescription = "Proposal 2: Bagaimana dengan Y?";
            
            // addr1 (bukan owner) mencoba menambahkan proposal
            await expect(votingContract.connect(addr1).addProposal(proposalDescription))
                .to.be.revertedWith("Only owner can call this function.");
        });

        it("Should correctly increment proposal IDs for multiple proposals", async function () {
            const proposalDesc1 = "Proposal A";
            const proposalDesc2 = "Proposal B";

            // Proposal pertama (ID 0)
            await votingContract.connect(owner).addProposal(proposalDesc1);
            const proposal1 = await votingContract.proposals(0);
            expect(proposal1.id).to.equal(0);
            expect(proposal1.description).to.equal(proposalDesc1);
            expect(await votingContract.nextProposalId()).to.equal(1);

            // Proposal kedua (ID 1)
            await votingContract.connect(owner).addProposal(proposalDesc2);
            const proposal2 = await votingContract.proposals(1);
            expect(proposal2.id).to.equal(1);
            expect(proposal2.description).to.equal(proposalDesc2);
            expect(await votingContract.nextProposalId()).to.equal(2);
        });
    });

    // --- Kita akan menambahkan kelompok tes untuk fungsi lain di sini ---
});