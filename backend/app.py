import os
import datetime
import pandas as pd
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from bson import json_util
import io
import csv

from db import get_db
from forecaster import generate_forecasts
from recommender import generate_recommendations
from reporting import build_pdf_report

app = Flask(__name__)
# Enable CORS for frontend port (typically 5173 for Vite)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Helper to construct Mongo match query from filters
def get_match_query(args):
    query = {}
    
    # Date Range Filter
    start_date_str = args.get("startDate")
    end_date_str = args.get("endDate")
    
    if start_date_str or end_date_str:
        query["date"] = {}
        if start_date_str:
            # Parse YYYY-MM-DD
            dt = datetime.datetime.strptime(start_date_str.split("T")[0], "%Y-%m-%d")
            query["date"]["$gte"] = dt
        if end_date_str:
            dt = datetime.datetime.strptime(end_date_str.split("T")[0], "%Y-%m-%d")
            # Set to end of day
            dt = dt.replace(hour=23, minute=59, second=59)
            query["date"]["$lte"] = dt
            
    # Regional Filter
    region = args.get("region")
    if region and region.lower() != "all" and region.strip() != "":
        query["region"] = region
        
    # Product Filter
    product = args.get("product")
    if product and product.lower() != "all" and product.strip() != "":
        query["product_name"] = product
        
    # Customer Type Filter
    customer_type = args.get("customerType")
    if customer_type and customer_type.lower() != "all" and customer_type.strip() != "":
        query["customer_type"] = customer_type
        
    return query

# Helper to shift match query in time by its own duration (for growth comparisons)
def get_previous_period_query(match_query):
    prev_query = match_query.copy()
    if "date" in match_query:
        gte = match_query["date"].get("$gte")
        lte = match_query["date"].get("$lte")
        if gte and lte:
            delta = lte - gte
            prev_gte = gte - delta
            prev_lte = lte - delta
            prev_query["date"] = {"$gte": prev_gte, "$lte": prev_lte}
    else:
        # If no dates selected, default to comparing last year
        # Assuming database has data up to 2026-06-01
        latest_date = datetime.datetime(2026, 6, 1)
        prev_query["date"] = {
            "$gte": latest_date - datetime.timedelta(days=730),
            "$lte": latest_date - datetime.timedelta(days=365)
        }
    return prev_query

def aggregate_kpis(query):
    db = get_db()
    pipeline = [
        {"$match": query},
        {"$group": {
            "_id": None,
            "revenue": {"$sum": "$revenue"},
            "profit": {"$sum": "$profit"},
            "expenses": {"$sum": "$expenses"},
            "volume": {"$sum": "$sales_volume"},
            "cac": {"$sum": "$cac"},
            "new_customers": {"$sum": {"$cond": ["$is_new_customer", 1, 0]}},
            "retained_customers": {"$sum": {"$cond": ["$customer_retained", 1, 0]}}
        }}
    ]
    res = list(db.transactions.aggregate(pipeline))
    if not res:
        return {
            "revenue": 0, "profit": 0, "expenses": 0, "volume": 0,
            "margin": 0, "cac": 0, "new_customers": 0, "retained_customers": 0, "mrr": 0
        }
    kpis = res[0]
    
    # Calculate MRR (defined as cloud & subscription category revenue in the latest month of the range)
    # Get latest date in the query
    latest_tx = db.transactions.find(query).sort("date", -1).limit(1)
    mrr_val = 0
    try:
        latest_doc = next(latest_tx)
        ldate = latest_doc["date"]
        # Beginning of that month
        m_start = datetime.datetime(ldate.year, ldate.month, 1)
        m_end = (m_start + datetime.timedelta(days=32)).replace(day=1) - datetime.timedelta(seconds=1)
        
        mrr_query = query.copy()
        if "date" in mrr_query:
            mrr_query["date"] = {"$gte": m_start, "$lte": m_end}
        else:
            mrr_query["date"] = {"$gte": m_start, "$lte": m_end}
        
        mrr_query["product_category"] = {"$in": ["Cloud", "Software"]}
        
        mrr_res = db.transactions.aggregate([
            {"$match": mrr_query},
            {"$group": {"_id": None, "mrr": {"$sum": "$revenue"}}}
        ])
        mrr_list = list(mrr_res)
        if mrr_list:
            mrr_val = mrr_list[0]["mrr"]
    except StopIteration:
        mrr_val = 0

    kpis["margin"] = kpis["profit"] / kpis["revenue"] if kpis["revenue"] > 0 else 0
    kpis["mrr"] = mrr_val
    return kpis

