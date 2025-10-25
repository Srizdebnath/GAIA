
import * as React from 'react';
import type { Project } from '../types';
import { ImageUpload } from './ImageUpload';

interface ProjectRegistrationProps {
  onSubmit: (project: Project) => void;
  connectedAccount: string | null;
}

export const ProjectRegistration: React.FC<ProjectRegistrationProps> = ({ onSubmit, connectedAccount }) => {
  const [name, setName] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [beforeImage, setBeforeImage] = React.useState<{ file: File; base64: string } | null>(null);
  const [afterImage, setAfterImage] = React.useState<{ file: File; base64: string } | null>(null);
  const [error, setError] = React.useState('');

  const isFormValid = name && location && description && beforeImage && afterImage;

  const handleSubmit = React.useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setError('Please fill in all fields and upload both images.');
      return;
    }
    if (!connectedAccount) {
      setError('Please connect your wallet to proceed.');
      return;
    }
    setError('');
    onSubmit({
      name,
      location,
      description,
      beforeImage,
      afterImage,
    });
  }, [name, location, description, beforeImage, afterImage, onSubmit, isFormValid, connectedAccount]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white">Verify Your Ecological Impact</h1>
        <p className="mt-4 text-lg text-gray-300">Register your project, upload satellite imagery, and let AI mint a proof-of-impact token on Celo.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-mid-purple/50 border border-light-purple/30 rounded-lg shadow-2xl p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-celo-green">Project Name</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full bg-light-purple/50 border-light-purple rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-celo-green focus:border-celo-green" placeholder="Amazon Reforestation Initiative" />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-celo-green">Location (Lat, Lon)</label>
            <input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 block w-full bg-light-purple/50 border-light-purple rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-celo-green focus:border-celo-green" placeholder="-3.4653, -62.2159" />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-celo-green">Project Description</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 block w-full bg-light-purple/50 border-light-purple rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-celo-green focus:border-celo-green" placeholder="A 5-year project to restore 10,000 hectares of rainforest..."></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ImageUpload label="Before Project" onImageSelect={setBeforeImage} />
          <ImageUpload label="After Project" onImageSelect={setAfterImage} />
        </div>
        
        {!connectedAccount && <p className="text-celo-gold text-sm text-center">Please connect your wallet to register a project.</p>}
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <div className="pt-4">
          <button
            type="submit"
            disabled={!isFormValid || !connectedAccount}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-celo-green hover:bg-opacity-90 disabled:bg-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-purple focus:ring-celo-green transition-all duration-300"
          >
            Analyze Impact
          </button>
        </div>
      </form>
    </div>
  );
};
