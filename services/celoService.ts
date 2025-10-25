import { createWalletClient, custom, createPublicClient, http, defineChain, decodeEventLog, type Address } from 'viem';
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


let walletClient: any;
const publicClient = createPublicClient({
  chain: celoSepoliaTestnet,
  transport: http()
});

export const testNetworkConnection = async () => {
    try {
        const chainId = await publicClient.getChainId();
        console.log('Network connection test successful. Chain ID:', chainId);
        return true;
    } catch (error) {
        console.error('Network connection test failed:', error);
        throw new Error(`Network connection failed: ${error.message}`);
    }
};

export const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask or a compatible wallet is not installed.');
    }
    

    await testNetworkConnection();
    
    walletClient = createWalletClient({
        chain: celoSepoliaTestnet,
        transport: custom(window.ethereum)
    });

    const [address] = await walletClient.requestAddresses();

    const chainId = await walletClient.getChainId();
    if (chainId !== celoSepoliaTestnet.id) {
        try {
            await walletClient.switchChain({ id: celoSepoliaTestnet.id });
        } catch (switchError) {
            if ((switchError as any).code === 4902) {
                await walletClient.addChain({ chain: celoSepoliaTestnet });
            } else {
                throw new Error(`Failed to switch to Celo Sepolia Testnet. Please add it to your wallet manually. Error: ${switchError.message}`);
            }
        }
    }
    return address;
};

