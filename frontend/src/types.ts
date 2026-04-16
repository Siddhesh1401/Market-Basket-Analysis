export type Rule = {
  antecedent: string;
  consequent: string;
  support: number;
  confidence: number;
  lift: number;
};

export type Itemset = {
  items: string;
  count: number;
  support: number;
};

export type AnalysisResult = {
  totalRows: number;
  totalTransactions: number;
  uniqueItems: number;
  uniqueCountries: number;
  topItemsets: Itemset[];
  rules: Rule[];
  itemFrequency: Array<{ item: string; count: number }>;
  heatmapItems: string[];
  heatmapMatrix: number[][];
  monthlyTransactions: Array<{ month: string; transactions: number }>;
  countryDistribution: Array<{ name: string; value: number }>;
};

export type MiningAlgorithm = "apriori" | "fpgrowth";

export type AnalysisParams = {
  algorithm: MiningAlgorithm;
  minSupport: number;
  minConfidence: number;
  minLift: number;
  topN: number;
};
