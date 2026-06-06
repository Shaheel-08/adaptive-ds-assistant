import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import MetricCard from '../components/MetricCard';
import ChartPanel from '../components/ChartPanel';
import InsightPanel from '../components/InsightPanel';
import DataPreview from '../components/DataPreview';

export default function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract data from navigation state
  const data = location.state?.results;
  const filename = location.state?.filename;

  // Redirect if no data
  useEffect(() => {
    if (!data) {
      navigate('/upload');
    }
  }, [data, navigate]);

  if (!data) return null;

  // Formatting helpers
  const getProblemTypeBadge = (type) => {
    switch(type) {
      case 'classification': return <span className="badge badge-blue">Classification</span>;
      case 'regression':     return <span className="badge badge-green">Regression</span>;
      case 'clustering':     return <span className="badge badge-purple">Clustering</span>;
      case 'time-series':    return <span className="badge badge-yellow">Time-Series</span>;
      default:               return <span className="badge badge-cyan">Unknown</span>;
    }
  };

  const {
    problemType,
    targetColumn,
    recommendedModel,
    accuracy,
    datasetSummary,
    featureImportance,
    modelComparison,
    insights,
    distributionChart,
    clusterChart,
    trendData,
    classDistribution
  } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white">Analysis Results</h1>
            {getProblemTypeBadge(problemType)}
          </div>
          <p className="text-slate-400 text-sm">
            Dataset: <span className="text-slate-300 font-mono">{filename || 'upload.csv'}</span> 
            {targetColumn && <span> • Target: <span className="text-abb-accent font-mono">{targetColumn}</span></span>}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="btn-secondary py-2 text-sm" onClick={() => window.print()}>
            <svg className="w-4 h-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Export PDF
          </button>
          <Link to="/upload" className="btn-primary py-2 text-sm">New Analysis</Link>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Recommended Model"
          value={recommendedModel}
          icon="🤖"
          color="blue"
        />
        <MetricCard
          label={problemType === 'regression' ? 'R² Score' : (problemType === 'clustering' ? 'Silhouette Score' : 'Accuracy')}
          value={accuracy ? `${accuracy}%` : 'N/A'}
          icon="🎯"
          color={accuracy > 85 ? 'green' : (accuracy > 70 ? 'yellow' : 'red')}
          progress={accuracy}
        />
        <MetricCard
          label="Total Rows"
          value={datasetSummary?.rows?.toLocaleString() || 0}
          icon="📊"
          color="purple"
        />
        <MetricCard
          label="Missing Values"
          value={datasetSummary?.missingValues?.toLocaleString() || 0}
          icon="⚠️"
          color={datasetSummary?.missingValues > 0 ? 'yellow' : 'cyan'}
          subtitle={datasetSummary?.missingValues > 0 ? 'Auto-imputed' : 'Clean dataset'}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Left Column - Insights */}
        <div className="lg:col-span-1 space-y-6">
          <InsightPanel insights={insights} />
          
          {/* Model Comparison (if available) */}
          {modelComparison && modelComparison.length > 0 && (
            <div className="glass-card p-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-white font-semibold text-sm mb-4">Model Comparison</h3>
              <div className="space-y-4">
                {modelComparison.map((m, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">{m.model}</span>
                      <span className="font-mono text-abb-accent">{m.accuracy || m.r2 || m.silhouette}</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className={`progress-fill ${m.model === recommendedModel ? 'bg-abb-accent' : 'bg-slate-600'}`}
                        style={{ width: `${Math.min(100, Math.max(0, m.accuracy || (m.r2 * 100) || 0))}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Charts based on problem type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Classification: Class Distribution */}
            {problemType === 'classification' && classDistribution && classDistribution.length > 0 && (
              <ChartPanel 
                type="pie" 
                data={classDistribution} 
                title="Target Class Distribution" 
                nameKey="label" 
                dataKey="count" 
              />
            )}

            {/* Feature Importance (if available) */}
            {featureImportance && featureImportance.length > 0 && (
              <ChartPanel 
                type="bar" 
                data={featureImportance} 
                title="Top Feature Importance" 
                nameKey="feature" 
                dataKey="importance" 
              />
            )}

            {/* Clustering: Silhouette Score Chart */}
            {problemType === 'clustering' && clusterChart && clusterChart.length > 0 && (
              <ChartPanel 
                type="line" 
                data={clusterChart} 
                title="Silhouette Score vs Clusters (K)" 
                nameKey="k" 
                dataKey="silhouette" 
              />
            )}

            {/* Time-Series: Trend Data */}
            {problemType === 'time-series' && trendData && trendData.length > 0 && (
              <div className="md:col-span-2">
                <ChartPanel 
                  type="area" 
                  data={trendData} 
                  title="Time-Series Trend (Rolling Mean)" 
                  nameKey="index" 
                  dataKey="actual" 
                />
              </div>
            )}
            
            {/* Generic Numeric Distribution (Fallback) */}
            {distributionChart && distributionChart.length > 0 && problemType !== 'time-series' && (
              <ChartPanel 
                type="bar" 
                data={distributionChart} 
                title="Primary Numeric Distribution" 
                nameKey="bin" 
                dataKey="count" 
              />
            )}

          </div>
          
        </div>
      </div>

      {/* Dataset Preview Table */}
      {datasetSummary?.sampleData && datasetSummary.sampleData.length > 0 && (
        <DataPreview 
          data={datasetSummary.sampleData} 
          columns={datasetSummary.columnNames} 
        />
      )}

    </div>
  );
}
