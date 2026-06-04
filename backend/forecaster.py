import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

def forecast_moving_average(history_series, window=3, steps=12):
    """
    Computes Moving Average forecast for the next 'steps' periods.
    """
    forecast = list(history_series)
    for _ in range(steps):
        next_val = np.mean(forecast[-window:])
        forecast.append(next_val)
    return forecast[-steps:]

def forecast_exponential_smoothing(history_series, alpha=0.3, beta=0.1, steps=12):
    """
    Computes Holt's Linear Exponential Smoothing forecast (with trend).
    """
    n = len(history_series)
    if n < 2:
        return [history_series[-1]] * steps if n == 1 else [0] * steps

    # Initial levels and trends
    level = history_series[0]
    trend = history_series[1] - history_series[0]
    
    levels = [level]
    trends = [trend]
    
    for i in range(1, n):
        val = history_series[i]
        last_level = levels[-1]
        last_trend = trends[-1]
        
        # Holt's equations
        level = alpha * val + (1 - alpha) * (last_level + last_trend)
        trend = beta * (level - last_level) + (1 - beta) * last_trend
        
        levels.append(level)
        trends.append(trend)
        
    # Project future
    forecast = []
    final_level = levels[-1]
    final_trend = trends[-1]
    for h in range(1, steps + 1):
        forecast.append(final_level + h * final_trend)
        
    return forecast

def forecast_linear_regression(history_series, steps=12):
    """
    Fits a linear regression model and projects it.
    """
    n = len(history_series)
    if n == 0:
        return [0] * steps
    
    X = np.arange(n).reshape(-1, 1)
    y = np.array(history_series)
    
    model = LinearRegression()
    model.fit(X, y)
    
    X_pred = np.arange(n, n + steps).reshape(-1, 1)
    predictions = model.predict(X_pred)
    
    # Cap values at 0 for physical quantities (Revenue, Profit, Customers shouldn't plummet below 0 usually)
    predictions = [max(0.0, float(val)) for val in predictions]
    return predictions

def generate_forecasts(history_df, metric_col, model_type="linear", steps=12):
    """
    history_df: DataFrame with 'year_month' and metric_col
    metric_col: Name of column to forecast (e.g., 'revenue', 'profit', 'customers')
    model_type: 'moving_average', 'exponential_smoothing', or 'linear'
    
    Returns list of forecasted values for the next 12 periods.
    """
    # Sort history just in case
    history_df = history_df.sort_values("year_month")
    history_series = history_df[metric_col].tolist()
    
    if len(history_series) == 0:
        return [0] * steps
        
    if model_type == "moving_average":
        return forecast_moving_average(history_series, window=4, steps=steps)
    elif model_type == "exponential_smoothing":
        return forecast_exponential_smoothing(history_series, alpha=0.4, beta=0.2, steps=steps)
    else: # linear regression
        return forecast_linear_regression(history_series, steps=steps)
