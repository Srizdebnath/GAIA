
import { parseUnits, formatUnits, type Address } from 'viem';
import { publicClient, getWalletClient } from './celoService';
import { marketplaceContractAddress, marketplaceContractAbi, cUSDContractAddress, cUSDContractAbi } from '../marketplace';
import { contractAddress as impactTokenContractAddress, contractAbi as impactTokenContractAbi } from '../contract';
import type { Listing, TokenMetadata } from '../types';

async function approveToken(spender: Address, contract: Address, abi: any, account: Address, tokenId: string) {
    const walletClient = getWalletClient();
    console.log(`Approving token ${tokenId} for spender ${spender}`);

    const { request } = await publicClient.simulateContract({
        address: contract,
        abi: abi,
        functionName: 'approve',
        args: [spender, BigInt(tokenId)],
        account,
    });
    const hash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`Token ${tokenId} approved.`);
}

async function approveCUSD(spender: Address, account: Address, amount: bigint) {
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
}

export const listToken = async (nftContractAddress: Address, tokenId: string, priceInCUSD: string, account: Address) => {
    const walletClient = getWalletClient();
    const priceInWei = parseUnits(priceInCUSD, 18);

    await approveToken(marketplaceContractAddress, nftContractAddress, impactTokenContractAbi, account, tokenId);

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
};

export const buyToken = async (listing: Listing, account: Address) => {
    const walletClient = getWalletClient();
    
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
};


export const cancelListing = async (listingId: string, account: Address) => {
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
                    const listingResult = await publicClient.readContract({
                        address: marketplaceContractAddress,
                        abi: marketplaceContractAbi,
                        functionName: 'listings',
                        args: [i],
                    }) as any[]; // [listingId, nftAddress, tokenId, seller, price, active]

                    const isActive = listingResult[5];
                    if (!isActive) return null;

                    const tokenId = listingResult[2].toString();
                    const nftAddress = listingResult[1];
                    
                    const tokenUri = await publicClient.readContract({
                        address: nftAddress,
                        abi: impactTokenContractAbi,
                        functionName: 'tokenURI',
                        args: [BigInt(tokenId)]
                    }) as string;

                    // Decode base64 URI
                    const base64String = tokenUri.split(',')[1];
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
