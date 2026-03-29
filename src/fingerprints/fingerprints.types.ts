export type FingerprintType =
  | 'Morgan'
  | 'Pattern'
  | 'AtomPair'
  | 'TopologicalTorsion'
  | 'RDKit'
  | 'MACCS';

export type SimilarityMetric = 'tanimoto' | 'dice' | 'cosine' | 'tversky' | 'asymmetric';

/** Options for Tversky similarity. `alpha` weights molecule A's unique bits, `beta` weights molecule B's. */
export type TverskySimilarityOptions = {
  alpha: number;
  beta: number;
};
