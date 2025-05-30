// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9; // Atau versi Solidity yang lebih baru yang Anda inginkan

// Untuk debugging, bisa di-import jika menggunakan Hardhat console
// import "hardhat/console.sol";

contract Voting {
    // Alamat pemilik kontrak (admin)
    address public owner;

    // Struktur untuk menyimpan detail proposal
    struct Proposal {
        uint id;
        string description;
        uint yesVotes;
        uint noVotes;
        mapping(address => bool) voters; // Melacak siapa saja yang sudah vote di proposal ini
        bool exists; // Untuk menandai apakah proposal dengan ID ini ada
    }

    // Menyimpan semua proposal. Mapping dari ID proposal ke struct Proposal
    // Menggunakan mapping lebih efisien untuk akses langsung berdasarkan ID
    mapping(uint => Proposal) public proposals;

    // Counter untuk ID proposal agar unik
    uint public nextProposalId;

    // Event (opsional untuk sekarang, bisa ditambahkan nanti)
    // event ProposalCreated(uint proposalId, string description);
    // event Voted(uint proposalId, address voter, bool voteYes);

    constructor() {
        owner = msg.sender; // Alamat yang men-deploy kontrak menjadi owner
        nextProposalId = 0; // Mulai ID proposal dari 0 (atau 1 jika lebih suka)
    }

    // Modifier untuk memastikan hanya owner yang bisa memanggil fungsi tertentu
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    }

    /**
     * @dev Menambahkan proposal voting baru. Hanya bisa dipanggil oleh owner.
     * @param _description Deskripsi dari proposal.
     */
    function addProposal(string memory _description) public onlyOwner {
        uint currentProposalId = nextProposalId;
        proposals[currentProposalId] = Proposal({
            id: currentProposalId,
            description: _description,
            yesVotes: 0,
            noVotes: 0,
            // 'voters' mapping tidak perlu diinisialisasi secara eksplisit di sini
            exists: true
        });
        nextProposalId++; // Naikkan counter untuk ID proposal berikutnya

        // emit ProposalCreated(currentProposalId, _description); // Aktifkan jika event sudah didefinisikan
    }

    // --- Fungsi-fungsi lain akan ditambahkan di bawah sini ---

}