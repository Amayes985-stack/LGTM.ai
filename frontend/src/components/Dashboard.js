import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Shield, Code, AlertTriangle, Loader } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/metrics/dashboard`);
      setMetrics(response.data);
    } catch (err) {
      setError('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-state">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4" data-testid="error-state">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Reviews',
      value: metrics?.total_reviews || 0,
      icon: Code,
      color: 'blue',
      testId: 'total-reviews'
    },
    {
      title: 'Vulnerabilities Found',
      value: metrics?.total_vulnerabilities || 0,
      icon: AlertTriangle,
      color: 'red',
      testId: 'total-vulnerabilities'
    },
    {
      title: 'Avg Security Score',
      value: metrics?.avg_security_score?.toFixed(1) || '0.0',
      icon: Shield,
      color: 'green',
      testId: 'avg-security-score'
    },
    {
      title: 'Avg Maintainability',
      value: metrics?.avg_maintainability?.toFixed(1) || '0.0',
      icon: TrendingUp,
      color: 'purple',
      testId: 'avg-maintainability'
    }
  ];

  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    red: 'from-red-500 to-red-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600'
  };

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div>
        <h2 className="text-2xl font-bold text-gray-900" data-testid="page-title">
          Code Quality Dashboard
        </h2>
        <p className="text-gray-600 mt-1">
          Track metrics and trends across all your code reviews
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
              data-testid={stat.testId}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 bg-gradient-to-br ${colorMap[stat.color]} rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      {metrics?.recent_metrics && metrics.recent_metrics.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Security Score Trend */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Security Score Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.recent_metrics.slice(-10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tickFormatter={() => ''} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="security_score"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Security Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Maintainability Trend */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Maintainability Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.recent_metrics.slice(-10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tickFormatter={() => ''} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="maintainability_score"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Maintainability"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Complexity Bar Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Code Complexity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.recent_metrics.slice(-10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tickFormatter={() => ''} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="complexity_score" fill="#f59e0b" name="Complexity" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Lines of Code */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Lines of Code Analyzed</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.recent_metrics.slice(-10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" tickFormatter={() => ''} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="lines_of_code" fill="#3b82f6" name="Lines" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <Code className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Yet</h3>
          <p className="text-gray-600">
            Start analyzing code to see metrics and trends here
          </p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
