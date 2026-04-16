# 05 - Data Contracts and Mining Logic

## Accepted Input Pattern

The live analyzer accepts CSV text and tries to detect columns by flexible names.

Required (logical):

- Invoice/transaction identifier OR inferable date/time columns
- Product/item name

Optional:

- Country
- Date
- Time
- Quantity
- Price

---

## Header Detection Strategy

The backend normalizes headers and attempts:

1. Exact normalized match
2. Token-based subset match
3. Partial normalized fallback

This allows columns like `Invoice No`, `transaction_id`, `product_name`, `coffee_name`, etc.

---

## Synthetic Transaction IDs

If no invoice/order identifier exists:

- The pipeline attempts to build synthetic IDs from date/time buckets
- Falls back to row-based synthetic IDs when needed

This lets more datasets become mineable without manual preprocessing.

---

## Preprocessing Rules

The analyzer applies these cleaning steps:

- Remove blank invoice/item rows
- Remove cancelled invoices (invoice starts with `C`)
- Remove known noise/service items (`POSTAGE`, `MANUAL`, etc.)
- Remove non-positive quantity when quantity column is present
- Remove non-positive price when price column is present

Suitability requires at least:

- 2 transactions
- 2 unique items

---

## Mining Rules

- Builds boolean basket matrix per transaction
- Drops columns that cannot meet `min_support`
- Runs FP-Growth or Apriori with `max_len=2`
- Builds association rules with confidence and lift thresholds

Current UI path uses FP-Growth through `/api/analyze`.

---

## Output Contract (Analysis)

Main response keys returned for frontend rendering:

- `totalRows`
- `totalTransactions`
- `uniqueItems`
- `uniqueCountries`
- `topItemsets`
- `rules`
- `itemFrequency`
- `heatmapItems`
- `heatmapMatrix`
- `monthlyTransactions`
- `countryDistribution`
- `preprocessing`
- `suitability`
- `usedSyntheticTransactions`

This output is consumed by Dashboard and Reports views.
