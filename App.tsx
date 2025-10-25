
import * as React from 'react';
import { Header } from './components/Header';
import { ProjectRegistration } from './components/ProjectRegistration';
import { ImpactAnalysis } from './components/ImpactAnalysis';
import { Gallery } from './components/Gallery';
import { Marketplace } from './components/Marketplace';
import { MyImpact } from './components/MyImpact';

import type { Project, ImpactToken, Listing } from './types';
import { connectWallet } from './services/celoService';
import { listToken, buyToken } from './services/marketplaceService';
import { contractAddress as impactTokenContractAddress } from './contract';
import { marketplaceContractAddress } from './marketplace';

type View = 'register' | 'analyze' | 'gallery' | 'marketplace' | 'myimpact';

const App: React.FC = () => {
  const [view, setView] = React.useState<View>('register');
  const [currentProject, setCurrentProject] = React.useState<Project | null>(null);
  const [mintedTokens, setMintedTokens] = React.useState<ImpactToken[]>([]);
  const [myTokens, setMyTokens] = React.useState<ImpactToken[]>([]);
  const [connectedAccount, setConnectedAccount] = React.useState<string | null>(null);
  const [connectionError, setConnectionError] = React.useState<string | null>(null);
  const [appMessage, setAppMessage] = React.useState<{type: 'success' | 'error', text: string} | null>(null);

  const isMarketplaceConfigured = marketplaceContractAddress !== '0x0000000000000000000000000000000000000000';
  const marketplaceNotConfiguredError = 'Marketplace is not configured. The developer needs to deploy the contract and update its address in the marketplace.ts file.';

  const handleConnectWallet = React.useCallback(async () => {
    try {
      setConnectionError(null);
      const account = await connectWallet();
      setConnectedAccount(account);
      // TODO: In a real app, you would fetch the user's tokens from the blockchain here.
    } catch (error) {
      console.error(error);
      setConnectionError((error as Error).message || 'Failed to connect wallet.');
    }
  }, []);

  const handleDisconnectWallet = React.useCallback(() => {
    setConnectedAccount(null);
    setMyTokens([]);
    setConnectionError(null);
  }, []);

  const handleProjectSubmit = React.useCallback((project: Project) => {
    setCurrentProject(project);
    setView('analyze');
  }, []);

  const handleMintingComplete = React.useCallback((token: ImpactToken) => {
    setMintedTokens(prevTokens => [...prevTokens, token]);
    setMyTokens(prevTokens => [...prevTokens, token]);
    setCurrentProject(null);
    setView('myimpact');
    setAppMessage({ type: 'success', text: 'Impact Token successfully minted!' });
  }, []);

  const handleListToken = async (token: ImpactToken, price: string) => {
    if (!isMarketplaceConfigured) {
      setAppMessage({ type: 'error', text: marketplaceNotConfiguredError });
      return;
    }
    if (!connectedAccount) return;
    try {
      setAppMessage(null);
      await listToken(impactTokenContractAddress, token.id, price, connectedAccount as `0x${string}`);
      setMyTokens(myTokens.filter(t => t.id !== token.id));
      setAppMessage({ type: 'success', text: `Token #${token.id} listed for sale successfully!` });
    } catch (error) {
      console.error(error);
      setAppMessage({ type: 'error', text: (error as Error).message });
    }
  };

  const handleBuyToken = async (listing: Listing) => {
    if (!isMarketplaceConfigured) {
      setAppMessage({ type: 'error', text: marketplaceNotConfiguredError });
      return;
    }
    if (!connectedAccount) return;
    try {
      setAppMessage(null);
      await buyToken(listing, connectedAccount as `0x${string}`);
      // This is a simplified state update. In a real app, you'd refetch listings and user's tokens.
      const boughtToken: ImpactToken = {
        ...listing.tokenData,
        id: listing.tokenId,
        transactionHash: '', // We don't have the original mint tx hash here
      };
      setMyTokens(prev => [...prev, boughtToken]);
      setView('myimpact');
      setAppMessage({ type: 'success', text: `Successfully purchased Token #${listing.tokenId}!` });
    } catch (error) {
      console.error(error);
      setAppMessage({ type: 'error', text: (error as Error).message });
    }
  };

  const handleNavigate = React.useCallback((newView: View) => {
    setAppMessage(null);
    if (newView === 'register') {
      setCurrentProject(null);
    }
    setView(newView);
  }, []);

  const renderContent = () => {
    switch (view) {
      case 'analyze':
        return currentProject && <ImpactAnalysis project={currentProject} onMintingComplete={handleMintingComplete} connectedAccount={connectedAccount} />;
      case 'gallery':
        return <Gallery tokens={mintedTokens} />;
      case 'marketplace':
        return <Marketplace onBuyToken={handleBuyToken} connectedAccount={connectedAccount} />;
      case 'myimpact':
        return <MyImpact tokens={myTokens} onListToken={handleListToken} />;
      case 'register':
      default:
        return <ProjectRegistration onSubmit={handleProjectSubmit} connectedAccount={connectedAccount} />;
    }
  };

  return (
    <div className="min-h-screen bg-dark-purple text-gray-200 font-sans" style={{
      backgroundImage:
        'linear-gradient(rgba(50, 44, 89, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(50, 44, 89, 0.8) 1px, transparent 1px)',
      backgroundSize: '2rem 2rem',
    }}>
      <div className="backdrop-blur-sm min-h-screen">
        <Header 
          activeView={view} 
          onNavigate={handleNavigate} 
          connectedAccount={connectedAccount} 
          onConnectWallet={handleConnectWallet}
          onDisconnectWallet={handleDisconnectWallet} 
        />
        <main className="container mx-auto px-4 py-8 md:py-12">
          {connectionError && (
             <div className="max-w-4xl mx-auto bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
                <strong className="font-bold">Connection Error: </strong>
                <span className="block sm:inline">{connectionError}</span>
             </div>
          )}
          {appMessage && (
             <div className={`max-w-4xl mx-auto ${appMessage.type === 'success' ? 'bg-celo-green/20 border-celo-green text-celo-green' : 'bg-red-900/50 border-red-500 text-red-300'} border px-4 py-3 rounded-lg relative mb-6`} role="alert">
                <span className="block sm:inline">{appMessage.text}</span>
             </div>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
