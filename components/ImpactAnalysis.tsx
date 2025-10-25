
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
          project.beforeImage.file.type,
          project.afterImage.base64,
          project.afterImage.file.type
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
            imageUrl: URL.createObjectURL(project.afterImage.file),
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-lg font-semibold text-celo-green text-center mb-2">Before</h3>
              <img src={URL.createObjectURL(project.beforeImage.file)} alt="Before" className="rounded-lg shadow-lg w-full" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-celo-green text-center mb-2">After</h3>
              <img src={URL.createObjectURL(project.afterImage.file)} alt="After" className="rounded-lg shadow-lg w-full" />
            </div>
        </div>

        <div className="text-center bg-dark-purple p-6 rounded-lg border border-light-purple/30">
          <h2 className="text-2xl font-bold text-white mb-4">Ecological Impact Score</h2>
          <div className="relative w-40 h-40 mx-auto">
            <svg className="w-full h-full" viewBox="0 0 36 36">
                <path className="text-light-purple/50" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2"></path>
                <path className="text-celo-gold" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray={`${analysisResult.score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"></path>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-white">{analysisResult.score}</span>
            </div>
          </div>
          <p className="mt-4 text-gray-300 max-w-2xl mx-auto">{analysisResult.analysis}</p>
        </div>

        <div className="pt-4">
          <button
            onClick={handleMint}
            disabled={status === 'minting' || status === 'success' || !connectedAccount}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-dark-purple bg-celo-gold hover:bg-opacity-90 disabled:bg-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-purple focus:ring-celo-gold transition-all duration-300"
          >
            {status === 'minting' && <Loader small={true}/>}
            {status === 'minting' ? 'Minting on Celo...' : status === 'success' ? 'Success! Redirecting...' : 'Mint Impact Token'}
          </button>
        </div>
      </div>
    </div>
  );
};
