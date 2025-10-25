
import * as React from 'react';
import type { ImpactToken } from '../types';

interface GalleryProps {
  tokens: ImpactToken[];
}

const TokenCard: React.FC<{ token: ImpactToken }> = ({ token }) => (
    <div className="bg-mid-purple/50 border border-light-purple/30 rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
        <img src={token.imageUrl} alt={token.projectName} className="w-full h-48 object-cover" />
        <div className="p-4">
            <h3 className="text-lg font-bold text-white">{token.projectName}</h3>
            <p className="text-sm text-gray-400 mb-2">{token.location}</p>
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-celo-green">Impact Score</span>
                <span className="px-2 py-1 bg-celo-green/20 text-celo-green text-xs font-bold rounded">{token.impactScore}</span>
            </div>
            <p className="text-sm text-gray-300 h-20 overflow-y-auto pr-2">{token.analysis}</p>
            <div className="mt-4 pt-3 border-t border-light-purple/20">
                <a 
                  href={`https://celo-sepolia.blockscout.com/tx/${token.transactionHash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-celo-gold hover:underline truncate"
                >
                  Tx: {token.transactionHash}
                </a>
            </div>
        </div>
    </div>
);

export const Gallery: React.FC<GalleryProps> = ({ tokens }) => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white">Ecological Impact Gallery</h1>
        <p className="mt-4 text-lg text-gray-300">A collection of verifiably positive environmental projects, tokenized on Celo.</p>
      </div>

      {tokens.length === 0 ? (
        <div className="text-center bg-mid-purple/50 p-12 rounded-lg">
          <h2 className="text-2xl font-semibold text-white">The gallery is empty.</h2>
          <p className="text-gray-400 mt-2">Register a project and mint your first Impact Token to see it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {tokens.map(token => (
            <TokenCard key={token.id} token={token} />
          ))}
        </div>
      )}
    </div>
  );
};
