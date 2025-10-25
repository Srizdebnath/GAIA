import { parseUnits, formatUnits, type Address } from 'viem';
import { publicClient, getWalletClient } from './celoService';
import { marketplaceContractAddress, marketplaceContractAbi, cUSDContractAddress, cUSDContractAbi } from '../marketplace';
import { contractAddress as impactTokenContractAddress, contractAbi as impactTokenContractAbi } from '../contract';
import type { Listing, TokenMetadata } from '../types';

// Utility function to check if marketplace is properly configured
export const isMarketplaceConfigured = (): boolean => {
    return marketplaceContractAddress !== '0x0000000000000000000000000000000000000000';
};

// Utility function to validate marketplace configuration
export const validateMarketplaceConfig = (): { isValid: boolean; error?: string } => {
    if (!isMarketplaceConfigured()) {
        return {
            isValid: false,
            error: 'Marketplace contract address is not configured. Please deploy the contract and update the address in marketplace.ts'
        };
    }
    
    if (marketplaceContractAddress.length !== 42 || !marketplaceContractAddress.startsWith('0x')) {
        return {
            isValid: false,
            error: 'Invalid marketplace contract address format'
        };
    }
    
    return { isValid: true };
};

// Utility function to check if marketplace contract is deployed and accessible
export const checkMarketplaceContract = async (): Promise<{ isAccessible: boolean; error?: string }> => {
    try {
        if (!isMarketplaceConfigured()) {
            return {
                isAccessible: false,
                error: 'Marketplace contract address is not configured'
            };
        }
        
        // Try to read a simple function to check if contract is accessible
        await publicClient.readContract({
            address: marketplaceContractAddress,
            abi: marketplaceContractAbi,
            functionName: 'getListingCount',
        });
        
        return { isAccessible: true };
    } catch (error: any) {
        console.error('Marketplace contract check failed:', error);
        return {
            isAccessible: false,
            error: `Marketplace contract is not accessible: ${error.shortMessage || error.message}`
        };
    }
};

async function approveMarketplaceForAll(spender: Address, contract: Address, abi: any, account: Address) {
    try {
        const walletClient = getWalletClient();
        console.log(`Checking approval status for marketplace ${spender} on contract ${contract} for account ${account}`);
        
        const isApproved = await publicClient.readContract({
            address: contract,
            abi: abi,
            functionName: 'isApprovedForAll',
            args: [account, spender],
        });

        if (isApproved) {
            console.log('Marketplace is already approved for all tokens.');
            return;
        }

        console.log('Approving marketplace for all tokens...');
        const { request } = await publicClient.simulateContract({
            address: contract,
            abi: abi,
            functionName: 'setApprovalForAll',
            args: [spender, true],
            account,
        });
        const hash = await walletClient.writeContract(request);
        await publicClient.waitForTransactionReceipt({ hash });
        console.log('Marketplace approved for all tokens.');
    } catch (error: any) {
        console.error('Failed to approve marketplace:', error);
        const errorMessage = (error.shortMessage || error.message || '').toLowerCase();
        
        if (errorMessage.includes('user rejected')) {
            throw new Error('Marketplace approval was rejected by the user');
        } else {
            throw new Error(`Marketplace approval failed: ${error.shortMessage || error.message}`);
        }
    }
}

async function approveCUSD(spender: Address, account: Address, amount: bigint) {
    try {
        const walletClient = getWalletClient();
        console.log(`Approving ${formatUnits(amount, 18)} cUSD for spender ${spender}`);

        const { request } = await publicClient.simulateContract({
            address: cUSDContractAddress,
            abi: cUSDContractAbi,
            functionName: 'approve',
            args: [spender, amount],
            account,
        });
        const hash = await walletClient.writeContract(request);
        await publicClient.waitForTransactionReceipt({ hash });
        console.log('cUSD approved.');
    } catch (error: any) {
        console.error('Failed to approve cUSD:', error);
        const errorMessage = (error.shortMessage || error.message || '').toLowerCase();
        
        if (errorMessage.includes('insufficient funds')) {
            throw new Error('Insufficient cUSD balance for approval');
        } else if (errorMessage.includes('user rejected')) {
            throw new Error('cUSD approval was rejected by the user');
        } else {
            throw new Error(`cUSD approval failed: ${error.shortMessage || error.message}`);
        }
    }
}

export const listToken = async (nftContractAddress: Address, tokenId: string, priceInCUSD: string, account: Address) => {
    try {
        const walletClient = getWalletClient();
        const priceInWei = parseUnits(priceInCUSD, 18);

        // Validate inputs
        if (priceInWei <= 0n) {
            throw new Error('Price must be greater than zero');
        }

        await approveMarketplaceForAll(marketplaceContractAddress, nftContractAddress, impactTokenContractAbi, account);

        console.log('Listing token...');
        const { request } = await publicClient.simulateContract({
            address: marketplaceContractAddress,
            abi: marketplaceContractAbi,
            functionName: 'listItem',
            args: [nftContractAddress, BigInt(tokenId), priceInWei],
            account,
        });
        const hash = await walletClient.writeContract(request);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log('Token listed successfully:', receipt);
        return receipt;
    } catch (error: any) {
        console.error('Failed to list token:', error);
        const errorMessage = (error.shortMessage || error.message || '').toLowerCase();
        
        if (errorMessage.includes('you are not the owner')) {
            throw new Error('You are not the owner of this token');
        } else if (errorMessage.includes('contract not approved')) {
            throw new Error('Token approval failed. Please try again.');
        } else if (errorMessage.includes('price must be greater than zero')) {
            throw new Error('Price must be greater than zero');
        } else if (errorMessage.includes('user rejected')) {
            throw new Error('Transaction was rejected by the user');
        } else {
            throw new Error(`Failed to list token: ${error.shortMessage || error.message}`);
        }
    }
};

