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

    event ProposalCreated(uint proposalId, string description);
    event Voted(uint proposalId, address voter, bool voteYes);

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

        emit ProposalCreated(currentProposalId, _description); // Emit event untuk proposal baru
    }

    /**
     * @dev Mengembalikan jumlah total proposal yang telah dibuat.
     * @return Jumlah proposal.
     */
    function getProposalsCount() public view returns (uint) {
        return nextProposalId;
    }

    /**
     * @dev Mengembalikan detail dari proposal tertentu.
     * @param _proposalId ID dari proposal yang ingin dilihat.
     * @return id ID proposal.
     * @return description Deskripsi proposal.
     * @return yesVotes Jumlah suara "Ya".
     * @return noVotes Jumlah suara "Tidak".
     * @return exists Apakah proposal dengan ID tersebut ada.
     */
    function getProposalDetails(uint _proposalId) 
        public 
        view 
        returns (
            uint id, 
            string memory description, 
            uint yesVotes, 
            uint noVotes, 
            bool exists
        ) 
    {
        require(_proposalId < nextProposalId, "Proposal ID does not exist.");
        Proposal storage p = proposals[_proposalId];
        // Kita bisa langsung return p.exists, p.id dll, tapi lebih eksplisit seperti ini juga baik
        // atau cara lain: return (p.id, p.description, p.yesVotes, p.noVotes, p.exists);

        // Karena 'p' adalah referensi storage, kita perlu memastikan 'exists' dicek
        // jika tidak, kita mungkin membaca data default dari slot storage yang belum diinisialisasi dengan benar
        // sebagai proposal yang valid, meskipun pengecekan exists di struct sudah ada.
        // Namun, karena kita sudah mengecek _proposalId < nextProposalId dan
        // addProposal selalu set exists = true, maka p.exists seharusnya valid.

        id = p.id;
        description = p.description;
        yesVotes = p.yesVotes;
        noVotes = p.noVotes;
        exists = p.exists; // Seharusnya selalu true jika _proposalId valid
    }

    /**
     * @dev Memberikan suara pada sebuah proposal.
     * @param _proposalId ID dari proposal yang akan divote.
     * @param _voteYes Pilihan suara (true untuk Ya, false untuk Tidak).
     */
    function vote(uint _proposalId, bool _voteYes) public {
        // 1. Validasi Proposal
        require(_proposalId < nextProposalId && proposals[_proposalId].exists, "Proposal ID does not exist.");
        
        // Dapatkan referensi ke proposal di storage
        Proposal storage p = proposals[_proposalId];

        // 2. Cek Apakah Sudah Memilih
        require(!p.voters[msg.sender], "You have already voted on this proposal.");

        // 3. (Opsional) Validasi Pemilih yang Sah - Diabaikan untuk versi ini

        // 4. Catat Suara
        if (_voteYes) {
            p.yesVotes++;
        } else {
            p.noVotes++;
        }
        p.voters[msg.sender] = true; // Tandai bahwa msg.sender sudah memilih

        // 5. Emit Event
        emit Voted(_proposalId, msg.sender, _voteYes);
    }

    /**
     * @dev Memeriksa apakah sebuah alamat sudah memberikan suara pada proposal tertentu.
     * @param _proposalId ID dari proposal.
     * @param _voter Alamat yang ingin diperiksa.
     * @return bool Mengembalikan true jika sudah vote, false jika belum.
     */
    function hasVoted(uint _proposalId, address _voter) public view returns (bool) {
        require(_proposalId < nextProposalId && proposals[_proposalId].exists, "Proposal ID does not exist.");
        return proposals[_proposalId].voters[_voter];
    }
}