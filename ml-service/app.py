import os
import io
import json
import warnings
import traceback

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from flask import Flask, request, jsonify
from flask_cors import CORS

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.cluster import KMeans
from sklearn.metrics import (
    accuracy_score, classification_report, r2_score,
    mean_squared_error, silhouette_score
)
from sklearn.impute import SimpleImputer

warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ─────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────

def detect_problem_type(df):
    """
    Heuristic to decide problem type from the dataframe.
    Priority: time-series > classification > regression > clustering
    """
    # 1. Time-series: explicit datetime column
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            return 'time-series', col
        elif df[col].dtype == object:
            try:
                # Try parsing object columns, avoid parsing purely numeric ones
                parsed = pd.to_datetime(df[col], errors='coerce')
                if parsed.notna().sum() / len(df) > 0.7:
                    return 'time-series', col
            except Exception:
                pass

    if len(df.columns) < 2:
        return 'clustering', None

    # 2. Try to identify a target column (last column convention)
    target_col = df.columns[-1]
    target_series = df[target_col]
    n_unique = target_series.nunique()

    # Classification: categorical/string or low-cardinality integer
    if target_series.dtype == object or str(target_series.dtype) == 'category' or n_unique <= 20:
        return 'classification', target_col

    # Regression: continuous numeric
    if pd.api.types.is_numeric_dtype(target_series) and n_unique > 20:
        return 'regression', target_col

    # Default fallback: clustering
    return 'clustering', None


def preprocess(df, target_col=None, problem_type=None):
    """
    Generic preprocessing:
      - Drop columns that are entirely null
      - Impute numeric (median) and categorical (most_frequent)
      - Label-encode categorical features
      - Scale numeric features
    Returns: X, y (or None), feature_names, encoders
    """
    df = df.copy()
    df.dropna(axis=1, how='all', inplace=True)

    if target_col and target_col in df.columns and problem_type != 'clustering':
        y_raw = df[target_col].copy()
        df.drop(columns=[target_col], inplace=True)
    else:
        y_raw = None

    # Separate numeric & categorical
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()

    # Remove datetime cols to avoid issues
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            df.drop(columns=[col], inplace=True)
            if col in num_cols:
                num_cols.remove(col)
            if col in cat_cols:
                cat_cols.remove(col)

    # Impute
    if num_cols:
        num_imputer = SimpleImputer(strategy='median')
        df[num_cols] = num_imputer.fit_transform(df[num_cols])

    encoders = {}
    if cat_cols:
        cat_imputer = SimpleImputer(strategy='most_frequent')
        df[cat_cols] = cat_imputer.fit_transform(df[cat_cols])
        for col in cat_cols:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
            encoders[col] = le

    # Scale
    scaler = StandardScaler()
    feature_names = df.columns.tolist()
    X = scaler.fit_transform(df[feature_names])

    # Process target
    y = None
    if y_raw is not None:
        if y_raw.dtype == object or problem_type == 'classification':
            le_target = LabelEncoder()
            y = le_target.fit_transform(y_raw.astype(str))
            encoders['__target__'] = le_target
        else:
            y = y_raw.values

    return X, y, feature_names, encoders


def run_classification(X_train, X_test, y_train, y_test, feature_names):
    """Train RF + LR, return metrics and feature importance."""
    # Random Forest
    rf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)
    rf_acc = float(accuracy_score(y_test, rf_pred))

    # Logistic Regression
    lr = LogisticRegression(max_iter=1000, random_state=42)
    lr.fit(X_train, y_train)
    lr_pred = lr.predict(X_test)
    lr_acc = float(accuracy_score(y_test, lr_pred))

    best_model = 'RandomForestClassifier' if rf_acc >= lr_acc else 'LogisticRegression'
    best_acc = max(rf_acc, lr_acc)

    # Feature importance from RF
    importance = rf.feature_importances_
    feat_imp = sorted(
        [{'feature': f, 'importance': float(round(i, 4))}
         for f, i in zip(feature_names, importance)],
        key=lambda x: x['importance'], reverse=True
    )[:10]

    model_comparison = [
        {'model': 'RandomForestClassifier', 'accuracy': round(rf_acc * 100, 2)},
        {'model': 'LogisticRegression', 'accuracy': round(lr_acc * 100, 2)},
    ]

    return {
        'recommendedModel': best_model,
        'accuracy': round(best_acc * 100, 2),
        'featureImportance': feat_imp,
        'modelComparison': model_comparison,
    }