export const buyToken = async (listing: Listing, account: Address) => {
    try {
        const walletClient = getWalletClient();
        
        // Check if user is trying to buy their own listing
        if (listing.seller.toLowerCase() === account.toLowerCase()) {
            throw new Error('You cannot buy your own listing');
        }
        
        await approveCUSD(marketplaceContractAddress, account, listing.price);

        console.log(`Buying token #${listing.tokenId}...`);
        const { request } = await publicClient.simulateContract({
            address: marketplaceContractAddress,
            abi: marketplaceContractAbi,
            functionName: 'buyItem',
            args: [BigInt(listing.listingId)],
            account,
        });
        const hash = await walletClient.writeContract(request);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log('Token bought successfully:', receipt);
        return receipt;
    } catch (error: any) {
        console.error('Failed to buy token:', error);
        const errorMessage = (error.shortMessage || error.message || '').toLowerCase();
        
        if (errorMessage.includes('you cannot buy your own item')) {
            throw new Error('You cannot buy your own listing');
        } else if (errorMessage.includes('listing is not active')) {
            throw new Error('This listing is no longer active');
        } else if (errorMessage.includes('seller no longer owns')) {
            throw new Error('The seller no longer owns this token');
        } else if (errorMessage.includes('insufficient funds')) {
            throw new Error('Insufficient cUSD balance to complete the purchase');
        } else if (errorMessage.includes('user rejected')) {
            throw new Error('Transaction was rejected by the user');
        } else {
            throw new Error(`Failed to buy token: ${error.shortMessage || error.message}`);
        }
    }
};


export const cancelListing = async (listingId: string, account: Address) => {
    try {
        const walletClient = getWalletClient();
        console.log(`Cancelling listing #${listingId}...`);
        const { request } = await publicClient.simulateContract({
            address: marketplaceContractAddress,
            abi: marketplaceContractAbi,
            functionName: 'cancelListing',
            args: [BigInt(listingId)],
            account,
        });
        const hash = await walletClient.writeContract(request);
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log('Listing cancelled:', receipt);
        return receipt;
    } catch (error: any) {
        console.error('Failed to cancel listing:', error);
        const errorMessage = (error.shortMessage || error.message || '').toLowerCase();
        
        if (errorMessage.includes('you are not the seller')) {
            throw new Error('You are not the seller of this listing');
        } else if (errorMessage.includes('listing is not active')) {
            throw new Error('This listing is no longer active');
        } else if (errorMessage.includes('user rejected')) {
            throw new Error('Transaction was rejected by the user');
        } else {
            throw new Error(`Failed to cancel listing: ${error.shortMessage || error.message}`);
        }
    }
};

export const getActiveListings = async (): Promise<Listing[]> => {
    try {
        const listingCount = await publicClient.readContract({
            address: marketplaceContractAddress,
            abi: marketplaceContractAbi,
            functionName: 'getListingCount',
        }) as bigint;

        if (listingCount === 0n) return [];

        const listingPromises: Promise<Listing | null>[] = [];
        for (let i = 0n; i < listingCount; i++) {
            listingPromises.push(
                (async () => {
                    try {
                        const listingResult = await publicClient.readContract({
                            address: marketplaceContractAddress,
                            abi: marketplaceContractAbi,
                            functionName: 'listings',
                            args: [i],
                        }) as readonly [bigint, `0x${string}`, bigint, `0x${string}`, bigint, boolean];

                        const isActive = listingResult[5];
                        if (!isActive) return null;

                        const tokenId = listingResult[2].toString();
                        const nftAddress = listingResult[1];
                        
                        const tokenUri = await publicClient.readContract({
                            address: nftAddress,
                            abi: impactTokenContractAbi,
                            functionName: 'tokenURI',
                            args: [BigInt(tokenId)],
                        }) as string;

                        // Decode base64 URI
                        const base64String = tokenUri.split(',')[1];
                        if (!base64String) {
                            console.warn(`Invalid token URI format for token ${tokenId}`);
                            return null;
                        }
                        
                        const metadataJson = decodeURIComponent(escape(atob(base64String)));
                        const metadata: TokenMetadata = JSON.parse(metadataJson);

                        const tokenData = {
                            projectName: metadata.name,
                            location: metadata.attributes.find(a => a.trait_type === "Location")?.value || 'N/A',
                            impactScore: Number(metadata.attributes.find(a => a.trait_type === "Impact Score")?.value || 0),
                            analysis: metadata.attributes.find(a => a.trait_type === "AI Analysis")?.value || 'N/A',
                            imageUrl: metadata.image,
                        };

                        return {
                            listingId: listingResult[0].toString(),
                            nftAddress: nftAddress,
                            tokenId: tokenId,
                            seller: listingResult[3],
                            price: listingResult[4],
                            tokenData: tokenData,
                        };
                    } catch (error) {
                        console.warn(`Failed to fetch listing ${i}:`, error);
                        return null;
                    }
                })()
            );
        }
        
        const listings = await Promise.all(listingPromises);
        return listings.filter(l => l !== null) as Listing[];

    } catch (error) {
        console.error("Failed to fetch active listings:", error);
        // This can happen if the marketplace contract address is incorrect or not deployed.
        return [];
    }
};