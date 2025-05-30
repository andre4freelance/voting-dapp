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

    // --- KELOMPOK TES BARU UNTUK FUNGSI VOTE ---
    describe("vote", function () {
        let proposalId0; // Kita akan gunakan ini untuk menyimpan ID proposal yang valid

        beforeEach(async function() {
            // Tambahkan proposal sebelum setiap tes di kelompok 'vote'
            await votingContract.connect(owner).addProposal("Proposal untuk di-vote");
            proposalId0 = 0; // Proposal pertama yang dibuat akan memiliki ID 0
        });

        it("Should allow a user to vote 'yes' on an existing proposal", async function () {
            // addr1 memberikan suara 'yes' pada proposalId0
            await expect(votingContract.connect(addr1).vote(proposalId0, true))
                .to.emit(votingContract, "Voted") // Memeriksa apakah event Voted dipancarkan
                .withArgs(proposalId0, addr1.address, true); // Dengan argumen yang benar

            const proposal = await votingContract.proposals(proposalId0);
            expect(proposal.yesVotes).to.equal(1);
            expect(proposal.noVotes).to.equal(0);
            expect(await votingContract.hasVoted(proposalId0, addr1.address)).to.be.true; // Cek apakah addr1 sudah tercatat sebagai voter
        });

        it("Should allow a user to vote 'no' on an existing proposal", async function () {
            // addr1 memberikan suara 'no' pada proposalId0
            await expect(votingContract.connect(addr1).vote(proposalId0, false))
                .to.emit(votingContract, "Voted")
                .withArgs(proposalId0, addr1.address, false);

            const proposal = await votingContract.proposals(proposalId0);
            expect(proposal.yesVotes).to.equal(0);
            expect(proposal.noVotes).to.equal(1);
            expect(await votingContract.hasVoted(proposalId0, addr1.address)).to.be.true;
        });

        it("Should revert if trying to vote on a non-existent proposal ID", async function () {
            const nonExistentProposalId = 99;
            await expect(votingContract.connect(addr1).vote(nonExistentProposalId, true))
                .to.be.revertedWith("Proposal ID does not exist.");
        });

        it("Should revert if a user tries to vote twice on the same proposal", async function () {
            // addr1 vote pertama kali
            await votingContract.connect(addr1).vote(proposalId0, true);

            // addr1 mencoba vote kedua kali pada proposal yang sama
            await expect(votingContract.connect(addr1).vote(proposalId0, false)) // Mencoba vote 'no' kali ini
                .to.be.revertedWith("You have already voted on this proposal.");

            // Pastikan jumlah vote tidak berubah setelah percobaan vote kedua yang gagal
            const proposal = await votingContract.proposals(proposalId0);
            expect(proposal.yesVotes).to.equal(1); // Seharusnya tetap 1 dari vote pertama
            expect(proposal.noVotes).to.equal(0);
        });

        it("Should allow multiple users to vote on the same proposal", async function () {
            // addr1 vote 'yes'
            await votingContract.connect(addr1).vote(proposalId0, true);
            // addr2 vote 'no'
            await votingContract.connect(addr2).vote(proposalId0, false);
            // owner vote 'yes'
            await votingContract.connect(owner).vote(proposalId0, true);

            const proposal = await votingContract.proposals(proposalId0);
            expect(proposal.yesVotes).to.equal(2);
            expect(proposal.noVotes).to.equal(1);

            expect(await votingContract.hasVoted(proposalId0, addr1.address)).to.be.true;
            expect(await votingContract.hasVoted(proposalId0, addr2.address)).to.be.true;
            expect(await votingContract.hasVoted(proposalId0, owner.address)).to.be.true;
        });
        
        it("Should correctly update vote counts for different proposals independently", async function () {
            // Tambah proposal kedua
            await votingContract.connect(owner).addProposal("Proposal Kedua untuk di-vote");
            const proposalId1 = 1;

            // addr1 vote 'yes' di proposal 0
            await votingContract.connect(addr1).vote(proposalId0, true);
            // addr2 vote 'yes' di proposal 1
            await votingContract.connect(addr2).vote(proposalId1, true);

            const proposal0Details = await votingContract.proposals(proposalId0);
            expect(proposal0Details.yesVotes).to.equal(1);
            expect(proposal0Details.noVotes).to.equal(0);

            const proposal1Details = await votingContract.proposals(proposalId1);
            expect(proposal1Details.yesVotes).to.equal(1);
            expect(proposal1Details.noVotes).to.equal(0);
        });
    });
    // --- Akhir kelompok tes untuk fungsi vote ---

    // --- KELOMPOK TES BARU UNTUK FUNGSI BACA DATA ---
    describe("getProposalsCount", function () {
        it("Should return 0 initially", async function () {
            expect(await votingContract.getProposalsCount()).to.equal(0);
        });

        it("Should return the correct count after adding proposals", async function () {
            await votingContract.connect(owner).addProposal("Proposal X");
            expect(await votingContract.getProposalsCount()).to.equal(1);

            await votingContract.connect(owner).addProposal("Proposal Y");
            expect(await votingContract.getProposalsCount()).to.equal(2);
        });
    });

    describe("getProposalDetails", function () {
        it("Should revert if trying to get details for a non-existent proposal ID", async function () {
            await expect(votingContract.getProposalDetails(0)) // Belum ada proposal
                .to.be.revertedWith("Proposal ID does not exist.");
            
            await votingContract.connect(owner).addProposal("Proposal A"); // Proposal ID 0 ditambahkan
            await expect(votingContract.getProposalDetails(1)) // ID 1 belum ada
                .to.be.revertedWith("Proposal ID does not exist.");
        });

        it("Should return correct details for an existing proposal", async function () {
            const desc1 = "Is A a good proposal?";
            await votingContract.connect(owner).addProposal(desc1); // ID 0

            const desc2 = "What about proposal B?";
            await votingContract.connect(owner).addProposal(desc2); // ID 1

            // Tes untuk proposal pertama (ID 0)
            const details1 = await votingContract.getProposalDetails(0);
            expect(details1.id).to.equal(0);
            expect(details1.description).to.equal(desc1);
            expect(details1.yesVotes).to.equal(0);
            expect(details1.noVotes).to.equal(0);
            expect(details1.exists).to.be.true;

            // Tes untuk proposal kedua (ID 1)
            // Kita juga bisa destrukturisasi hasilnya seperti ini:
            const { id, description, yesVotes, noVotes, exists } = await votingContract.getProposalDetails(1);
            expect(id).to.equal(1);
            expect(description).to.equal(desc2);
            expect(yesVotes).to.equal(0);
            expect(noVotes).to.equal(0);
            expect(exists).to.be.true;
        });
    });

    // --- Kita akan menambahkan kelompok tes untuk fungsi vote di sini nanti ---
});