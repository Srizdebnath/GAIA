
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

export interface TokenMetadata {
    name: string;
    description: string;
    image: string;
    attributes: Array<{trait_type: string, value: any}>;
}

export interface Listing {
  listingId: string;
  nftAddress: `0x${string}`;
  tokenId: string;
  seller: `0x${string}`;
  price: bigint; // Price in wei (or equivalent for cUSD)
  tokenData: {
    projectName: string;
    location: string;
    impactScore: number;
    analysis: string;
    imageUrl: string;
  }
}
