import datetime
import random
import uuid
import sys
from pymongo import ASCENDING
from db import get_db, close_db

# Configuration
PRODUCTS = [
    {"name": "Beta Cloud", "category": "Cloud", "base_price": 1200, "base_cost": 300, "growth": 1.25, "penetration": 0.8},
    {"name": "Alpha Core", "category": "Software", "base_price": 5000, "base_cost": 800, "growth": 1.05, "penetration": 0.6},
    {"name": "Gamma Analytics", "category": "Software", "base_price": 2500, "base_cost": 500, "growth": 1.15, "penetration": 0.5},
    {"name": "Delta Security", "category": "Software", "base_price": 1800, "base_cost": 400, "growth": 1.10, "penetration": 0.4},
    {"name": "Epsilon CRM", "category": "Software", "base_price": 1500, "base_cost": 350, "growth": 1.08, "penetration": 0.7},
    {"name": "Zeta ERP", "category": "Software", "base_price": 8000, "base_cost": 2000, "growth": 1.03, "penetration": 0.3},
    {"name": "Eta HR", "category": "Software", "base_price": 1000, "base_cost": 250, "growth": 1.07, "penetration": 0.5},
    {"name": "Theta Billing", "category": "Software", "base_price": 900, "base_cost": 200, "growth": 1.05, "penetration": 0.4},
    {"name": "Iota Support", "category": "Software", "base_price": 800, "base_cost": 150, "growth": 1.04, "penetration": 0.5},
    {"name": "Kappa Portal", "category": "Software", "base_price": 600, "base_cost": 120, "growth": 1.02, "penetration": 0.3},
    {"name": "Lambda IoT", "category": "Cloud", "base_price": 3000, "base_cost": 900, "growth": 1.30, "penetration": 0.2},
    {"name": "Mu DevOps", "category": "Cloud", "base_price": 2200, "base_cost": 600, "growth": 1.20, "penetration": 0.5},
    {"name": "Nu Database", "category": "Cloud", "base_price": 1600, "base_cost": 400, "growth": 1.18, "penetration": 0.6},
    {"name": "Xi Integration", "category": "Cloud", "base_price": 1400, "base_cost": 300, "growth": 1.22, "penetration": 0.3}, # Low penetration overall but high growth
    {"name": "Omicron Mobile", "category": "Software", "base_price": 750, "base_cost": 180, "growth": 1.06, "penetration": 0.4},
    {"name": "Pi Workspace", "category": "Software", "base_price": 500, "base_cost": 100, "growth": 1.04, "penetration": 0.6},
    {"name": "Rho Asset", "category": "Software", "base_price": 3500, "base_cost": 900, "growth": 1.03, "penetration": 0.3},
    {"name": "Sigma Flow", "category": "Software", "base_price": 1100, "base_cost": 220, "growth": 1.09, "penetration": 0.4},
    {"name": "Tau Search", "category": "Software", "base_price": 2000, "base_cost": 700, "growth": 0.85, "penetration": 0.5}, # Declining product, high expenses (underperforming)
    {"name": "Upsilon Identity", "category": "Software", "base_price": 1700, "base_cost": 350, "growth": 1.14, "penetration": 0.4}
]

REGIONS = {
    "North America": {"weight": 0.35, "price_factor": 1.05, "cost_factor": 0.95},
    "Europe": {"weight": 0.25, "price_factor": 1.00, "cost_factor": 1.00},
    "Asia-Pacific": {"weight": 0.20, "price_factor": 0.90, "cost_factor": 0.90},
    "Latin America": {"weight": 0.12, "price_factor": 0.85, "cost_factor": 1.20}, # Underperforming: high operating costs, lower price factor
    "Middle East & Africa": {"weight": 0.08, "price_factor": 1.02, "cost_factor": 0.98}
}

CUSTOMER_TYPES = ["Enterprise", "Mid-Market", "SMB"]
CUSTOMER_TYPE_WEIGHTS = [0.25, 0.45, 0.30]

# Seasonality by month (Jan-Dec)
MONTHLY_SEASONALITY = [0.80, 0.85, 1.00, 0.95, 1.05, 1.10, 0.90, 0.88, 1.05, 1.15, 1.25, 1.40]

# Year-over-year revenue scaling (2021 to 2026)
YOY_SCALING = {
    2021: 1.00,
    2022: 1.12,
    2023: 1.28,
    2024: 1.44,
    2025: 1.62,
    2026: 1.80
}

