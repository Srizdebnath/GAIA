import * as React from 'react';
import { analyzeEcologicalImpact } from '../services/geminiService';
import { mintImpactToken } from '../services/celoService';
import type { Project, AIAnalysisResult, ImpactToken } from '../types';
import { Loader } from './Loader';

interface ImpactAnalysisProps {
  project: Project;
  onMintingComplete: (token: ImpactToken) => void;
  connectedAccount: string | null;
}

type Status = 'analyzing' | 'minting' | 'success' | 'error' | 'idle';

export const ImpactAnalysis: React.FC<ImpactAnalysisProps> = ({ project, onMintingComplete, connectedAccount }) => {
  const [analysisResult, setAnalysisResult] = React.useState<AIAnalysisResult | null>(null);
  const [status, setStatus] = React.useState<Status>('analyzing');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const performAnalysis = async () => {
      setStatus('analyzing');
      setError(null);
      try {
        const result = await analyzeEcologicalImpact(
          project.beforeImage.base64,
          project.beforeImage.mimeType,
          project.afterImage.base64,
          project.afterImage.mimeType
        );
        setAnalysisResult(result);
        setStatus('idle');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred during analysis.');
        setStatus('error');
      }
    };
    performAnalysis();
  }, [project]);

  const handleMint = React.useCallback(async () => {
    if (!analysisResult || !connectedAccount) {
        setError('Wallet not connected or analysis not complete.');
        return;
    };
    setStatus('minting');
    setError(null);
    try {
        const { transactionHash, tokenId } = await mintImpactToken(project, analysisResult, connectedAccount as `0x${string}`);
        
        if (tokenId === null) {
            throw new Error("Could not retrieve Token ID from minting transaction.");
        }
        
        const newToken: ImpactToken = {
            id: tokenId,
            projectName: project.name,
            location: project.location,
            impactScore: analysisResult.score,
            analysis: analysisResult.analysis,
            imageUrl: `data:${project.afterImage.mimeType};base64,${project.afterImage.base64}`,
            transactionHash: transactionHash
        };
        setStatus('success');
        setTimeout(() => onMintingComplete(newToken), 1500);

    } catch (err) {
        console.error(err);
        const shortMessage = (err as any).shortMessage || (err as Error).message;
        setError(`Minting failed: ${shortMessage}`);
        setStatus('error');
    }
  }, [analysisResult, project, onMintingComplete, connectedAccount]);

  const renderError = () => (
    <div className="text-center text-red-300 bg-red-900/50 border border-red-500 p-8 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">An Error Occurred</h2>
      <p className="break-words">{error}</p>
    </div>
  );

  if (status === 'analyzing') {
    return <Loader text="AI is analyzing the ecological impact..." />;
  }
  
  if (status === 'error' && !analysisResult) {
    return renderError();
  }
  
  if (!analysisResult) return null;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white">AI Impact Analysis Complete</h1>
        <p className="mt-4 text-lg text-gray-300">Review the analysis and mint your "Proof of Impact" NFT on the Celo network.</p>
      </div>
      
      {status === 'error' && <div className="my-4">{renderError()}</div>}

      <div className="bg-mid-purple/50 border border-light-purple/30 rounded-lg shadow-2xl p-6 md:p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-celo-green mb-2">Before Project</h3>
              <img src={`data:${project.beforeImage.mimeType};base64,${project.beforeImage.base64}`} alt="Before" className="rounded-lg shadow-md w-full aspect-square object-cover" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-celo-green mb-2">After Project</h3>
              <img src={`data:${project.afterImage.mimeType};base64,${project.afterImage.base64}`} alt="After" className="rounded-lg shadow-md w-full aspect-square object-cover" />
            </div>
            <div className="md:col-span-2 bg-light-purple/30 p-4 rounded-lg">
                <h4 className="font-bold text-white">{project.name}</h4>
                <p className="text-sm text-gray-400">{project.location}</p>
                <p className="text-sm text-gray-300 mt-2">{project.description}</p>
            </div>
          </div>

          <div className="bg-light-purple/30 p-6 rounded-lg flex flex-col justify-between">
            <div>
                <h3 className="text-xl font-bold text-white mb-4">Analysis Result</h3>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-lg text-celo-green">Impact Score</span>
                    <span className="text-4xl font-bold text-celo-gold">{analysisResult.score}</span>
                </div>
                <p className="text-gray-300">{analysisResult.analysis}</p>
            </div>
            <div className="mt-6">
                <button
                    onClick={handleMint}
                    disabled={status === 'minting' || status === 'success' || !connectedAccount}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-dark-purple bg-celo-gold hover:bg-opacity-90 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-purple focus:ring-celo-gold transition-all duration-300"
                >
                    {status === 'minting' && <Loader small />}
                    {status === 'minting' ? 'Minting Token...' : (status === 'success' ? 'Minted!' : 'Mint Impact Token')}
                </button>
                {!connectedAccount && <p className="text-center text-sm text-yellow-400 mt-2">Connect wallet to mint.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
