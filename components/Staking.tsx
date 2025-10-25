import * as React from 'react';
import { Loader } from './Loader';
import { getWalletClient, publicClient } from '../services/celoService';
import { gaiaTokenContractAddress, gaiaTokenContractAbi } from '../gaiaToken';
import { stakingContractAddress, stakingContractAbi } from '../staking';
import { formatUnits, parseUnits, maxInt256, type Address } from 'viem';

interface StakingProps {
    connectedAccount: string | null;
    setAppMessage: (message: { type: 'success' | 'error', text: string } | null) => void;
}

type StakingMode = 'stake' | 'unstake';

interface StakingStats {
    gaiaBalance: bigint;
    stakedBalance: bigint;
    earnedRewards: bigint;
    totalStaked: bigint;
}

export const Staking: React.FC<StakingProps> = ({ connectedAccount, setAppMessage }) => {
    const [stats, setStats] = React.useState<StakingStats | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isMinting, setIsMinting] = React.useState(false);
    const [isOwner, setIsOwner] = React.useState(false);
    const [mode, setMode] = React.useState<StakingMode>('stake');
    const [amount, setAmount] = React.useState('');

    const fetchData = React.useCallback(async () => {
        if (!connectedAccount) {
            setIsLoading(false);
            return;
        }
        try {
            const account = connectedAccount as Address;
            
            // Replaced multicall with individual calls for better robustness and error handling.
            const [
                gaiaBalance,
                stakedBalance,
                earnedRewards,
                totalStaked,
                owner
            ] = await Promise.all([
                publicClient.readContract({ address: gaiaTokenContractAddress, abi: gaiaTokenContractAbi, functionName: 'balanceOf', args: [account], authorizationList: undefined }),
                publicClient.readContract({ address: stakingContractAddress, abi: stakingContractAbi, functionName: 'stakedBalance', args: [account], authorizationList: undefined }),
                publicClient.readContract({ address: stakingContractAddress, abi: stakingContractAbi, functionName: 'earned', args: [account], authorizationList: undefined }),
                publicClient.readContract({ address: stakingContractAddress, abi: stakingContractAbi, functionName: 'totalStaked', authorizationList: undefined }),
                publicClient.readContract({ address: gaiaTokenContractAddress, abi: gaiaTokenContractAbi, functionName: 'owner', authorizationList: undefined })
            ]);

            setStats({
                gaiaBalance: (gaiaBalance as bigint) ?? 0n,
                stakedBalance: (stakedBalance as bigint) ?? 0n,
                earnedRewards: (earnedRewards as bigint) ?? 0n,
                totalStaked: (totalStaked as bigint) ?? 0n,
            });

            setIsOwner((owner as Address).toLowerCase() === account.toLowerCase());

        } catch (error) {
            console.error("Failed to fetch staking data:", error);
            setAppMessage({ type: 'error', text: 'Could not load staking information.' });
        } finally {
            setIsLoading(false);
        }
    }, [connectedAccount, setAppMessage]);

    React.useEffect(() => {
        setIsLoading(true);
        fetchData();
    }, [fetchData]);

    const handleAction = async () => {
        if (!connectedAccount || !amount || !stats) return;
        
        const amountWei = parseUnits(amount, 18);
        if (amountWei <= 0) {
            setAppMessage({ type: 'error', text: 'Amount must be greater than zero.' });
            return;
        }

        setIsSubmitting(true);
        setAppMessage(null);
        try {
            const walletClient = getWalletClient();
            const account = connectedAccount as Address;

            if (mode === 'stake') {
                if (amountWei > stats.gaiaBalance) {
                    throw new Error("Insufficient GAIA balance.");
                }
                const allowance = await publicClient.readContract({ address: gaiaTokenContractAddress, abi: gaiaTokenContractAbi, functionName: 'allowance', args: [account, stakingContractAddress], authorizationList: undefined });
                if (allowance < amountWei) {
                    setAppMessage({type: 'success', text: 'Please approve the staking contract to spend your GAIA...'})
                    const { request } = await publicClient.simulateContract({ account, address: gaiaTokenContractAddress, abi: gaiaTokenContractAbi, functionName: 'approve', args: [stakingContractAddress, maxInt256] });
                    const hash = await walletClient.writeContract(request);
                    await publicClient.waitForTransactionReceipt({ hash });
                }
                const { request } = await publicClient.simulateContract({ account, address: stakingContractAddress, abi: stakingContractAbi, functionName: 'stake', args: [amountWei] });
                const hash = await walletClient.writeContract(request);
                await publicClient.waitForTransactionReceipt({ hash });
                setAppMessage({ type: 'success', text: 'Successfully staked GAIA!' });
            } else { // unstake
                if (amountWei > stats.stakedBalance) {
                    throw new Error("Insufficient staked balance.");
                }
                const { request } = await publicClient.simulateContract({ account, address: stakingContractAddress, abi: stakingContractAbi, functionName: 'unstake', args: [amountWei] });
                const hash = await walletClient.writeContract(request);
                await publicClient.waitForTransactionReceipt({ hash });
                setAppMessage({ type: 'success', text: 'Successfully unstaked GAIA!' });
            }
            setAmount('');
            fetchData();
        } catch (error: any) {
            const message = error.shortMessage || error.message;
            setAppMessage({ type: 'error', text: `Transaction failed: ${message}` });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleClaim = async () => {
         if (!connectedAccount || !stats || stats.earnedRewards <= 0n) return;
         setIsSubmitting(true);
         setAppMessage(null);
         try {
            const walletClient = getWalletClient();
            const { request } = await publicClient.simulateContract({ account: connectedAccount as Address, address: stakingContractAddress, abi: stakingContractAbi, functionName: 'claimReward' });
            const hash = await walletClient.writeContract(request);
            await publicClient.waitForTransactionReceipt({ hash });
            setAppMessage({ type: 'success', text: 'Rewards claimed successfully!' });
            fetchData();
         } catch (error: any) {
            const message = error.shortMessage || error.message;
            setAppMessage({ type: 'error', text: `Claim failed: ${message}` });
         } finally {
             setIsSubmitting(false);
         }
    }
    
    const handleMint = async () => {
        if (!connectedAccount || !isOwner) return;
        setIsMinting(true);
        setAppMessage(null);
        try {
            const walletClient = getWalletClient();
            const account = connectedAccount as Address;
            const amountToMint = parseUnits('1000', 18);

            const { request } = await publicClient.simulateContract({
                account,
                address: gaiaTokenContractAddress,
                abi: gaiaTokenContractAbi,
                functionName: 'mint',
                args: [account, amountToMint]
            });

            const hash = await walletClient.writeContract(request);
            await publicClient.waitForTransactionReceipt({ hash });
            
            setAppMessage({ type: 'success', text: 'Successfully minted 1,000 GAIA!' });
            fetchData();

        } catch (error: any) {
            const message = error.shortMessage || error.message;
            setAppMessage({ type: 'error', text: `Minting failed: ${message}` });
        } finally {
            setIsMinting(false);
        }
    };


    const StatCard: React.FC<{ title: string; value: string; unit?: string; }> = ({ title, value, unit }) => (
        <div className="bg-mid-purple/50 border border-light-purple/30 rounded-lg p-4">
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value} <span className="text-lg text-celo-green">{unit}</span></p>
        </div>
    );
    
    if (isLoading) return <Loader text="Loading Staking Data..." />;
    
    if (!connectedAccount) {
        return (
            <div className="text-center bg-mid-purple/50 p-12 rounded-lg max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold text-white">Connect Your Wallet</h2>
              <p className="text-gray-400 mt-2">Please connect your wallet to view staking information and manage your GAIA tokens.</p>
            </div>
        );
    }
    
    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-bold text-white">GAIA Governance & Staking</h1>
                <p className="mt-4 text-lg text-gray-300">Stake your GAIA tokens to earn rewards and participate in future governance.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard title="Your GAIA Balance" value={stats ? parseFloat(formatUnits(stats.gaiaBalance, 18)).toFixed(2) : '0.00'} unit="GAIA" />
                <StatCard title="Staked GAIA" value={stats ? parseFloat(formatUnits(stats.stakedBalance, 18)).toFixed(2) : '0.00'} unit="GAIA" />
                <StatCard title="Claimable Rewards" value={stats ? parseFloat(formatUnits(stats.earnedRewards, 18)).toFixed(4) : '0.00'} unit="cUSD" />
                <StatCard title="Total GAIA Staked" value={stats ? parseFloat(formatUnits(stats.totalStaked, 18)).toLocaleString() : '0'} unit="GAIA" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-mid-purple/50 border border-light-purple/30 rounded-lg shadow-2xl p-6">
                    <div className="flex border-b border-light-purple/30 mb-4">
                        <button onClick={() => setMode('stake')} className={`px-4 py-2 text-lg font-semibold transition-colors ${mode === 'stake' ? 'text-celo-green border-b-2 border-celo-green' : 'text-gray-400'}`}>Stake</button>
                        <button onClick={() => setMode('unstake')} className={`px-4 py-2 text-lg font-semibold transition-colors ${mode === 'unstake' ? 'text-celo-green border-b-2 border-celo-green' : 'text-gray-400'}`}>Unstake</button>
                    </div>
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-celo-green">Amount</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <input
                                type="number"
                                id="amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="block w-full bg-light-purple/50 border-light-purple rounded-md py-2 px-3 text-white focus:outline-none focus:ring-celo-green focus:border-celo-green"
                                placeholder="0.0"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center">
                                <button onClick={() => setAmount(formatUnits(mode === 'stake' ? stats?.gaiaBalance ?? 0n : stats?.stakedBalance ?? 0n, 18))} className="px-3 text-sm text-celo-gold hover:text-white">MAX</button>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6">
                        <button onClick={handleAction} disabled={isSubmitting || !amount} className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-dark-purple bg-celo-green hover:bg-opacity-90 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
                            {isSubmitting && <Loader small />}
                            {isSubmitting ? 'Processing...' : (mode === 'stake' ? 'Stake GAIA' : 'Unstake GAIA')}
                        </button>
                    </div>
                </div>
                 <div className="bg-mid-purple/50 border border-light-purple/30 rounded-lg shadow-2xl p-6 flex flex-col justify-center items-center">
                    <h3 className="text-xl font-bold text-white mb-2">Claim Your Rewards</h3>
                    <p className="text-gray-400 text-center mb-4">You have earned cUSD rewards for securing the network. Claim them at any time.</p>
                    <p className="text-4xl font-bold text-celo-gold mb-6">{stats ? parseFloat(formatUnits(stats.earnedRewards, 18)).toFixed(4) : '0.0000'} <span className="text-2xl">cUSD</span></p>
                    <button onClick={handleClaim} disabled={isSubmitting || !stats || stats.earnedRewards <= 0n} className="w-full max-w-xs flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-dark-purple bg-celo-gold hover:bg-opacity-90 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
                         {isSubmitting && <Loader small />}
                         {isSubmitting ? 'Processing...' : 'Claim Rewards'}
                    </button>
                </div>
            </div>
            {isOwner && (
                <div className="mt-8 bg-mid-purple/50 border border-light-purple/30 rounded-lg shadow-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-2">Owner Actions</h3>
                    <p className="text-gray-400 mb-4">As the GAIA token contract owner, you can mint new tokens for testing purposes.</p>
                    <button onClick={handleMint} disabled={isMinting} className="w-full max-w-xs flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-dark-purple bg-celo-gold hover:bg-opacity-90 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
                        {isMinting && <Loader small />}
                        {isMinting ? 'Minting...' : 'Mint 1,000 GAIA'}
                    </button>
                </div>
            )}
        </div>
    );
};