
import * as React from 'react';

const CeloLogo: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#35D07F" strokeWidth="2" />
    <path d="M16 8C16 10.2091 14.2091 12 12 12C9.79086 12 8 13.7909 8 16" stroke="#FBCC5C" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

interface HeaderProps {
    activeView: 'register' | 'analyze' | 'gallery';
    onNavigate: (view: 'register' | 'gallery') => void;
    connectedAccount: string | null;
    onConnectWallet: () => void;
    onDisconnectWallet: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeView, onNavigate, connectedAccount, onConnectWallet, onDisconnectWallet }) => {

  const getLinkClass = (view: 'register' | 'gallery') => {
    return `cursor-pointer transition-colors duration-300 ${activeView === view ? 'text-celo-green font-semibold' : 'text-gray-400 hover:text-white'}`;
  }

  return (
    <header className="bg-dark-purple/50 backdrop-blur-lg border-b border-light-purple/20 sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <CeloLogo />
            <span className="text-xl font-bold text-white">Project GAIA</span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <a onClick={() => onNavigate('register')} className={getLinkClass('register')}>Register Project</a>
            <a onClick={() => onNavigate('gallery')} className={getLinkClass('gallery')}>Impact Gallery</a>
          </div>
          <button
            onClick={connectedAccount ? onDisconnectWallet : onConnectWallet}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ease-in-out border
            ${
              connectedAccount
                ? 'bg-mid-purple hover:bg-light-purple/50 text-red-400 border-red-600/60 focus:ring-red-500'
                : 'bg-light-purple hover:bg-opacity-80 text-white border-celo-green/50 focus:ring-celo-green'
            }
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-purple`}
          >
            {connectedAccount ? `Disconnect (...${connectedAccount.slice(-4)})` : 'Connect Wallet'}
          </button>
        </div>
        <div className="md:hidden flex items-center justify-center space-x-8 py-2 border-t border-light-purple/10">
            <a onClick={() => onNavigate('register')} className={getLinkClass('register')}>Register</a>
            <a onClick={() => onNavigate('gallery')} className={getLinkClass('gallery')}>Gallery</a>
        </div>
      </div>
    </header>
  );
};
