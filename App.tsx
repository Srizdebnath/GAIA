
import * as React from 'react';
import { Header } from './components/Header';
import { ProjectRegistration } from './components/ProjectRegistration';
import { ImpactAnalysis } from './components/ImpactAnalysis';
import { Gallery } from './components/Gallery';
import type { Project, ImpactToken } from './types';
import { connectWallet } from './services/celoService';

type View = 'register' | 'analyze' | 'gallery';

const App: React.FC = () => {
  const [view, setView] = React.useState<View>('register');
  const [currentProject, setCurrentProject] = React.useState<Project | null>(null);
  const [mintedTokens, setMintedTokens] = React.useState<ImpactToken[]>([]);
  const [connectedAccount, setConnectedAccount] = React.useState<string | null>(null);
  const [connectionError, setConnectionError] = React.useState<string | null>(null);

  const handleConnectWallet = React.useCallback(async () => {
    try {
      setConnectionError(null);
      const account = await connectWallet();
      setConnectedAccount(account);
    } catch (error) {
      console.error(error);
      setConnectionError((error as Error).message || 'Failed to connect wallet.');
    }
  }, []);

  const handleDisconnectWallet = React.useCallback(() => {
    setConnectedAccount(null);
    setConnectionError(null);
  }, []);

  const handleProjectSubmit = React.useCallback((project: Project) => {
    setCurrentProject(project);
    setView('analyze');
  }, []);

  const handleMintingComplete = React.useCallback((token: ImpactToken) => {
    setMintedTokens(prevTokens => [...prevTokens, token]);
    setCurrentProject(null);
    setView('gallery');
  }, []);

  const handleNavigate = React.useCallback((newView: View) => {
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
             <div className="max-w-3xl mx-auto bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
                <strong className="font-bold">Connection Error: </strong>
                <span className="block sm:inline">{connectionError}</span>
             </div>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
