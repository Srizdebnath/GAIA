
export interface Project {
  name: string;
  location: string;
  description: string;
  beforeImage: {
    file: File;
    base64: string;
  };
  afterImage: {
    file: File;
    base64: string;
  };
}

export interface AIAnalysisResult {
  score: number;
  analysis: string;
}

export interface ImpactToken {
  id: string;
  projectName: string;
  location: string;
  impactScore: number;
  analysis: string;
  imageUrl: string;
  transactionHash: string;
}
