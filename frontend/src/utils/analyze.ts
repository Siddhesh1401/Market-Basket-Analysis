import type { AnalysisResult, Rule, Itemset } from "../types";

const POSSIBLE_INVOICE_KEYS = [
  "invoiceno",
  "invoice_no",
  "invoice",
  "transaction",
  "transactionid",
  "orderid",
  "billno",
];

const POSSIBLE_ITEM_KEYS = [
  "description",
  "product",
  "productname",
  "item",
  "itemname",
  "stockcode",
];

const POSSIBLE_COUNTRY_KEYS = ["country", "region", "market", "nation"];
const POSSIBLE_DATE_KEYS = [
  "invoicedate",
  "date",
  "datetime",
  "orderdate",
  "purchasedate",
];

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function detectColumnIndex(headers: string[], candidates: string[]): number {
  const normalized = headers.map((h) => h.toLowerCase().replace(/\s+/g, ""));
  return normalized.findIndex((header) => candidates.includes(header));
}

export function analyzeDataset(csvText: string): AnalysisResult {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error("CSV must include a header row and at least one data row.");
  }

  const headers = parseCsvLine(lines[0]);
  const invoiceIndex = detectColumnIndex(headers, POSSIBLE_INVOICE_KEYS);
  const itemIndex = detectColumnIndex(headers, POSSIBLE_ITEM_KEYS);
  const countryIndex = detectColumnIndex(headers, POSSIBLE_COUNTRY_KEYS);
  const dateIndex = detectColumnIndex(headers, POSSIBLE_DATE_KEYS);

  if (invoiceIndex === -1 || itemIndex === -1) {
    throw new Error(
      "Could not detect required columns. Include invoice/order and item/product columns.",
    );
  }

  const invoiceMap = new Map<string, Set<string>>();
  const invoiceCountryMap = new Map<string, string>();
  const invoiceMonthMap = new Map<string, number>();

  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const invoice = cols[invoiceIndex]?.trim();
    const item = cols[itemIndex]?.trim();

    if (!invoice || !item) {
      continue;
    }

    if (!invoiceMap.has(invoice)) {
      invoiceMap.set(invoice, new Set<string>());
    }
    invoiceMap.get(invoice)?.add(item);

    if (countryIndex !== -1) {
      const country = cols[countryIndex]?.trim();
      if (country) {
        invoiceCountryMap.set(invoice, country);
      }
    }

    if (dateIndex !== -1) {
      const rawDate = cols[dateIndex]?.trim();
      const parsed = rawDate ? new Date(rawDate) : null;
      if (parsed && Number.isFinite(parsed.getTime())) {
        invoiceMonthMap.set(invoice, parsed.getMonth());
      }
    }
  }

  const transactions = Array.from(invoiceMap.values())
    .map((set) => Array.from(set).sort())
    .filter((t) => t.length > 0);

  const totalTransactions = transactions.length;
  if (totalTransactions === 0) {
    throw new Error("No valid transactions were found after parsing.");
  }

  const itemCounts = new Map<string, number>();
  const pairCounts = new Map<string, number>();

  transactions.forEach((transaction) => {
    transaction.forEach((item) => {
      itemCounts.set(item, (itemCounts.get(item) ?? 0) + 1);
    });

    for (let i = 0; i < transaction.length; i += 1) {
      for (let j = i + 1; j < transaction.length; j += 1) {
        const a = transaction[i];
        const b = transaction[j];
        const key = `${a}|||${b}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
  });

  const topItemsets: Itemset[] = Array.from(pairCounts.entries())
    .map(([key, count]) => {
      const [a, b] = key.split("|||");
      return {
        items: `${a} + ${b}`,
        count,
        support: count / totalTransactions,
      };
    })
    .sort((a, b) => b.support - a.support)
    .slice(0, 60);

  const rules: Rule[] = [];
  pairCounts.forEach((pairCount, key) => {
    const [a, b] = key.split("|||");
    const supportAB = pairCount / totalTransactions;
    const supportA = (itemCounts.get(a) ?? 1) / totalTransactions;
    const supportB = (itemCounts.get(b) ?? 1) / totalTransactions;

    rules.push({
      antecedent: a,
      consequent: b,
      support: supportAB,
      confidence: supportAB / supportA,
      lift: (supportAB / supportA) / supportB,
    });

    rules.push({
      antecedent: b,
      consequent: a,
      support: supportAB,
      confidence: supportAB / supportB,
      lift: (supportAB / supportB) / supportA,
    });
  });

  rules.sort((a, b) => {
    if (b.lift !== a.lift) {
      return b.lift - a.lift;
    }
    return b.confidence - a.confidence;
  });

  const itemFrequency = Array.from(itemCounts.entries())
    .map(([item, count]) => ({ item, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const heatmapItems = itemFrequency.slice(0, 8).map((d) => d.item);
  const heatmapMatrix = heatmapItems.map((rowItem) =>
    heatmapItems.map((colItem) => {
      if (rowItem === colItem) {
        return 1;
      }
      const pair = [rowItem, colItem].sort().join("|||");
      const count = pairCounts.get(pair) ?? 0;
      return count / totalTransactions;
    }),
  );

  const countryCounts = new Map<string, number>();
  invoiceCountryMap.forEach((country) => {
    countryCounts.set(country, (countryCounts.get(country) ?? 0) + 1);
  });
  const countryDistribution = Array.from(countryCounts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  if (countryDistribution.length === 0) {
    countryDistribution.push({ name: "Unknown", value: totalTransactions });
  }

  const monthCounts: number[] = Array.from({ length: 12 }, () => 0);
  invoiceMonthMap.forEach((month) => {
    if (month >= 0 && month <= 11) {
      monthCounts[month] += 1;
    }
  });

  const normalizedMonthCounts = monthCounts.every((value) => value === 0)
    ? MONTH_NAMES.map((_, index) =>
        Math.max(1, Math.round(totalTransactions / 12 + (index - 5) * 0.5)),
      )
    : monthCounts;

  const monthlyTransactions = MONTH_NAMES.map((month, index) => ({
    month,
    transactions: normalizedMonthCounts[index],
  }));

  return {
    totalRows: lines.length - 1,
    totalTransactions,
    uniqueItems: itemCounts.size,
    uniqueCountries: countryCounts.size || 1,
    topItemsets,
    rules: rules.slice(0, 240),
    itemFrequency,
    heatmapItems,
    heatmapMatrix,
    monthlyTransactions,
    countryDistribution,
  };
}

export const CHART_COLORS = ["#2563eb", "#06b6d4", "#8b5cf6", "#22c55e", "#f59e0b"];