export const mintImpactToken = async (project: Project, analysis: AIAnalysisResult, recipientAddress: `0x${string}`) => {
    if (!walletClient) {
        throw new Error('Wallet not connected');
    }

    try {
        await testNetworkConnection();
        
        console.log('Starting minting process...');
        console.log('Contract address:', contractAddress);
        console.log('Recipient address:', recipientAddress);

        
        const contractOwnerResult = await publicClient.call({
            to: contractAddress,
            data: '0x8da5cb5b' 
        });
        
        
        const contractOwnerData = contractOwnerResult?.data || '0x';
        const ownerAddress = `0x${contractOwnerData.slice(-40)}` as `0x${string}`;
        
        console.log('Contract owner:', ownerAddress);
        console.log('Connected account:', recipientAddress);
        
        
        if (ownerAddress.toLowerCase() !== recipientAddress.toLowerCase()) {
            throw new Error(`Only the contract owner can mint tokens. Contract owner: ${ownerAddress}, Connected account: ${recipientAddress}. Please connect with the contract owner's wallet.`);
        }

        
        const metadata = {
            name: `${project.name} - GAIA Impact Token`,
            description: project.description,
            image: `data:${project.afterImage.file.type};base64,${project.afterImage.base64}`,
            attributes: [
                { trait_type: "Impact Score", value: analysis.score },
                { trait_type: "Location", value: project.location },
                { trait_type: "AI Analysis", value: analysis.analysis.substring(0, 200) + "..." }, 
            ]
        };

       
        const metadataJson = JSON.stringify(metadata);
        const metadataSize = new Blob([metadataJson]).size;
        
        console.log('Metadata size:', metadataSize, 'bytes');
        
        let tokenUri: string;
        if (metadataSize > 100000) { 
            console.log('Metadata too large, using simplified version');
            const simplifiedMetadata = {
                name: `${project.name} - GAIA Impact Token`,
                description: project.description.substring(0, 200) + "...",
                image: "https://via.placeholder.com/400x400/4CAF50/FFFFFF?text=GAIA+Impact",
                attributes: [
                    { trait_type: "Impact Score", value: analysis.score },
                    { trait_type: "Location", value: project.location },
                    { trait_type: "AI Analysis", value: "Ecological impact analysis completed" },
                ]
            };
            const simplifiedJson = JSON.stringify(simplifiedMetadata);
            tokenUri = `data:application/json;base64,${btoa(simplifiedJson)}`;
        } else {
            tokenUri = `data:application/json;base64,${btoa(metadataJson)}`;
        }
        
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
        console.log('Processing transaction logs...');
        console.log('Total logs:', receipt.logs.length);
        
        for (let i = 0; i < receipt.logs.length; i++) {
            const log = receipt.logs[i] as any; 
            console.log(`Log ${i}:`, {
                address: log.address,
                topics: log.topics,
                data: log.data
            });
            
            try {
                if (log.address.toLowerCase() === contractAddress.toLowerCase()) {
                    console.log('Found log from our contract, attempting to decode...');
                    if (log.topics && log.topics.length >= 4) {
                        const transferSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
                        
                        if (log.topics[0] === transferSignature) {
                            console.log('Found Transfer event!');
                            const fromAddress = `0x${log.topics[1].slice(-40)}`;
                            const toAddress = `0x${log.topics[2].slice(-40)}`;
                            const tokenIdHex = log.topics[3];
                            const tokenIdBigInt = BigInt(tokenIdHex);
                            
                            console.log('Transfer details:', {
                                from: fromAddress,
                                to: toAddress,
                                tokenId: tokenIdBigInt.toString()
                            });
                            if (toAddress.toLowerCase() === recipientAddress.toLowerCase()) {
                                tokenId = tokenIdBigInt.toString();
                                console.log('Found matching token ID:', tokenId);
                                break;
                            }
                        }
                    }
                    try {
                        const decodedLog = decodeEventLog({ 
                            abi: contractAbi, 
                            data: log.data,
                            topics: log.topics || []
                        });
                        
                        console.log('Decoded log:', decodedLog);
                        
                        if ((decodedLog as any).eventName === 'Transfer') {
                            const args = decodedLog.args as any;
                            if (args && args.to && args.tokenId) {
                                console.log('Transfer args:', args);
                                if (args.to.toLowerCase() === recipientAddress.toLowerCase()) {
                                    tokenId = args.tokenId.toString();
                                    console.log('Found token ID via ABI decode:', tokenId);
                                    break;
                                }
                            }
                        }
                    } catch (abiError) {
                        console.log('ABI decode failed:', abiError);
                    }
                }
            } catch (e) {
                console.log('Failed to process log:', e);
            }
        }
        if (tokenId === null) {
            console.log('Token ID not found in logs, trying alternative method...');
            try {
                const totalSupplyResult = await publicClient.call({
                    to: contractAddress,
                    data: '0x18160ddd'
                });
                
                if (totalSupplyResult?.data) {
                    const totalSupply = BigInt(totalSupplyResult.data);
                    console.log('Total supply:', totalSupply.toString());
                    
                    if (totalSupply > 0n) {
                        tokenId = (totalSupply - 1n).toString();
                        console.log('Using calculated token ID:', tokenId);
                    }
                }
            } catch (supplyError) {
                console.log('Failed to get total supply:', supplyError);
            }
        }

        console.log('Minting completed successfully. Token ID:', tokenId);
        return {
            transactionHash: receipt.transactionHash,
            tokenId: tokenId
        };
        
    } catch (error) {
        console.error('Minting failed with detailed error:', error);
        
        if (error.message.includes('HTTP request failed')) {
            throw new Error('Network connection failed. Please check your internet connection and try again. If the problem persists, the Celo network might be experiencing issues.');
        } else if (error.message.includes('insufficient funds')) {
            throw new Error('Insufficient CELO balance to cover transaction fees. Please add more CELO to your wallet.');
        } else if (error.message.includes('user rejected')) {
            throw new Error('Transaction was rejected by user.');
        } else if (error.message.includes('execution reverted')) {
            throw new Error('Smart contract execution failed. This might be due to contract issues or invalid parameters.');
        } else if (error.message.includes('Only the contract owner')) {
            throw error;
        } else {
            throw new Error(`Minting failed: ${error.message}`);
        }
    }
};