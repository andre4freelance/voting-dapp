// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.28; // Pastikan ini sesuai dengan hardhat.config.js

// import "hardhat/console.sol";

contract Voting {
    address public owner;

    struct Proposal {
        uint id;
        string description;
        uint yesVotes;
        uint noVotes;
        mapping(address => bool) voters;
        bool exists;
    }

    mapping(uint => Proposal) public proposals;
    uint public nextProposalId;

    // event ProposalCreated(uint proposalId, string description);
    // event Voted(uint proposalId, address voter, bool voteYes);

    constructor() {
        owner = msg.sender;
        nextProposalId = 0;
    }

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
        
        // Modifikasi di sini:
        // Kita tidak membuat Proposal struct sementara, tapi langsung mengisi field-nya
        // pada storage location proposals[currentProposalId]
        Proposal storage newProposal = proposals[currentProposalId]; // Dapatkan referensi ke storage
        newProposal.id = currentProposalId;
        newProposal.description = _description;
        newProposal.yesVotes = 0; // yesVotes dan noVotes otomatis 0 jika tidak di-assign, tapi eksplisit lebih baik
        newProposal.noVotes = 0;
        // 'voters' mapping tidak perlu diinisialisasi, sudah default
        newProposal.exists = true;
        
        nextProposalId++;

        // emit ProposalCreated(currentProposalId, _description);
    }

    // --- Fungsi-fungsi lain akan ditambahkan di bawah sini ---
}