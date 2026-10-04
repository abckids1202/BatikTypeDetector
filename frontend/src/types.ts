export type Motif = {
  slug: string;
  name: string;
  family: string;
  summary: string;
  visual_signature: string[];
  traditional_associations: string[];
  source_status?: string;
};

export type Prediction = {
  motif: string;
  motif_slug: string;
  probability: number;
};

export type Analysis = {
  analysis_id: string;
  filename: string;
  model_version: string;
  evaluation_status: string;
  known_pattern_probability: number;
  ood_score: number;
  confidence_level: string;
  predictions: Prediction[];
  features: Record<string, number>;
  matches: Array<{
    image_id: string;
    motif: string;
    motif_slug: string;
    similarity: number;
    verification_level: string;
  }>;
  cultural_context: {
    motif: string;
    summary: string;
    visual_signature: string[];
    traditional_associations: string[];
    source_status: string;
  };
};