def run_regression(X_train, X_test, y_train, y_test, feature_names):
    """Train LinearRegression + RF Regressor, return R² and RMSE."""
    # Linear Regression
    lr = LinearRegression()
    lr.fit(X_train, y_train)
    lr_pred = lr.predict(X_test)
    lr_r2 = float(r2_score(y_test, lr_pred))
    lr_rmse = float(np.sqrt(mean_squared_error(y_test, lr_pred)))

    # Random Forest Regressor
    rf = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)
    rf_r2 = float(r2_score(y_test, rf_pred))
    rf_rmse = float(np.sqrt(mean_squared_error(y_test, rf_pred)))

    best_model = 'RandomForestRegressor' if rf_r2 >= lr_r2 else 'LinearRegression'
    best_r2 = max(rf_r2, lr_r2)

    feat_imp = sorted(
        [{'feature': f, 'importance': float(round(i, 4))}
         for f, i in zip(feature_names, rf.feature_importances_)],
        key=lambda x: x['importance'], reverse=True
    )[:10]

    model_comparison = [
        {'model': 'LinearRegression', 'r2': round(lr_r2, 4), 'rmse': round(lr_rmse, 4)},
        {'model': 'RandomForestRegressor', 'r2': round(rf_r2, 4), 'rmse': round(rf_rmse, 4)},
    ]

    return {
        'recommendedModel': best_model,
        'accuracy': round(best_r2 * 100, 2),
        'featureImportance': feat_imp,
        'modelComparison': model_comparison,
    }


