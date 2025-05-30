// frontend/app.js

// Alamat kontrak (akan kita dapatkan setelah deployment ke Hardhat Network atau Testnet)
// Untuk sekarang, kita bisa isi dengan placeholder atau biarkan kosong dulu
// dan isi setelah kita deploy kontrak dari Hardhat.
const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; 

// ABI (Application Binary Interface) Kontrak Voting
// Ini perlu Anda salin dari file artifacts/contracts/Voting.sol/Voting.json
// setelah kompilasi kontrak dengan Hardhat.
// Contoh struktur (Anda perlu mengganti ini dengan ABI sebenarnya):
const contractABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "proposalId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "description",
          "type": "string"
        }
      ],
      "name": "ProposalCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "proposalId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "voter",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "voteYes",
          "type": "bool"
        }
      ],
      "name": "Voted",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_description",
          "type": "string"
        }
      ],
      "name": "addProposal",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_proposalId",
          "type": "uint256"
        }
      ],
      "name": "getProposalDetails",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "description",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "yesVotes",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "noVotes",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "exists",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getProposalsCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_proposalId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "_voter",
          "type": "address"
        }
      ],
      "name": "hasVoted",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "nextProposalId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "proposals",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "description",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "yesVotes",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "noVotes",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "exists",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_proposalId",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "_voteYes",
          "type": "bool"
        }
      ],
      "name": "vote",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
];

// Variabel global untuk provider, signer, dan instance kontrak
let provider;
let signer;
let votingContract;
let userAddress;
let contractOwner; // Kita akan coba dapatkan owner kontrak nanti

// Elemen UI
const connectWalletBtn = document.getElementById('connectWalletBtn');
const walletStatus = document.getElementById('walletStatus');
const networkStatusDiv = document.getElementById('networkStatus');
const networkNameSpan = document.getElementById('networkName');
const accountInfoDiv = document.getElementById('accountInfo');
const signerAddressSpan = document.getElementById('signerAddress');
const appArea = document.getElementById('appArea');
const adminArea = document.getElementById('adminArea');
const proposalsListDiv = document.getElementById('proposalsList');
const loadingProposalsP = document.getElementById('loadingProposals');
const proposalDescriptionInput = document.getElementById('proposalDescription');
const addProposalBtn = document.getElementById('addProposalBtn');
const statusMessagesDiv = document.getElementById('statusMessages');


// Fungsi untuk menginisialisasi aplikasi setelah wallet terhubung
async function initializeApp() {
    if (!contractAddress || contractABI.length === 0) {
        statusMessagesDiv.textContent = "Error: Alamat kontrak atau ABI belum dikonfigurasi di app.js!";
        statusMessagesDiv.classList.remove('hidden');
        return;
    }

    try {
        // Buat instance kontrak
        votingContract = new ethers.Contract(contractAddress, contractABI, signer || provider);
        console.log("Voting Contract instance:", votingContract);

        // Dapatkan owner kontrak (jika belum ada)
        if (!contractOwner) {
            contractOwner = await votingContract.owner(); // Asumsi 'owner' adalah variabel public di kontrak
            console.log("Contract owner:", contractOwner);
        }

        // Tampilkan area aplikasi utama
        appArea.classList.remove('hidden');
        
        // Tampilkan area admin jika signer adalah owner kontrak
        if (userAddress && contractOwner && userAddress.toLowerCase() === contractOwner.toLowerCase()) {
            adminArea.classList.remove('hidden');
        } else {
            adminArea.classList.add('hidden');
        }

        // Muat proposal
        await loadProposals();

    } catch (error) {
        console.error("Error initializing app or contract instance:", error);
        statusMessagesDiv.textContent = `Error inisialisasi aplikasi: ${error.message}`;
        statusMessagesDiv.classList.remove('hidden');
    }
}

// Fungsi untuk menghubungkan ke Wallet MetaMask
async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Minta akses akun
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAddress = accounts[0];
            
            // Inisialisasi ethers provider dan signer
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            
            // Dapatkan info jaringan
            const network = await provider.getNetwork();
            
            // Update UI
            walletStatus.textContent = 'Terhubung!';
            signerAddressSpan.textContent = userAddress;
            networkNameSpan.textContent = network.name + (network.chainId ? ` (Chain ID: ${network.chainId})` : '');
            
            accountInfoDiv.classList.remove('hidden');
            networkStatusDiv.classList.remove('hidden');
            connectWalletBtn.textContent = 'Wallet Terhubung';
            connectWalletBtn.disabled = true;

            statusMessagesDiv.classList.add('hidden'); // Sembunyikan pesan status lama

            // Inisialisasi aplikasi (membuat instance kontrak, memuat proposal, dll.)
            await initializeApp();

            // Listener untuk perubahan akun atau jaringan
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

        } catch (error) {
            console.error("User denied account access or error connecting:", error);
            walletStatus.textContent = `Koneksi Gagal: ${error.message || 'User menolak akses.'}`;
            statusMessagesDiv.textContent = `Koneksi Gagal: ${error.message || 'User menolak akses.'}`;
            statusMessagesDiv.classList.remove('hidden');
        }
    } else {
        walletStatus.textContent = 'MetaMask tidak terdeteksi! Harap install MetaMask.';
        alert('MetaMask tidak terdeteksi! Harap install ekstensi MetaMask.');
    }
}

// Handler jika akun di MetaMask diganti
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // MetaMask terkunci atau tidak ada akun terhubung
        console.log('Please connect to MetaMask.');
        walletStatus.textContent = 'Harap hubungkan ke MetaMask.';
        accountInfoDiv.classList.add('hidden');
        appArea.classList.add('hidden');
        adminArea.classList.add('hidden');
        connectWalletBtn.textContent = 'Hubungkan Wallet MetaMask';
        connectWalletBtn.disabled = false;
        userAddress = null;
        signer = null;
    } else {
        userAddress = accounts[0];
        console.log('Account changed to:', userAddress);
        signerAddressSpan.textContent = userAddress;
        // Re-inisialisasi signer dan aplikasi jika diperlukan
        if (provider) {
            signer = provider.getSigner();
            initializeApp(); // Update tampilan admin dan proposal
        }
    }
}

// Handler jika jaringan di MetaMask diganti
function handleChainChanged(_chainId) {
    console.log('Network changed to chain ID:', _chainId);
    // Biasanya, kita ingin me-reload halaman agar aplikasi mengambil konfigurasi jaringan yang benar
    // atau setidaknya mengupdate info jaringan dan re-inisialisasi kontrak.
    window.location.reload(); 
}

// Event Listener untuk tombol koneksi wallet
if (connectWalletBtn) {
    connectWalletBtn.addEventListener('click', connectWallet);
}

// --- Fungsi-fungsi untuk memuat proposal, menambah proposal, dan vote akan ditambahkan di sini ---
async function loadProposals() {
    // Implementasi akan ditambahkan nanti
    console.log("Fungsi loadProposals dipanggil, implementasi menyusul.");
    proposalsListDiv.innerHTML = "<p>Memuat proposal...</p>"; // Placeholder
}

// Jalankan pengecekan status koneksi awal jika pengguna sudah pernah menghubungkan wallet
// (Ini opsional dan memerlukan penanganan state yang lebih baik jika halaman di-refresh)
// Untuk saat ini, pengguna harus mengklik tombol "Hubungkan Wallet" setiap kali.

console.log("app.js loaded");