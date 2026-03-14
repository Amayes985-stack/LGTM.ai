import React, { useState } from 'react';
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Code, Shield, Zap, CheckCircle, AlertTriangle, XCircle, Loader } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function ManualAnalysis() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [filename, setFilename] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!code.trim()) {
      setError('Please enter some code to analyze');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/analyze/manual`, {
        code,
        language,
        filename: filename || null
      });

      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze code. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[severity] || colors.medium;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      security: Shield,
      architecture: Code,
      performance: Zap,
      quality: CheckCircle,
      best_practices: CheckCircle
    };
    return icons[category] || CheckCircle;
  };

  const sampleCode = {
    python: `def process_user_input(user_input):
    # Dangerous: SQL injection vulnerability
    query = "SELECT * FROM users WHERE id = " + user_input
    result = execute_query(query)
    return result

# Hardcoded credentials
api_key = "sk-1234567890abcdef"`,
    javascript: `function updateProfile(username) {
  // XSS vulnerability
  document.getElementById('profile').innerHTML = username;
  
  // Hardcoded API key
  const apiKey = "pk_live_1234567890";
  
  localStorage.setItem('password', userPassword);
}`,
    cpp: `#include <iostream>
#include <cstring>

int main() {
    char buffer[10];
    char password[] = "secret123";  // Hardcoded credential
    
    // Buffer overflow vulnerability
    strcpy(buffer, userInput);
    
    // Format string vulnerability
    printf(userInput);
    
    // Command injection risk
    system(command);
    
    return 0;
}`
  };

  const loadSample = () => {
    const fileExtensions = {
      'javascript': 'js',
      'typescript': 'ts',
      'python': 'py',
      'cpp': 'cpp',
      'c': 'c',
      'html': 'html',
      'css': 'css',
      'sql': 'sql'
    };
    setCode(sampleCode[language] || sampleCode.python);
    setFilename(`sample.${fileExtensions[language] || language}`);
  };

  return (
    <div className="space-y-6" data-testid="manual-analysis-page">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900" data-testid="page-title">
              Manual Code Analysis
            </h2>
            <p className="text-gray-600 mt-1">
              Paste your code below for instant AI-powered review
            </p>
          </div>
          <button
            onClick={loadSample}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            data-testid="load-sample-btn"
          >
            Load Sample
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="language-select"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="sql">SQL</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filename (optional)
              </label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="e.g., app.py"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="filename-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code
            </label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here..."
              rows={15}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm code-editor"
              data-testid="code-input"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start" data-testid="error-message">
              <XCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
            data-testid="analyze-btn"
          >
            {analyzing ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Code className="w-5 h-5 mr-2" />
                Analyze Code
              </>
            )}
          </button>
        </div>
      </div>

      {results && (
        <div className="space-y-6" data-testid="analysis-results">
          {/* Overall Score */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Analysis Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="metric-card bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <p className="text-sm font-medium text-blue-600">Overall Score</p>
                <p className="text-3xl font-bold text-blue-900 mt-2" data-testid="overall-score">
                  {results.overall_score.toFixed(1)}
                </p>
              </div>
              <div className="metric-card bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <p className="text-sm font-medium text-green-600">Maintainability</p>
                <p className="text-3xl font-bold text-green-900 mt-2" data-testid="maintainability-score">
                  {results.metrics.maintainability_score.toFixed(0)}
                </p>
              </div>
              <div className="metric-card bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <p className="text-sm font-medium text-purple-600">Security</p>
                <p className="text-3xl font-bold text-purple-900 mt-2" data-testid="security-score">
                  {results.metrics.security_score.toFixed(0)}
                </p>
              </div>
              <div className="metric-card bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <p className="text-sm font-medium text-orange-600">Complexity</p>
                <p className="text-3xl font-bold text-orange-900 mt-2" data-testid="complexity-score">
                  {results.metrics.complexity_score.toFixed(0)}
                </p>
              </div>
            </div>
          </div>

          {/* Security Issues */}
          {results.security_issues && results.security_issues.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <Shield className="w-6 h-6 text-red-600 mr-2" />
                <h3 className="text-xl font-bold text-gray-900">
                  Security Issues ({results.security_issues.length})
                </h3>
              </div>
              <div className="space-y-3">
                {results.security_issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`suggestion-card border rounded-lg p-4 ${getSeverityColor(issue.severity)}`}
                    data-testid={`security-issue-${idx}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-semibold text-sm mr-2">Line {issue.line_number}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                            {issue.severity.toUpperCase()}
                          </span>
                        </div>
                        <h4 className="font-bold mt-2">{issue.title}</h4>
                        <p className="text-sm mt-1">{issue.description}</p>
                        {issue.code_snippet && (
                          <div className="mt-2 bg-gray-900 rounded p-2">
                            <code className="text-xs text-gray-100">{issue.code_snippet}</code>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {results.suggestions && results.suggestions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Suggestions ({results.suggestions.length})
              </h3>
              <div className="space-y-3">
                {results.suggestions.map((suggestion, idx) => {
                  const Icon = getCategoryIcon(suggestion.category);
                  return (
                    <div
                      key={idx}
                      className="suggestion-card border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      data-testid={`suggestion-${idx}`}
                    >
                      <div className="flex items-start">
                        <Icon className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              {suggestion.category}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(suggestion.severity)}`}>
                              {suggestion.severity}
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-900">{suggestion.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                          {suggestion.recommendation && (
                            <div className="mt-2 bg-green-50 border border-green-200 rounded p-2">
                              <p className="text-sm text-green-800">
                                <strong>Recommendation:</strong> {suggestion.recommendation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ManualAnalysis;