def run_clustering(X, feature_names):
    """KMeans clustering with silhouette score."""
    best_k, best_score = 2, -1
    scores = []
    for k in range(2, min(8, len(X) // 2 + 1)):
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = km.fit_predict(X)
        if len(set(labels)) > 1:
            s = float(silhouette_score(X, labels))
            scores.append({'k': k, 'silhouette': round(s, 4)})
            if s > best_score:
                best_score, best_k = s, k

    km_final = KMeans(n_clusters=best_k, random_state=42, n_init=10)
    km_final.fit(X)

    cluster_chart = [{'k': s['k'], 'silhouette': s['silhouette']} for s in scores]

    return {
        'recommendedModel': 'KMeans',
        'accuracy': round(best_score * 100, 2),
        'optimalClusters': best_k,
        'clusterChart': cluster_chart,
        'featureImportance': [],
        'modelComparison': [],
    }


def run_timeseries(df, datetime_col):
    """Basic time-series analysis using rolling mean as proxy."""
    try:
        df_ts = df.copy()
        df_ts[datetime_col] = pd.to_datetime(df_ts[datetime_col], infer_datetime_format=True, errors='coerce')
        df_ts = df_ts.dropna(subset=[datetime_col])
        df_ts = df_ts.sort_values(datetime_col)

        numeric_cols = df_ts.select_dtypes(include=[np.number]).columns.tolist()
        if not numeric_cols:
            raise ValueError('No numeric columns for time-series analysis')

        target = numeric_cols[0]
        series = df_ts[target].dropna()

        # Rolling stats
        rolling_mean = series.rolling(window=min(7, len(series)//2)).mean()

        trend_data = [
            {'index': int(i), 'actual': float(round(v, 4)), 'rollingMean': float(round(m, 4)) if not np.isnan(m) else None}
            for i, (v, m) in enumerate(zip(series.values[-50:], rolling_mean.values[-50:]))
        ]

        return {
            'recommendedModel': 'ARIMA (Rolling Mean Baseline)',
            'accuracy': None,
            'trendData': trend_data,
            'targetSeries': target,
            'featureImportance': [],
            'modelComparison': [],
        }
    except Exception as e:
        return {
            'recommendedModel': 'ARIMA',
            'accuracy': None,
            'trendData': [],
            'featureImportance': [],
            'modelComparison': [],
            'error': str(e),
        }


def generate_insights(problem_type, result, dataset_summary, target_col):
    """Generate human-readable AI insights."""
    insights = []

    insights.append(
        f"Dataset contains {dataset_summary['rows']} rows and {dataset_summary['columns']} columns."
    )

    if dataset_summary['missingValues'] > 0:
        insights.append(
            f"Found {dataset_summary['missingValues']} missing values across the dataset — "
            f"these were automatically imputed using median/mode strategies."
        )
    else:
        insights.append("No missing values detected — the dataset is clean and complete.")

    if problem_type == 'classification':
        insights.append(
            f"Problem detected as Classification with target column '{target_col}'. "
            f"The best performing model is {result['recommendedModel']} "
            f"achieving {result['accuracy']}% accuracy on the test set."
        )
        if result.get('featureImportance'):
            top_feat = result['featureImportance'][0]['feature']
            insights.append(
                f"The most influential feature for prediction is '{top_feat}', "
                f"contributing {round(result['featureImportance'][0]['importance']*100,1)}% to the model's decisions."
            )

    elif problem_type == 'regression':
        insights.append(
            f"Problem detected as Regression with target column '{target_col}'. "
            f"{result['recommendedModel']} achieved an R² score of {result['accuracy']}%, "
            f"explaining a significant portion of variance in the target."
        )
        if result.get('featureImportance'):
            top_feat = result['featureImportance'][0]['feature']
            insights.append(
                f"Feature '{top_feat}' has the strongest linear relationship with the target variable."
            )

    elif problem_type == 'clustering':
        insights.append(
            f"No target column detected — Unsupervised Clustering applied. "
            f"Optimal number of clusters: {result.get('optimalClusters', 'N/A')} "
            f"(Silhouette Score: {result['accuracy']})."
        )

    elif problem_type == 'time-series':
        insights.append(
            f"Datetime column detected — Time Series analysis applied on '{result.get('targetSeries', 'N/A')}'. "
            f"Rolling mean trend has been computed for visual analysis."
        )

    insights.append(
        "All categorical features were automatically encoded and numeric features were standardized "
        "prior to model training for optimal performance."
    )

    return insights


# ─────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'Adaptive DS ML Engine'}), 200


@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Empty filename'}), 400

        if not file.filename.lower().endswith('.csv'):
            return jsonify({'error': 'Only CSV files are supported'}), 400

        # Read CSV
        content = file.read()
        df = pd.read_csv(io.BytesIO(content))

        if df.empty:
            return jsonify({'error': 'CSV file is empty'}), 400

        if len(df.columns) < 2:
            return jsonify({'error': 'CSV must have at least 2 columns'}), 400

        # Dataset summary
        missing_values = int(df.isnull().sum().sum())
        dataset_summary = {
            'rows': int(len(df)),
            'columns': int(len(df.columns)),
            'missingValues': missing_values,
            'columnNames': df.columns.tolist(),
            'dtypes': {col: str(dtype) for col, dtype in df.dtypes.items()},
            'numericColumns': df.select_dtypes(include=[np.number]).columns.tolist(),
            'categoricalColumns': df.select_dtypes(include=['object']).columns.tolist(),
            'sampleData': df.head(5).fillna('').to_dict(orient='records'),
            'statistics': json.loads(df.describe(include='all').fillna('').to_json()),
        }

        # Detect problem type
        problem_type, target_col = detect_problem_type(df)

        # Preprocess
        X, y, feature_names, encoders = preprocess(df.copy(), target_col, problem_type)

        result = {}

        if problem_type == 'classification':
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y if len(np.unique(y)) > 1 else None
            )
            result = run_classification(X_train, X_test, y_train, y_test, feature_names)

        elif problem_type == 'regression':
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            result = run_regression(X_train, X_test, y_train, y_test, feature_names)

        elif problem_type == 'clustering':
            result = run_clustering(X, feature_names)

        elif problem_type == 'time-series':
            result = run_timeseries(df, target_col)

        # Generate insights
        insights = generate_insights(problem_type, result, dataset_summary, target_col)

        # Build distribution chart data for first numeric col
        distribution_chart = []
        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if num_cols:
            col_data = df[num_cols[0]].dropna()
            hist_vals, bin_edges = np.histogram(col_data, bins=15)
            distribution_chart = [
                {'bin': round(float(bin_edges[i]), 2), 'count': int(hist_vals[i])}
                for i in range(len(hist_vals))
            ]

        # Class distribution for classification
        class_distribution = []
        if problem_type == 'classification' and target_col and target_col in df.columns:
            vc = df[target_col].value_counts()
            class_distribution = [
                {'label': str(k), 'count': int(v)}
                for k, v in vc.items()
            ]

        response = {
            'problemType': problem_type,
            'targetColumn': target_col,
            'recommendedModel': result.get('recommendedModel', 'N/A'),
            'accuracy': result.get('accuracy'),
            'datasetSummary': dataset_summary,
            'featureImportance': result.get('featureImportance', []),
            'modelComparison': result.get('modelComparison', []),
            'optimalClusters': result.get('optimalClusters'),
            'clusterChart': result.get('clusterChart', []),
            'trendData': result.get('trendData', []),
            'distributionChart': distribution_chart,
            'classDistribution': class_distribution,
            'insights': insights,
        }

        return jsonify(response), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e), 'trace': traceback.format_exc()}), 500


if __name__ == '__main__':
    print("🚀 Adaptive DS ML Engine starting on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