def generate_data():
    print("Generating enterprise transactions...")
    db = get_db()
    
    # Drop existing collections to avoid duplicates
    db.transactions.drop()
    print("Dropped existing transactions database.")
    
    # Create customer pool to simulate acquisition and retention
    customer_pool = {}
    customer_ids = [f"CUST-{i:04d}" for i in range(1, 4001)]
    for cid in customer_ids:
        ctype = random.choices(CUSTOMER_TYPES, weights=CUSTOMER_TYPE_WEIGHTS)[0]
        region = random.choices(list(REGIONS.keys()), weights=[r["weight"] for r in REGIONS.values()])[0]
        customer_pool[cid] = {
            "id": cid,
            "type": ctype,
            "region": region,
            "first_purchase": None,
            "last_purchase": None
        }

    start_date = datetime.date(2021, 1, 1)
    end_date = datetime.date(2026, 6, 1)
    delta = end_date - start_date
    total_days = delta.days

    total_records = 100000
    records_per_day = total_records // total_days
    
    # Adjust to hit slightly over 100,000
    records_per_day = int(records_per_day * 1.05)

    print(f"Generating data over {total_days} days (approx. {records_per_day} records/day)")

    batch = []
    batch_size = 5000
    inserted_count = 0

    for day in range(total_days):
        current_date = start_date + datetime.timedelta(days=day)
        year = current_date.year
        month = current_date.month

        # Factors
        yoy_factor = YOY_SCALING.get(year, 1.80)
        season_factor = MONTHLY_SEASONALITY[month - 1]
        
        # Calculate number of transactions for today with randomness
        day_records_count = int(records_per_day * yoy_factor * season_factor * random.uniform(0.85, 1.15))
        
        for _ in range(day_records_count):
            # Select customer
            cid = random.choice(customer_ids)
            cust = customer_pool[cid]
            region = cust["region"]
            ctype = cust["type"]

            # Select product
            prod = random.choice(PRODUCTS)
            product_name = prod["name"]
            category = prod["category"]
            
            # Regional characteristics
            r_info = REGIONS[region]
            
            # Determine sales volume
            if ctype == "Enterprise":
                sales_volume = random.randint(5, 20)
            elif ctype == "Mid-Market":
                sales_volume = random.randint(2, 8)
            else:
                sales_volume = random.randint(1, 3)

            # Determine prices & discounts
            base_price = prod["base_price"] * r_info["price_factor"]
            # Apply YoY pricing adjustments (inflation/price increases over time)
            base_price *= (1 + (year - 2021) * 0.03) 
            
            discount = 0.0
            if random.random() < 0.35: # 35% chance of discount
                discount = round(random.uniform(0.02, 0.15), 2)

            revenue = sales_volume * base_price * (1 - discount)
            
            # Unit Cost (COGS)
            base_cost = prod["base_cost"] * r_info["cost_factor"]
            # Cost growth (inflation, Tau Search has higher cost growth)
            cost_increase_rate = 0.05 if product_name == "Tau Search" else 0.02
            base_cost *= (1 + (year - 2021) * cost_increase_rate)
            cogs = sales_volume * base_cost
            
            # Allocated Operating Cost (Marketing, Sales, OpEx)
            # Latin America has higher operational costs
            opex_pct = random.uniform(0.18, 0.28)
            if region == "Latin America":
                opex_pct = random.uniform(0.28, 0.38)
            elif product_name == "Tau Search":
                opex_pct = random.uniform(0.25, 0.35)
                
            opex = opex_pct * revenue
            expenses = cogs + opex
            profit = revenue - expenses

            # Customer Acquisition & Retention
            dt = datetime.datetime.combine(current_date, datetime.time.min)
            is_new = False
            cac = 0.0
            if cust["first_purchase"] is None:
                is_new = True
                cust["first_purchase"] = dt
                # Generate Customer Acquisition Cost (CAC)
                if ctype == "Enterprise":
                    cac = random.uniform(800, 1500)
                elif ctype == "Mid-Market":
                    cac = random.uniform(300, 700)
                else:
                    cac = random.uniform(100, 250)
            
            # Customer retention indicator
            # Customer is retained if they have bought before and this is a subsequent purchase
            # We assume active status if they purchased in the last 12 months
            retained = False
            if not is_new and cust["last_purchase"] is not None:
                time_since_last = (dt - cust["last_purchase"]).days
                if time_since_last <= 365:
                    retained = True

            cust["last_purchase"] = dt

            record = {
                "transaction_id": str(uuid.uuid4()),
                "date": dt,
                "customer_id": cid,
                "customer_type": ctype,
                "region": region,
                "product_name": product_name,
                "product_category": category,
                "sales_volume": sales_volume,
                "unit_price": round(base_price, 2),
                "discount": discount,
                "revenue": round(revenue, 2),
                "cogs": round(cogs, 2),
                "opex": round(opex, 2),
                "expenses": round(expenses, 2),
                "profit": round(profit, 2),
                "cac": round(cac, 2),
                "is_new_customer": is_new,
                "customer_retained": retained
            }
            batch.append(record)

            if len(batch) >= batch_size:
                db.transactions.insert_many(batch)
                inserted_count += len(batch)
                batch = []
                sys.stdout.write(f"\rSeeded {inserted_count} records...")
                sys.stdout.flush()

    if batch:
        db.transactions.insert_many(batch)
        inserted_count += len(batch)
        print(f"\rSeeded {inserted_count} records...")

    # Create Indexes for fast querying
    print("Creating indexes on transactions...")
    db.transactions.create_index([("date", ASCENDING)])
    db.transactions.create_index([("region", ASCENDING)])
    db.transactions.create_index([("product_name", ASCENDING)])
    db.transactions.create_index([("customer_type", ASCENDING)])
    print("Database indexes created successfully.")
    
    close_db()
    print("Data generation complete.")

if __name__ == "__main__":
    generate_data()
