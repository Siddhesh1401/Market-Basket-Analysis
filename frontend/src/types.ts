export type Rule = {
  antecedent: string;
  consequent: string;
  support: number;
  confidence: number;
  lift: number;
};

export type CanonicalSchemaField = "invoice" | "item" | "country" | "date" | "time" | "quantity" | "price";

export type ColumnMapping = Partial<Record<CanonicalSchemaField, string>>;

export type SchemaSuggestion = {
  columns: string[];
  sampleRows: Array<Record<string, string>>;
  mapping: Partial<Record<CanonicalSchemaField, string | null>>;
  alternatives: Partial<Record<CanonicalSchemaField, string[]>>;
  fieldConfidence: Partial<Record<CanonicalSchemaField, number>>;
  requiredFields: CanonicalSchemaField[];
  missingRequired: CanonicalSchemaField[];
  overallConfidence: number;
  notes: string[];
  source?: string;
};

export type SchemaSuggestResponse = {
  suggestion: SchemaSuggestion;
  source: string;
  aiApplied: boolean;
  aiConfigured: boolean;
};

export type Recommendation = {
  product: string;
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
  productCatalog?: string[];
  heatmapItems: string[];
  heatmapMatrix: number[][];
  monthlyTransactions: Array<{ month: string; transactions: number }>;
  countryDistribution: Array<{ name: string; value: number }>;
  preprocessing?: {
    rawRows: number;
    cleanedRows: number;
    droppedRows: number;
    removedCancelledInvoices: number;
    removedNoiseItems: number;
    removedNonPositiveQuantity: number;
    removedNonPositivePrice: number;
  };
  suitability?: {
    isSuitable: boolean;
    message: string;
  };
  schema?: {
    mapping?: Partial<Record<CanonicalSchemaField, string | null>>;
    source?: string;
  };
  usedSyntheticTransactions?: boolean;
  transactionInferenceMode?: "native" | "datetime-window" | "row-bucket" | string;
};

export type MiningAlgorithm = "apriori" | "fpgrowth";

export type AnalysisParams = {
  algorithm: MiningAlgorithm;
  minSupport: number;
  minConfidence: number;
  minLift: number;
  topN: number;
};

export type BIKpis = {
  totalTransactions: number;
  totalRows: number;
  uniqueProducts: number;
  totalRevenue: number;
  averageBasketValue: number;
  itemsPerBasket: number;
  repeatPurchaseRate: number | null;
  highLiftRuleCount: number;
  topCrossSellPair: {
    antecedent: string;
    consequent: string;
    lift: number;
    confidence: number;
  } | null;
};

export type BITrendPoint = {
  period: string;
  transactions: number;
  revenue: number;
  avgBasketValue: number;
};

export type BIProductRow = {
  name: string;
  transactionCount: number;
  quantity: number;
  revenue: number;
  avgPrice: number;
  lastSeen: string | null;
  transactionShare: number;
};

export type BITransactionRow = {
  invoice: string;
  itemCount: number;
  totalQuantity: number;
  totalValue: number;
  country: string;
  datetime: string | null;
  items: string[];
};

export type BIOverviewResponse = {
  ready: boolean;
  error?: string;
  generatedAt?: string;
  kpis?: BIKpis;
  trends?: {
    transactions: BITrendPoint[];
  };
  products?: BIProductRow[];
  transactions?: BITransactionRow[];
  rules?: Rule[];
};

export type BIProductDetailResponse = {
  ready: boolean;
  error?: string;
  product?: {
    name: string;
    transactionCount: number;
    quantity: number;
    revenue: number;
    avgPrice: number;
    topCoPurchased: Array<{
      item: string;
      coOccurrenceCount: number;
      coOccurrenceRate: number;
    }>;
    relatedRules: Rule[];
    trend: Array<{
      period: string;
      transactions: number;
    }>;
  };
};
