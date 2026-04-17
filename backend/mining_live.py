from __future__ import annotations

from io import StringIO
import re
from typing import Any

import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules, fpgrowth

MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

INVOICE_KEYS = [
    "invoiceno",
    "invoice_no",
    "invoiceid",
    "invoice",
    "transaction_id",
    "transactionid",
    "transaction",
    "order_id",
    "orderid",
    "order",
    "receiptno",
    "billno",
]
ITEM_KEYS = [
    "description",
    "coffee_name",
    "coffeename",
    "name",
    "title",
    "product",
    "productname",
    "product_name",
    "product_title",
    "drink",
    "beverage",
    "item",
    "itemname",
    "sku",
    "asin",
    "stockcode",
]
COUNTRY_KEYS = ["country", "region", "market", "nation"]
DATE_KEYS = ["invoicedate", "invoice_date", "date", "datetime", "orderdate", "purchasedate", "purchase_date"]
TIME_KEYS = ["time", "order_time", "ordertime", "purchase_time", "purchasetime", "transactiontime"]
QUANTITY_KEYS = ["quantity", "qty", "itemqty"]
PRICE_KEYS = ["unitprice", "price", "amount"]

NOISE_ITEMS = {
    "POSTAGE",
    "DOTCOM POSTAGE",
    "BANK CHARGES",
    "MANUAL",
    "CARRIAGE",
    "SAMPLES",
    "ADJUSTMENT",
}


def _normalize_header(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())


def _header_tokens(value: str) -> set[str]:
    return {token for token in re.split(r"[^a-z0-9]+", value.lower()) if token}


def _detect_column(columns: list[str], candidates: list[str]) -> str | None:
    normalized_to_original = {_normalize_header(col): col for col in columns}
    candidate_norms = [_normalize_header(candidate) for candidate in candidates]

    # 1) Exact normalized match.
    for candidate in candidate_norms:
        if candidate in normalized_to_original:
            return normalized_to_original[candidate]

    # 2) Token-aware match (handles names like "Invoice No.", "Product Title").
    column_tokens = {col: _header_tokens(col) for col in columns}
    for candidate in candidates:
        candidate_tokens = _header_tokens(candidate)
        if not candidate_tokens:
            continue
        for col in columns:
            if candidate_tokens.issubset(column_tokens[col]):
                return col

    # 3) Partial normalized match as final fallback.
    for candidate in candidate_norms:
        if len(candidate) < 4:
            continue
        for normalized_col, original_col in normalized_to_original.items():
            if candidate in normalized_col:
                return original_col

    return None


def _safe_item_name(value: Any) -> str:
    return str(value).strip()


def _normalize_country_name(value: Any) -> str:
    name = str(value).strip()
    if name.upper() == "EIRE":
        return "Ireland"
    return name


def _build_synthetic_invoice_ids(df: pd.DataFrame, date_col: str | None, time_col: str | None) -> pd.Series | None:
    """Create synthetic transaction IDs when invoice/order IDs are absent."""
    if date_col is None and time_col is None:
        return None

    timestamp = pd.Series(pd.NaT, index=df.index, dtype="datetime64[ns]")

    if date_col and time_col:
        combined = df[date_col].astype(str).str.strip() + " " + df[time_col].astype(str).str.strip()
        timestamp = pd.to_datetime(combined, errors="coerce")
    elif date_col:
        timestamp = pd.to_datetime(df[date_col], errors="coerce")
    elif time_col:
        timestamp = pd.to_datetime(df[time_col], errors="coerce")

    valid = timestamp.notna()
    if not bool(valid.any()):
        return None

    synthetic_ids = pd.Series(index=df.index, dtype="object")
    # Group nearby purchases into the same synthetic basket window.
    bucketed = timestamp.dt.floor("2min")
    synthetic_ids[valid] = "SYN-" + bucketed[valid].dt.strftime("%Y%m%d%H%M")

    if bool((~valid).any()):
        fallback_rows = df.index[~valid].to_series(index=df.index[~valid]) + 1
        synthetic_ids[~valid] = "SYN-ROW-" + fallback_rows.astype(str)

    return synthetic_ids


