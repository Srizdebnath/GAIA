import * as React from 'react';
import type { Listing } from '../types';
import { getActiveListings, isMarketplaceConfigured } from '../services/marketplaceService';
import { Loader } from './Loader';
import { formatUnits } from 'viem';

interface MarketplaceProps {
  onBuyToken: (listing: Listing) => void;
  connectedAccount: string | null;
}

// FIX: Added `connectedAccount` to props to resolve scope error.
const ListingCard: React.FC<{ listing: Listing; onBuy: () => void; isOwner: boolean; connectedAccount: string | null; }> = ({ listing, onBuy, isOwner, connectedAccount }) => (
    <div className="bg-mid-purple/50 border border-light-purple/30 rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 flex flex-col">
        <img src={listing.tokenData.imageUrl} alt={listing.tokenData.projectName} className="w-full h-48 object-cover" />
        <div className="p-4 flex flex-col flex-grow">
            <h3 className="text-lg font-bold text-white">{listing.tokenData.projectName} (ID: {listing.tokenId})</h3>
            <p className="text-sm text-gray-400 mb-2">{listing.tokenData.location}</p>
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-celo-green">Impact Score</span>
                <span className="px-2 py-1 bg-celo-green/20 text-celo-green text-xs font-bold rounded">{listing.tokenData.impactScore}</span>
            </div>
            <p className="text-sm text-gray-300 h-20 overflow-y-auto pr-2 flex-grow">{listing.tokenData.analysis}</p>
            <div className="mt-4 pt-3 border-t border-light-purple/20">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-400">Price</p>
                        <p className="text-lg font-bold text-celo-gold">{formatUnits(listing.price, 18)} cUSD</p>
                    </div>
                     <button 
                        onClick={onBuy}
                        disabled={isOwner || !connectedAccount}
                        className="px-4 py-2 text-sm font-bold text-dark-purple bg-celo-gold rounded-md hover:bg-opacity-90 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                     >
                        {isOwner ? "Your Listing" : "Buy"}
                     </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 truncate">Seller: {listing.seller}</p>
            </div>
        </div>
    </div>
);


export const Marketplace: React.FC<MarketplaceProps> = ({ onBuyToken, connectedAccount }) => {
  const [listings, setListings] = React.useState<Listing[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchListings = async () => {
      if (!isMarketplaceConfigured()) {
        setError('The marketplace contract has not been configured. Please deploy the contract and update the address in `marketplace.ts`.');
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const activeListings = await getActiveListings();
        setListings(activeListings);
      } catch (err) {
        setError((err as Error).message);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchListings();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white">Impact Token Marketplace</h1>
        <p className="mt-4 text-lg text-gray-300">Purchase verified "Proof of Impact" tokens to support regenerative projects.</p>
      </div>

      {isLoading && <Loader text="Loading marketplace listings..." />}
      {error && <div className="text-center text-yellow-300 bg-yellow-900/50 border border-yellow-500 p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Marketplace Notice</h2>
          <p className="break-words">{error}</p>
        </div>}

      {!isLoading && !error && listings.length === 0 && (
        <div className="text-center bg-mid-purple/50 p-12 rounded-lg">
          <h2 className="text-2xl font-semibold text-white">The marketplace is empty.</h2>
          <p className="text-gray-400 mt-2">No Impact Tokens are currently listed for sale.</p>
        </div>
      )}
      
      {!isLoading && !error && listings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {listings.map(listing => (
            <ListingCard 
              key={listing.listingId} 
              listing={listing} 
              onBuy={() => onBuyToken(listing)}
              isOwner={!!connectedAccount && listing.seller.toLowerCase() === connectedAccount.toLowerCase()}
              // FIX: Pass `connectedAccount` prop to `ListingCard`.
              connectedAccount={connectedAccount}
            />
          ))}
        </div>
      )}
    </div>
  );
};