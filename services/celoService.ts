
import { createWalletClient, custom, createPublicClient, http, defineChain, parseEventLogs, type Address, type WalletClient } from 'viem';
import { contractAddress, contractAbi } from '../contract';
import type { Project, AIAnalysisResult } from '../types';

declare global {
  interface Window {
    ethereum?: any;
  }
}

// FIX: Add `as const` to the end of the chain definition to ensure
// TypeScript infers the most specific types for the chain properties,
// which is crucial for viem's type inference to work correctly.
// This resolves both the "Type instantiation is excessively deep" error
// and the downstream "authorizationList is missing" errors.
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
} as const);

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
        
        const MAX_ANALYSIS_LENGTH = 500;
        const MAX_DESC_LENGTH = 250;

        const truncatedAnalysis = analysis.analysis.length > MAX_ANALYSIS_LENGTH 
            ? analysis.analysis.substring(0, MAX_ANALYSIS_LENGTH - 3) + '...' 
            : analysis.analysis;

        const truncatedDescription = project.description.length > MAX_DESC_LENGTH
            ? project.description.substring(0, MAX_DESC_LENGTH - 3) + '...'
            : project.description;

        const metadata = {
            name: `${project.name} - GAIA Impact Token`,
            description: truncatedDescription,
            image: `data:${project.afterImage.mimeType};base64,${project.afterImage.base64}`,
            attributes: [
                { trait_type: "Impact Score", value: analysis.score },
                { trait_type: "Location", value: project.location },
                { trait_type: "AI Analysis", value: truncatedAnalysis }, 
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
        // FIX: The previous log decoding implementation using `decodeEventLog` had type errors with viem's Log type.
        // `parseEventLogs` is a safer and cleaner way to get typed event logs from a transaction receipt.
        // It will only return logs that match the ABI and event name, avoiding the need for a try-catch block.
        const transferEvents = parseEventLogs({
            abi: contractAbi,
            logs: receipt.logs,
            eventName: 'Transfer',
        });

        for (const log of transferEvents) {
            // Since we are filtering by eventName, we know `args` for the Transfer event will be present.
            if (log.args.to.toLowerCase() === recipientAddress.toLowerCase()) {
                tokenId = log.args.tokenId.toString();
                break; // Found the token minted to our recipient.
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
        
        const errorMessage = (error.shortMessage || error.message || '').toLowerCase();

        if (errorMessage.includes('http') || errorMessage.includes('content too large') || errorMessage.includes('413') || errorMessage.includes('size') || errorMessage.includes('missing or invalid parameters')) {
            throw new Error('Minting failed because the transaction data is too large. This is usually caused by a very detailed image. Please try again with a different or simpler "After Project" image.');
        } else if (errorMessage.includes('insufficient funds')) {
            throw new Error('Insufficient CELO balance to cover transaction fees. Please add more CELO to your wallet.');
        } else if (errorMessage.includes('user rejected the request')) {
            throw new Error('Transaction was rejected by the user.');
        } else if (errorMessage.includes('execution reverted')) {
             if (errorMessage.includes("ownable: caller is not the owner")) {
                throw new Error("Minting failed: Only the contract owner can mint new tokens.");
             }
            throw new Error('Smart contract execution failed. This might be due to contract issues or invalid parameters.');
        } else {
            throw new Error(`Minting failed: ${error.shortMessage || error.message}`);
        }
    }
};
