import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GitBranch, Plus, Loader, CheckCircle, ExternalLink } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function Repositories() {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    repo_url: '',
    repo_name: '',
    owner: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/repositories`);
      setRepositories(response.data.repositories || []);
    } catch (err) {
      console.error('Failed to fetch repositories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.post(`${API_BASE_URL}/api/repositories`, formData);
      setFormData({ repo_url: '', repo_name: '', owner: '' });
      setShowAddForm(false);
      fetchRepositories();
    } catch (err) {
      console.error('Failed to add repository:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="repositories-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" data-testid="page-title">
            GitHub Repositories
          </h2>
          <p className="text-gray-600 mt-1">
            Manage repositories for automated PR reviews
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          data-testid="add-repo-btn"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Repository
        </button>
      </div>

      {/* Add Repository Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200" data-testid="add-repo-form">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Repository</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Repository URL
              </label>
              <input
                type="url"
                value={formData.repo_url}
                onChange={(e) => setFormData({ ...formData, repo_url: e.target.value })}
                placeholder="https://github.com/username/repo"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                data-testid="repo-url-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repository Name
                </label>
                <input
                  type="text"
                  value={formData.repo_name}
                  onChange={(e) => setFormData({ ...formData, repo_name: e.target.value })}
                  placeholder="my-repo"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  data-testid="repo-name-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner
                </label>
                <input
                  type="text"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  placeholder="username"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  data-testid="repo-owner-input"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                data-testid="submit-repo-btn"
              >
                {submitting ? 'Adding...' : 'Add Repository'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">📝 GitHub Webhook Setup</h4>
            <p className="text-sm text-blue-800 mb-3">
              To enable automated PR reviews, configure a webhook in your GitHub repository:
            </p>
            <ol className="text-sm text-blue-800 space-y-2 ml-4 list-decimal">
              <li>Go to your GitHub repository → Settings → Webhooks → Add webhook</li>
              <li>Payload URL: <code className="bg-blue-100 px-2 py-1 rounded">{API_BASE_URL}/api/webhooks/github</code></li>
              <li>Content type: <code className="bg-blue-100 px-2 py-1 rounded">application/json</code></li>
              <li>Select events: <strong>Pull requests</strong></li>
              <li>Active: ✓ Enabled</li>
            </ol>
          </div>
        </div>
      )}

      {/* Repositories List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : repositories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {repositories.map((repo) => (
            <div
              key={repo.repo_id}
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
              data-testid={`repo-card-${repo.repo_id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <GitBranch className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="font-bold text-gray-900">{repo.repo_name}</h3>
                </div>
                {repo.active && (
                  <span className="flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">Owner: {repo.owner}</p>
              <a
                href={repo.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center"
              >
                View on GitHub
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
              <p className="text-xs text-gray-400 mt-4">
                Added {new Date(repo.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <GitBranch className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Repositories Yet</h3>
          <p className="text-gray-600 mb-4">
            Add your first repository to start automated code reviews
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Repository
          </button>
        </div>
      )}
    </div>
  );
}

export default Repositories;