def _build_row_bucket_invoice_ids(df: pd.DataFrame, bucket_size: int = 3) -> pd.Series:
    """Fallback synthetic transaction IDs using contiguous row buckets."""
    bucket_size = max(2, int(bucket_size))
    row_positions = pd.Series(range(len(df)), index=df.index, dtype="int64")
    bucket_ids = (row_positions // bucket_size).astype(str).str.zfill(7)
    return "SYN-BKT-" + bucket_ids


def analyze_csv_text(
    csv_text: str,
    algorithm: str = "fpgrowth",
    min_support: float = 0.01,
    min_confidence: float = 0.1,
    min_lift: float = 1.0,
    top_n: int = 400,
) -> dict[str, Any]:
    if not csv_text or not csv_text.strip():
        raise ValueError("CSV content is empty.")

    df = pd.read_csv(StringIO(csv_text))
    if df.empty:
        raise ValueError("CSV has no data rows.")

    columns = list(df.columns)
    invoice_col = _detect_column(columns, INVOICE_KEYS)
    item_col = _detect_column(columns, ITEM_KEYS)
    country_col = _detect_column(columns, COUNTRY_KEYS)
    date_col = _detect_column(columns, DATE_KEYS)
    time_col = _detect_column(columns, TIME_KEYS)
    quantity_col = _detect_column(columns, QUANTITY_KEYS)
    price_col = _detect_column(columns, PRICE_KEYS)

    if item_col is None:
        raise ValueError("Required column missing: item/product.")

    used_synthetic_transactions = False
    inference_mode = "native"
    if invoice_col is None:
        synthetic_ids = _build_synthetic_invoice_ids(df, date_col, time_col)
        if synthetic_ids is None:
            synthetic_ids = _build_row_bucket_invoice_ids(df, bucket_size=3)
            inference_mode = "row-bucket"
        else:
            inference_mode = "datetime-window"
        invoice_col = "__synthetic_invoice_id"
        df[invoice_col] = synthetic_ids
        used_synthetic_transactions = True

    selected_columns = [invoice_col, item_col]
    if country_col:
        selected_columns.append(country_col)
    if date_col:
        selected_columns.append(date_col)
    if time_col:
        selected_columns.append(time_col)
    if quantity_col:
        selected_columns.append(quantity_col)
    if price_col:
        selected_columns.append(price_col)

    raw_rows = int(len(df))
    working = df[selected_columns].copy()
    working[invoice_col] = working[invoice_col].astype(str).str.strip()
    working[item_col] = working[item_col].map(_safe_item_name)

    # 1) Core null/blank cleaning
    working = working[(working[invoice_col] != "") & (working[item_col] != "")]

    # 2) Remove cancelled invoices if they exist (Invoice starts with C)
    cancelled_mask = working[invoice_col].str.upper().str.startswith("C")
    cancelled_count = int(cancelled_mask.sum())
    working = working[~cancelled_mask]

    # 3) Normalize and remove common service/noise items
    working[item_col] = working[item_col].str.strip()
    noise_mask = working[item_col].str.upper().isin(NOISE_ITEMS)
    noise_count = int(noise_mask.sum())
    working = working[~noise_mask]

    # 4) Optional numeric quality filters when available
    non_positive_quantity_count = 0
    if quantity_col:
        quantity_values = pd.to_numeric(working[quantity_col], errors="coerce")
        quantity_mask = quantity_values > 0
        non_positive_quantity_count = int((~quantity_mask).sum())
        working = working[quantity_mask]

    non_positive_price_count = 0
    if price_col:
        price_values = pd.to_numeric(working[price_col], errors="coerce")
        price_mask = price_values > 0
        non_positive_price_count = int((~price_mask).sum())
        working = working[price_mask]

    if working.empty:
        raise ValueError("No valid transaction rows were found.")

    basket = (
        working.assign(value=1)
        .pivot_table(index=invoice_col, columns=item_col, values="value", aggfunc="max", fill_value=0)
        .astype(bool)
    )

    total_transactions = int(len(basket))
    if total_transactions == 0:
        raise ValueError("No valid transactions were found after preprocessing.")

    # Performance optimization: columns below min_support can never be frequent
    # itemsets, so removing them before FP-Growth cuts runtime significantly.
    min_count = max(1, int(min_support * total_transactions))
    item_counts = basket.sum(axis=0)
    frequent_columns = item_counts[item_counts >= min_count].index
    basket = basket.loc[:, frequent_columns]

    unique_items_count = int(len(basket.columns))
    if total_transactions < 2 or unique_items_count < 2:
        raise ValueError(
            "Dataset not suitable for mining after cleaning. It needs at least 2 transactions and 2 unique items."
        )

    top_n = max(1, min(int(top_n), 400))

    if algorithm == "apriori":
        frequent_itemsets = apriori(
            basket,
            min_support=min_support,
            use_colnames=True,
            max_len=2,
        )
    else:
        frequent_itemsets = fpgrowth(
            basket,
            min_support=min_support,
            use_colnames=True,
            max_len=2,
        )

    rules_df = pd.DataFrame(columns=["antecedents", "consequents", "support", "confidence", "lift"])
    if not frequent_itemsets.empty:
        rules_df = association_rules(
            frequent_itemsets,
            num_itemsets=total_transactions,
            metric="confidence",
            min_threshold=min_confidence,
        )
        rules_df = rules_df[rules_df["lift"] >= min_lift]

    item_support = basket.mean().sort_values(ascending=False)
    item_frequency = [
        {"item": str(item), "count": int(round(float(support) * total_transactions))}
        for item, support in item_support.head(12).items()
    ]

    pair_itemsets = frequent_itemsets[frequent_itemsets["itemsets"].map(len) == 2].copy()
    top_itemsets = []
    if not pair_itemsets.empty:
        pair_itemsets = pair_itemsets.sort_values("support", ascending=False).head(60)
        for _, row in pair_itemsets.iterrows():
            items = sorted([str(v) for v in row["itemsets"]])
            support = float(row["support"])
            top_itemsets.append(
                {
                    "items": f"{items[0]} + {items[1]}",
                    "count": int(round(support * total_transactions)),
                    "support": support,
                }
            )

    rules: list[dict[str, Any]] = []
    if not rules_df.empty:
        rules_df = rules_df.sort_values(["lift", "confidence"], ascending=[False, False]).head(top_n)
        for _, row in rules_df.iterrows():
            antecedent = ", ".join(sorted([str(v) for v in row["antecedents"]]))
            consequent = ", ".join(sorted([str(v) for v in row["consequents"]]))
            rules.append(
                {
                    "antecedent": antecedent,
                    "consequent": consequent,
                    "support": float(row["support"]),
                    "confidence": float(row["confidence"]),
                    "lift": float(row["lift"]),
                }
            )

    heatmap_items = [entry["item"] for entry in item_frequency[:8]]
    heatmap_matrix: list[list[float]] = []
    for row_item in heatmap_items:
        row_values: list[float] = []
        for col_item in heatmap_items:
            if row_item == col_item:
                row_values.append(1.0)
                continue
            if "itemsets" in pair_itemsets.columns and "support" in pair_itemsets.columns:
                pair_matches = pair_itemsets[
                    pair_itemsets["itemsets"].map(lambda s: row_item in s and col_item in s)
                ]
                pair_support = pair_matches.get("support", pd.Series(dtype=float))
                row_values.append(float(pair_support.iloc[0]) if not pair_support.empty else 0.0)
            else:
                row_values.append(0.0)
        heatmap_matrix.append(row_values)

    unique_countries = 1
    country_distribution: list[dict[str, Any]] = [{"name": "Unknown", "value": total_transactions}]
    if country_col:
        invoice_country = (
            working[[invoice_col, country_col]]
            .dropna()
            .drop_duplicates(subset=[invoice_col])
        )
        invoice_country[country_col] = invoice_country[country_col].map(_normalize_country_name)
        counts = invoice_country[country_col].value_counts().head(5)
        if not counts.empty:
            country_distribution = [{"name": str(name), "value": int(value)} for name, value in counts.items()]
            unique_countries = int(invoice_country[country_col].nunique())

    month_counts = [0] * 12
    if date_col:
        parsed = pd.to_datetime(working[date_col], errors="coerce")
        months = parsed.dropna().dt.month
        for month in months:
            month_index = int(month) - 1
            if 0 <= month_index <= 11:
                month_counts[month_index] += 1

    if all(value == 0 for value in month_counts):
        month_counts = [max(1, int(total_transactions / 12))] * 12

    monthly_transactions = [
        {"month": month_name, "transactions": int(month_counts[index])}
        for index, month_name in enumerate(MONTH_NAMES)
    ]

    product_catalog = sorted(
        {
            str(value).strip()
            for value in working[item_col].dropna().tolist()
            if str(value).strip()
        }
    )

    if inference_mode == "native":
        suitability_message = f"Dataset cleaned and suitable for {algorithm.upper()} mining."
    elif inference_mode == "datetime-window":
        suitability_message = (
            f"Dataset cleaned and suitable for {algorithm.upper()} mining "
            "(using inferred transaction IDs from date/time windows)."
        )
    else:
        suitability_message = (
            f"Dataset cleaned and suitable for {algorithm.upper()} mining "
            "(using fallback row-bucket transaction IDs because invoice/order and date/time columns were missing). "
            "Treat these rules as directional guidance."
        )

    return {
        "totalRows": int(len(working)),
        "totalTransactions": total_transactions,
        "uniqueItems": unique_items_count,
        "uniqueCountries": int(unique_countries),
        "topItemsets": top_itemsets,
        "rules": rules,
        "itemFrequency": item_frequency,
        "productCatalog": product_catalog,
        "heatmapItems": heatmap_items,
        "heatmapMatrix": heatmap_matrix,
        "monthlyTransactions": monthly_transactions,
        "countryDistribution": country_distribution,
        "preprocessing": {
            "rawRows": raw_rows,
            "cleanedRows": int(len(working)),
            "droppedRows": int(raw_rows - len(working)),
            "removedCancelledInvoices": cancelled_count,
            "removedNoiseItems": noise_count,
            "removedNonPositiveQuantity": non_positive_quantity_count,
            "removedNonPositivePrice": non_positive_price_count,
        },
        "suitability": {
            "isSuitable": True,
            "message": suitability_message,
        },
        "usedSyntheticTransactions": used_synthetic_transactions,
        "transactionInferenceMode": inference_mode,
    }
