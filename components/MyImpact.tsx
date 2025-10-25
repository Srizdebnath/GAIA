
import * as React from 'react';
import type { ImpactToken } from '../types';

interface MyImpactProps {
  tokens: ImpactToken[];
  onListToken: (token: ImpactToken, price: string) => void;
}

const TokenCard: React.FC<{ token: ImpactToken; onListClick: () => void }> = ({ token, onListClick }) => (
    <div className="bg-mid-purple/50 border border-light-purple/30 rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 flex flex-col">
        <img src={token.imageUrl} alt={token.projectName} className="w-full h-48 object-cover" />
        <div className="p-4 flex flex-col flex-grow">
            <h3 className="text-lg font-bold text-white">{token.projectName} (ID: {token.id})</h3>
            <p className="text-sm text-gray-400 mb-2">{token.location}</p>
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-celo-green">Impact Score</span>
                <span className="px-2 py-1 bg-celo-green/20 text-celo-green text-xs font-bold rounded">{token.impactScore}</span>
            </div>
            <p className="text-sm text-gray-300 h-20 overflow-y-auto pr-2 flex-grow">{token.analysis}</p>
            <div className="mt-4 pt-3 border-t border-light-purple/20">
                <button 
                    onClick={onListClick}
                    className="w-full px-4 py-2 text-sm font-bold text-dark-purple bg-celo-gold rounded-md hover:bg-opacity-90 transition-colors"
                >
                    List for Sale
                </button>
            </div>
        </div>
    </div>
);

const ListModal: React.FC<{token: ImpactToken | null; onClose: () => void; onConfirm: (token: ImpactToken, price: string) => void}> = ({ token, onClose, onConfirm }) => {
    const [price, setPrice] = React.useState('');
    const [error, setError] = React.useState('');

    if (!token) return null;

    const handleConfirm = () => {
        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum <= 0) {
            setError('Please enter a valid price greater than 0.');
            return;
        }
        setError('');
        onConfirm(token, price);
    }
    
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-mid-purple rounded-lg shadow-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-white mb-2">List Impact Token</h2>
                <p className="text-gray-300 mb-4">Set a price in cUSD to list '{token.projectName}' (ID: {token.id}) on the marketplace.</p>
                
                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-celo-green">Price (cUSD)</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <input 
                            type="number" 
                            id="price" 
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="block w-full bg-light-purple/50 border-light-purple rounded-md py-2 px-3 text-white focus:outline-none focus:ring-celo-green focus:border-celo-green"
                            placeholder="0.00"
                        />
                    </div>
                    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                </div>

                <div className="mt-6 flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 text-sm rounded-md text-gray-300 bg-light-purple hover:bg-opacity-80">Cancel</button>
                    <button onClick={handleConfirm} className="px-4 py-2 text-sm rounded-md text-dark-purple bg-celo-gold hover:bg-opacity-90 font-semibold">Confirm Listing</button>
                </div>
            </div>
        </div>
    );
};

export const MyImpact: React.FC<MyImpactProps> = ({ tokens, onListToken }) => {
  const [showModal, setShowModal] = React.useState(false);
  const [selectedToken, setSelectedToken] = React.useState<ImpactToken | null>(null);

  const handleOpenModal = (token: ImpactToken) => {
    setSelectedToken(token);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedToken(null);
    setShowModal(false);
  };

  const handleConfirmListing = (token: ImpactToken, price: string) => {
    onListToken(token, price);
    handleCloseModal();
  };

  return (
    <div className="max-w-6xl mx-auto">
      {showModal && <ListModal token={selectedToken} onClose={handleCloseModal} onConfirm={handleConfirmListing} />}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white">My Impact Portfolio</h1>
        <p className="mt-4 text-lg text-gray-300">View your collection of owned Impact Tokens and list them on the marketplace.</p>
      </div>

      {tokens.length === 0 ? (
        <div className="text-center bg-mid-purple/50 p-12 rounded-lg">
          <h2 className="text-2xl font-semibold text-white">Your portfolio is empty.</h2>
          <p className="text-gray-400 mt-2">Register a project to mint your first Impact Token, or buy one from the marketplace.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {tokens.map(token => (
            <TokenCard key={token.id} token={token} onListClick={() => handleOpenModal(token)} />
          ))}
        </div>
      )}
    </div>
  );
};