# ----------------- API ENDPOINTS -----------------

@app.route("/api/status", methods=["GET"])
def get_status():
    return jsonify({"status": "healthy", "database": "connected"})

@app.route("/api/dashboard/kpis", methods=["GET"])
def get_dashboard_kpis():
    query = get_match_query(request.args)
    prev_query = get_previous_period_query(query)
    
    current_kpis = aggregate_kpis(query)
    prev_kpis = aggregate_kpis(prev_query)
    
    # Calculate growth percentage comparisons
    def pct_change(curr, prev):
        if prev == 0:
            return 0 if curr == 0 else 100
        return round(((curr - prev) / prev) * 100, 2)
        
    revenue_growth_pct = pct_change(current_kpis["revenue"], prev_kpis["revenue"])
    profit_growth_pct = pct_change(current_kpis["profit"], prev_kpis["profit"])
    cost_growth_pct = pct_change(current_kpis["expenses"], prev_kpis["expenses"])
    
    cust_growth_pct = pct_change(current_kpis["new_customers"], prev_kpis["new_customers"])

    return jsonify({
        "current": {
            "revenue": current_kpis["revenue"],
            "profit": current_kpis["profit"],
            "expenses": current_kpis["expenses"],
            "margin": current_kpis["margin"],
            "volume": current_kpis["volume"],
            "new_customers": current_kpis["new_customers"],
            "retained_customers": current_kpis["retained_customers"],
            "mrr": current_kpis["mrr"],
            "cac_avg": current_kpis["cac"] / current_kpis["new_customers"] if current_kpis["new_customers"] > 0 else 0
        },
        "trends": {
            "revenue_growth": revenue_growth_pct,
            "profit_growth": profit_growth_pct,
            "cost_growth": cost_growth_pct,
            "customer_growth": cust_growth_pct
        }
    })

@app.route("/api/analytics/revenue", methods=["GET"])
def get_revenue_analytics():
    query = get_match_query(request.args)
    db = get_db()
    
    # 1. Revenue Trends (Monthly aggregation)
    monthly_pipeline = [
        {"$match": query},
        {"$group": {
            "_id": {
                "year": {"$year": "$date"},
                "month": {"$month": "$date"}
            },
            "revenue": {"$sum": "$revenue"},
            "profit": {"$sum": "$profit"},
            "expenses": {"$sum": "$expenses"},
            "customers": {"$sum": {"$cond": ["$is_new_customer", 1, 0]}}
        }},
        {"$sort": {"_id.year": 1, "_id.month": 1}}
    ]
    monthly_data = list(db.transactions.aggregate(monthly_pipeline))
    formatted_trends = []
    for item in monthly_data:
        yr = item["_id"]["year"]
        mo = item["_id"]["month"]
        formatted_trends.append({
            "year_month": f"{yr}-{mo:02d}",
            "revenue": round(item["revenue"], 2),
            "profit": round(item["profit"], 2),
            "expenses": round(item["expenses"], 2),
            "customers": item["customers"]
        })
        
    # 2. Product-wise Revenue
    product_pipeline = [
        {"$match": query},
        {"$group": {
            "_id": "$product_name",
            "category": {"$first": "$product_category"},
            "revenue": {"$sum": "$revenue"},
            "profit": {"$sum": "$profit"},
            "volume": {"$sum": "$sales_volume"}
        }},
        {"$sort": {"revenue": -1}}
    ]
    product_data = list(db.transactions.aggregate(product_pipeline))
    formatted_products = [
        {
            "name": item["_id"],
            "category": item["category"],
            "revenue": round(item["revenue"], 2),
            "profit": round(item["profit"], 2),
            "volume": item["volume"]
        }
        for item in product_data
    ]
    
    # 3. Region-wise Revenue
    region_pipeline = [
        {"$match": query},
        {"$group": {
            "_id": "$region",
            "revenue": {"$sum": "$revenue"},
            "profit": {"$sum": "$profit"},
            "volume": {"$sum": "$sales_volume"}
        }},
        {"$sort": {"revenue": -1}}
    ]
    region_data = list(db.transactions.aggregate(region_pipeline))
    total_rev = sum(item["revenue"] for item in region_data)
    formatted_regions = [
        {
            "name": item["_id"],
            "revenue": round(item["revenue"], 2),
            "profit": round(item["profit"], 2),
            "volume": item["volume"],
            "share": round((item["revenue"] / total_rev * 100), 2) if total_rev > 0 else 0
        }
        for item in region_data
    ]

    return jsonify({
        "trends": formatted_trends,
        "products": formatted_products,
        "regions": formatted_regions
    })

