import { createWalletClient, custom, createPublicClient, http, defineChain, decodeEventLog, type Address, type WalletClient } from 'viem';
import { contractAddress, contractAbi } from '../contract';
import type { Project, AIAnalysisResult } from '../types';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const celoSepoliaTestnet = defineChain({
  id: 11142220,
  name: 'Celo Sepolia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Celo Sepolia Testnet',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: { 
      http: [
        'https://forno.celo-sepolia.celo-testnet.org',
        'https://sepolia-forno.celo-testnet.org',
        'https://celo-sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'
      ] 
    },
    public: { 
      http: [
        'https://forno.celo-sepolia.celo-testnet.org',
        'https://sepolia-forno.celo-testnet.org',
        'https://celo-sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'
      ] 
    },
  },
  blockExplorers: {
    default: {
      name: 'Celo Sepolia Testnet Explorer',
      url: 'https://celo-sepolia.blockscout.com/',
    },
  },
  testnet: true,
});

let walletClientInstance: WalletClient | null = null;

export const publicClient = createPublicClient({
  chain: celoSepoliaTestnet,
  transport: http()
});

export const getWalletClient = (): WalletClient => {
    if (!walletClientInstance) throw new Error("Wallet not connected. Please connect your wallet first.");
    return walletClientInstance;
}

export const testNetworkConnection = async () => {
    try {
        const chainId = await publicClient.getChainId();
        console.log('Network connection test successful. Chain ID:', chainId);
        return true;
    } catch (error) {
        console.error('Network connection test failed:', error);
        throw new Error(`Network connection failed: ${(error as Error).message}`);
    }
};

export const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask or a compatible wallet is not installed.');
    }

    await testNetworkConnection();
    
    walletClientInstance = createWalletClient({
        chain: celoSepoliaTestnet,
        transport: custom(window.ethereum)
    });

    const [address] = await walletClientInstance.requestAddresses();

    const chainId = await walletClientInstance.getChainId();
    if (chainId !== celoSepoliaTestnet.id) {
        try {
            await walletClientInstance.switchChain({ id: celoSepoliaTestnet.id });
        } catch (switchError) {
            if ((switchError as any).code === 4902) {
                await walletClientInstance.addChain({ chain: celoSepoliaTestnet });
            } else {
                throw new Error(`Failed to switch to Celo Sepolia Testnet. Please add it to your wallet manually. Error: ${(switchError as Error).message}`);
            }
        }
    }
    return address;
};

export const mintImpactToken = async (project: Project, analysis: AIAnalysisResult, recipientAddress: `0x${string}`) => {
    const walletClient = getWalletClient();
    if (!walletClient) {
        throw new Error('Wallet not connected');
    }

    try {
        await testNetworkConnection();
        
        console.log('Starting minting process...');
        
        const metadata = {
            name: `${project.name} - GAIA Impact Token`,
            description: project.description,
            image: `data:${project.afterImage.mimeType};base64,${project.afterImage.base64}`,
            attributes: [
                { trait_type: "Impact Score", value: analysis.score },
                { trait_type: "Location", value: project.location },
                { trait_type: "AI Analysis", value: analysis.analysis }, 
            ]
        };
       
        const metadataJson = JSON.stringify(metadata);
        const tokenUri = `data:application/json;base64,${btoa(unescape(encodeURIComponent(metadataJson)))}`;
        
        console.log('Token URI created, length:', tokenUri.length);
        console.log('Simulating contract call...');
        const { request } = await publicClient.simulateContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'safeMint',
            args: [recipientAddress, tokenUri],
            account: recipientAddress 
        });

        console.log('Contract simulation successful, sending transaction...');
        const hash = await walletClient.writeContract(request);
        console.log('Transaction sent, hash:', hash);
        
        console.log('Waiting for transaction receipt...');
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log('Transaction confirmed, receipt:', receipt);

        let tokenId = null;
        for (const log of receipt.logs) {
            try {
                const decodedLog = decodeEventLog({
                    abi: contractAbi,
                    data: log.data,
                    topics: log.topics,
                });
                if (decodedLog.eventName === 'Transfer') {
                    const args = decodedLog.args as { from: Address, to: Address, tokenId: bigint };
                    if (args.to.toLowerCase() === recipientAddress.toLowerCase()) {
                        tokenId = args.tokenId.toString();
                        break;
                    }
                }
            } catch (e) {
                // Not a Transfer event from our contract, ignore.
            }
        }

        if (tokenId === null) {
          throw new Error("Could not determine minted Token ID from transaction logs.");
        }

        console.log('Minting completed successfully. Token ID:', tokenId);
        return {
            transactionHash: receipt.transactionHash,
            tokenId: tokenId
        };
        
    } catch (error: any) {
        console.error('Minting failed with detailed error:', error);
        
        if (error.message.includes('HTTP request failed')) {
            throw new Error('Network connection failed. Please check your internet connection and try again. If the problem persists, the Celo network might be experiencing issues.');
        } else if (error.message.includes('insufficient funds')) {
            throw new Error('Insufficient CELO balance to cover transaction fees. Please add more CELO to your wallet.');
        } else if (error.message.includes('User rejected the request')) {
            throw new Error('Transaction was rejected by user.');
        } else if (error.message.includes('execution reverted')) {
             if (error.message.includes("Ownable: caller is not the owner")) {
                throw new Error("Minting failed: Only the contract owner can mint new tokens.");
             }
            throw new Error('Smart contract execution failed. This might be due to contract issues or invalid parameters.');
        } else {
            throw new Error(`Minting failed: ${error.message}`);
        }
    }
};