@app.route("/api/analytics/profitability", methods=["GET"])
def get_profitability_analytics():
    query = get_match_query(request.args)
    db = get_db()
    
    pipeline = [
        {"$match": query},
        {"$group": {
            "_id": None,
            "revenue": {"$sum": "$revenue"},
            "cogs": {"$sum": "$cogs"},
            "opex": {"$sum": "$opex"},
            "cac": {"$sum": "$cac"},
            "profit": {"$sum": "$profit"}
        }}
    ]
    res = list(db.transactions.aggregate(pipeline))
    if not res:
        return jsonify({
            "revenue": 0, "gross_profit": 0, "net_profit": 0,
            "operating_margin": 0, "expenses_breakdown": {}
        })
        
    p = res[0]
    gross_profit = p["revenue"] - p["cogs"]
    net_profit = p["profit"]
    operating_margin = net_profit / p["revenue"] if p["revenue"] > 0 else 0
    
    return jsonify({
        "revenue": round(p["revenue"], 2),
        "gross_profit": round(gross_profit, 2),
        "net_profit": round(net_profit, 2),
        "operating_margin": round(operating_margin * 100, 2),
        "expenses_breakdown": {
            "COGS": round(p["cogs"], 2),
            "OpEx": round(p["opex"], 2),
            "CAC": round(p["cac"], 2)
        }
    })

@app.route("/api/analytics/forecast", methods=["GET"])
def get_forecasting_data():
    query = get_match_query(request.args)
    metric = request.args.get("metric", "revenue") # 'revenue', 'profit', 'customers'
    model_type = request.args.get("model", "linear") # 'moving_average', 'exponential_smoothing', 'linear'
    
    db = get_db()
    
    # 1. Fetch historical series grouped by month
    monthly_pipeline = [
        {"$match": query},
        {"$group": {
            "_id": {
                "year": {"$year": "$date"},
                "month": {"$month": "$date"}
            },
            "revenue": {"$sum": "$revenue"},
            "profit": {"$sum": "$profit"},
            "customers": {"$sum": {"$cond": ["$is_new_customer", 1, 0]}}
        }},
        {"$sort": {"_id.year": 1, "_id.month": 1}}
    ]
    monthly_data = list(db.transactions.aggregate(monthly_pipeline))
    if not monthly_data:
        return jsonify({"historical": [], "forecast": []})
        
    formatted_history = []
    for item in monthly_data:
        yr = item["_id"]["year"]
        mo = item["_id"]["month"]
        formatted_history.append({
            "year_month": f"{yr}-{mo:02d}",
            "value": round(item[metric], 2)
        })
        
    df_history = pd.DataFrame([
        {"year_month": item["year_month"], "value": item["value"]}
        for item in formatted_history
    ])
    
    # 2. Run forecast
    forecast_values = generate_forecasts(df_history, "value", model_type=model_type, steps=12)
    
    # 3. Format dates for the next 12 periods
    last_year, last_month = map(int, df_history["year_month"].iloc[-1].split("-"))
    formatted_forecast = []
    
    current_year = last_year
    current_month = last_month
    
    for val in forecast_values:
        current_month += 1
        if current_month > 12:
            current_month = 1
            current_year += 1
        formatted_forecast.append({
            "year_month": f"{current_year}-{current_month:02d}",
            "value": round(val, 2)
        })
        
    return jsonify({
        "historical": formatted_history,
        "forecast": formatted_forecast
    })

@app.route("/api/analytics/recommendations", methods=["GET"])
def get_recommendations_endpoint():
    try:
        recs = generate_recommendations()
        return jsonify(recs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/analytics/what-if", methods=["POST"])
def post_what_if_simulation():
    body = request.get_json() or {}
    
    marketing_budget_delta = float(body.get("marketingBudgetDelta", 0)) # Percentage shift e.g. 10
    price_delta = float(body.get("priceDelta", 0)) # Percentage shift e.g. -5
    customer_growth_delta = float(body.get("customerGrowthDelta", 0)) # Percentage shift e.g. 8
    
    # Get baseline summary (entire historical range, or filtered)
    # We aggregate total stats
    query = get_match_query(request.args)
    base = aggregate_kpis(query)
    
    # Calculate averages from db
    db = get_db()
    cogs_res = list(db.transactions.aggregate([
        {"$match": query},
        {"$group": {"_id": None, "cogs": {"$sum": "$cogs"}, "opex": {"$sum": "$opex"}}}
    ]))
    
    base_cogs = cogs_res[0]["cogs"] if cogs_res else base["expenses"] * 0.4
    base_opex = cogs_res[0]["opex"] if cogs_res else base["expenses"] * 0.6
    base_cac = base["cac"]
    
    # Run simulation logic:
    # 1. Price elasticity: demand changes as price changes.
    # We assume elasticity = -0.7 (sales quantity drops by 0.7% for every 1% price increase)
    price_elasticity = -0.7
    volume_shift_from_price = price_delta * price_elasticity / 100.0
    
    # 2. Marketing budget shift boosts customer growth.
    # We assume marketing boost elasticity = 0.4 (customers grow by 0.4% for every 1% increase in marketing budget)
    customer_shift_from_marketing = marketing_budget_delta * 0.4 / 100.0
    
    # Combine volume factors
    total_volume_multiplier = (1.0 + customer_growth_delta / 100.0) * (1.0 + volume_shift_from_price) * (1.0 + customer_shift_from_marketing)
    simulated_volume = base["volume"] * total_volume_multiplier
    
    # Simulated Unit Price multiplier
    simulated_price_multiplier = 1.0 + price_delta / 100.0
    
    # Simulated Revenue = volume * price
    # Wait, revenue is price * volume, so it scales by both multipliers:
    simulated_revenue = base["revenue"] * total_volume_multiplier * simulated_price_multiplier
    
    # Simulated Cost of Goods Sold (COGS) scales strictly with sales volume
    simulated_cogs = base_cogs * total_volume_multiplier
    
    # Simulated OpEx:
    # marketing spend increases by the marketing_budget_delta
    # other opex scales slightly with volume (say 20% variable)
    marketing_share = 0.25 # Assume marketing is 25% of opex baseline
    marketing_baseline = base_opex * marketing_share
    other_opex_baseline = base_opex * (1 - marketing_share)
    
    simulated_marketing = marketing_baseline * (1 + marketing_budget_delta / 100.0)
    simulated_other_opex = other_opex_baseline * (1 + (total_volume_multiplier - 1) * 0.2)
    simulated_opex = simulated_marketing + simulated_other_opex
    
    # Simulated total expenses and net profit
    simulated_expenses = simulated_cogs + simulated_opex
    simulated_profit = simulated_revenue - simulated_expenses
    simulated_margin = simulated_profit / simulated_revenue if simulated_revenue > 0 else 0
    
    # Simulated LTV and CAC
    # Base LTV = Avg Revenue per Customer * margin / churn
    # Let's say churn is fixed at 12% annually.
    churn_rate = 0.12
    base_customers = base["new_customers"] + base["retained_customers"]
    base_arpu = base["revenue"] / base_customers if base_customers > 0 else 0
    base_ltv = (base_arpu * base["margin"]) / churn_rate
    
    sim_customers = base_customers * total_volume_multiplier
    sim_arpu = simulated_revenue / sim_customers if sim_customers > 0 else 0
    sim_ltv = (sim_arpu * simulated_margin) / churn_rate
    
    base_cac_val = base_cac / base["new_customers"] if base["new_customers"] > 0 else 0
    # CAC grows with budget scaling (diminishing efficiency)
    simulated_cac = base_cac * (1 + marketing_budget_delta / 100.0)
    sim_new_customers = base["new_customers"] * (1 + customer_growth_delta / 100.0) * (1 + customer_shift_from_marketing)
    sim_cac_val = simulated_cac / sim_new_customers if sim_new_customers > 0 else 0

    return jsonify({
        "baseline": {
            "revenue": round(base["revenue"], 2),
            "expenses": round(base["expenses"], 2),
            "profit": round(base["profit"], 2),
            "margin": round(base["margin"] * 100, 2),
            "ltv": round(base_ltv, 2),
            "cac": round(base_cac_val, 2)
        },
        "simulated": {
            "revenue": round(simulated_revenue, 2),
            "expenses": round(simulated_expenses, 2),
            "profit": round(simulated_profit, 2),
            "margin": round(simulated_margin * 100, 2),
            "ltv": round(sim_ltv, 2),
            "cac": round(sim_cac_val, 2)
        },
        "variance": {
            "revenue_pct": round(((simulated_revenue - base["revenue"]) / base["revenue"] * 100), 2) if base["revenue"] > 0 else 0,
            "expenses_pct": round(((simulated_expenses - base["expenses"]) / base["expenses"] * 100), 2) if base["expenses"] > 0 else 0,
            "profit_pct": round(((simulated_profit - base["profit"]) / base["profit"] * 100), 2) if base["profit"] > 0 else 0,
        }
    })

@app.route("/api/reports/pdf", methods=["GET"])
def get_pdf_report():
    report_type = request.args.get("type", "executive_summary")
    query = get_match_query(request.args)
    db = get_db()
    
    # 1. Compile baseline data
    kpis = aggregate_kpis(query)
    
    # Format cash strings
    kpis_fmt = {
        "revenue": f"${kpis['revenue']:,.2f}",
        "profit": f"${kpis['profit']:,.2f}",
        "margin": f"{kpis['margin'] * 100:.1f}%",
        "mrr": f"${kpis['mrr']:,.2f}",
        "customer_growth": f"{request.args.get('customer_growth', '12.4')}%", # Fallback or dynamic
        "cac": f"${kpis['cac']/kpis['new_customers']:,.2f}" if kpis['new_customers'] > 0 else "$0.00"
    }

    # Add recommendations list
    kpis_fmt["recommendations"] = generate_recommendations()

    # Get Quarter-over-Quarter comparison data
    if report_type == "quarterly_report":
        q_pipeline = [
            {"$match": query},
            {"$group": {
                "_id": {
                    "year": {"$year": "$date"},
                    "quarter": {"$floor": {"$divide": [{"$subtract": [{"$month": "$date"}, 1]}, 3]}}
                },
                "revenue": {"$sum": "$revenue"},
                "cogs": {"$sum": "$cogs"},
                "opex": {"$sum": "$opex"},
                "profit": {"$sum": "$profit"}
            }},
            {"$sort": {"_id.year": 1, "_id.quarter": 1}}
        ]
        q_data = list(db.transactions.aggregate(q_pipeline))
        quarters_fmt = []
        for item in q_data:
            yr = item["_id"]["year"]
            qtr = int(item["_id"]["quarter"]) + 1
            tot_exp = item["cogs"] + item["opex"]
            quarters_fmt.append({
                "quarter": f"{yr} Q{qtr}",
                "revenue": f"${item['revenue']:,.2f}",
                "cogs": f"${item['cogs']:,.2f}",
                "opex": f"${item['opex']:,.2f}",
                "profit": f"${item['profit']:,.2f}",
                "margin": f"{(item['profit']/item['revenue']*100):.1f}%" if item['revenue'] > 0 else "0.0%"
            })
        kpis_fmt["quarters"] = quarters_fmt[-12:] # Cap at last 3 years of quarterly data
        
    elif report_type == "revenue_report":
        # Get region breakdowns
        r_pipeline = [
            {"$match": query},
            {"$group": {
                "_id": "$region",
                "revenue": {"$sum": "$revenue"},
                "volume": {"$sum": "$sales_volume"},
                "unit_price": {"$avg": "$unit_price"}
            }},
            {"$sort": {"revenue": -1}}
        ]
        r_data = list(db.transactions.aggregate(r_pipeline))
        total_revenue = sum(item["revenue"] for item in r_data)
        regions_fmt = []
        for item in r_data:
            regions_fmt.append({
                "name": item["_id"],
                "volume": f"{item['volume']:,}",
                "revenue": f"${item['revenue']:,.2f}",
                "avg_price": f"${item['unit_price']:,.2f}",
                "share": f"{(item['revenue']/total_revenue*100):.1f}%" if total_revenue > 0 else "0%"
            })
        kpis_fmt["regions"] = regions_fmt
        
        # Get top product breakdowns
        p_pipeline = [
            {"$match": query},
            {"$group": {
                "_id": "$product_name",
                "category": {"$first": "$product_category"},
                "volume": {"$sum": "$sales_volume"},
                "revenue": {"$sum": "$revenue"},
                "profit": {"$sum": "$profit"}
            }},
            {"$sort": {"revenue": -1}}
        ]
        p_data = list(db.transactions.aggregate(p_pipeline))
        products_fmt = []
        for item in p_data[:10]: # Top 10 products
            products_fmt.append({
                "name": item["_id"],
                "category": item["category"],
                "volume": f"{item['volume']:,}",
                "revenue": f"${item['revenue']:,.2f}",
                "profit": f"${item['profit']:,.2f}"
            })
        kpis_fmt["products"] = products_fmt
        
    # Generate PDF raw bytes
    try:
        pdf_bytes = build_pdf_report(report_type, kpis_fmt)
        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"{report_type}_{datetime.date.today().isoformat()}.pdf"
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/export/csv", methods=["GET"])
def get_csv_export():
    query = get_match_query(request.args)
    db = get_db()
    
    # Generate aggregated data by month for the filtered criteria
    # Direct raw dump is too large (100k records exceeds typical single browser download limits comfortably, and aggregates are cleaner)
    # Let's export monthly aggregated breakdown of products & regions
    export_pipeline = [
        {"$match": query},
        {"$group": {
            "_id": {
                "year": {"$year": "$date"},
                "month": {"$month": "$date"},
                "region": "$region",
                "product_name": "$product_name",
                "customer_type": "$customer_type"
            },
            "revenue": {"$sum": "$revenue"},
            "profit": {"$sum": "$profit"},
            "cogs": {"$sum": "$cogs"},
            "opex": {"$sum": "$opex"},
            "volume": {"$sum": "$sales_volume"}
        }},
        {"$sort": {"_id.year": 1, "_id.month": 1}}
    ]
    
    data = list(db.transactions.aggregate(export_pipeline))
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["Year", "Month", "Region", "Product Name", "Customer Type", "Revenue", "Cost of Goods Sold", "Operating Cost", "Expenses", "Net Profit", "Sales Volume"])
    
    for row in data:
        id_info = row["_id"]
        cogs = row["cogs"]
        opex = row["opex"]
        expenses = cogs + opex
        writer.writerow([
            id_info["year"],
            f"{id_info['month']:02d}",
            id_info["region"],
            id_info["product_name"],
            id_info["customer_type"],
            round(row["revenue"], 2),
            round(cogs, 2),
            round(opex, 2),
            round(expenses, 2),
            round(row["profit"], 2),
            row["volume"]
        ])
        
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype="text/csv",
        as_attachment=True,
        download_name=f"insightboard_export_{datetime.date.today().isoformat()}.csv"
    )

if __name__ == "__main__":
    # Get port from environment or default to 5000
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
