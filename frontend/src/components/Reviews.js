import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Loader, Shield, Code, Calendar, GitPullRequest } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/reviews`);
      setReviews(response.data.reviews || []);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    return type === 'github_pr' ? GitPullRequest : Code;
  };

  const getTypeBadge = (type) => {
    return type === 'github_pr'
      ? 'bg-purple-100 text-purple-800'
      : 'bg-blue-100 text-blue-800';
  };

  const getTypeLabel = (type) => {
    return type === 'github_pr' ? 'GitHub PR' : 'Manual';
  };

  return (
    <div className="space-y-6" data-testid="reviews-page">
      <div>
        <h2 className="text-2xl font-bold text-gray-900" data-testid="page-title">
          Code Reviews
        </h2>
        <p className="text-gray-600 mt-1">
          View all code review history and results
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : reviews.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reviews.map((review) => {
            const TypeIcon = getTypeIcon(review.type);
            return (
              <div
                key={review.review_id}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedReview(review)}
                data-testid={`review-card-${review.review_id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <TypeIcon className="w-5 h-5 text-blue-600 mr-2" />
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeBadge(review.type)}`}>
                      {getTypeLabel(review.type)}
                    </span>
                  </div>
                  {review.overall_score && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Score</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {review.overall_score.toFixed(0)}
                      </p>
                    </div>
                  )}
                </div>

                {review.type === 'github_pr' && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-900">{review.repo}</p>
                    <p className="text-xs text-gray-600">PR #{review.pr_number}</p>
                  </div>
                )}

                {review.type === 'manual' && review.filename && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-900">{review.filename}</p>
                    <p className="text-xs text-gray-600">{review.language}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-sm">
                    <Code className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">
                      {review.suggestions?.length || 0} suggestions
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Shield className="w-4 h-4 text-red-400 mr-2" />
                    <span className="text-gray-600">
                      {review.security_issues?.length || 0} security issues
                    </span>
                  </div>
                </div>

                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(review.created_at).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
          <p className="text-gray-600">
            Start analyzing code to see review history here
          </p>
        </div>
      )}

      {/* Review Detail Modal */}
      {selectedReview && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedReview(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            data-testid="review-detail-modal"
          >
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Review Details</h3>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="text-gray-400 hover:text-gray-600"
                  data-testid="close-modal-btn"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Suggestions */}
              {selectedReview.suggestions && selectedReview.suggestions.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">Suggestions</h4>
                  <div className="space-y-3">
                    {selectedReview.suggestions.map((suggestion, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {suggestion.category}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                            {suggestion.severity}
                          </span>
                        </div>
                        <h5 className="font-semibold text-gray-900">{suggestion.title}</h5>
                        <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Security Issues */}
              {selectedReview.security_issues && selectedReview.security_issues.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                    <Shield className="w-5 h-5 text-red-600 mr-2" />
                    Security Issues
                  </h4>
                  <div className="space-y-3">
                    {selectedReview.security_issues.map((issue, idx) => (
                      <div key={idx} className="border border-red-200 bg-red-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-red-200 text-red-900 rounded text-xs font-medium">
                            {issue.severity}
                          </span>
                          {issue.line_number && (
                            <span className="text-xs text-red-700">Line {issue.line_number}</span>
                          )}
                        </div>
                        <h5 className="font-semibold text-red-900">{issue.title}</h5>
                        <p className="text-sm text-red-800 mt-1">{issue.description}</p>
                        {issue.code_snippet && (
                          <div className="mt-2 bg-gray-900 rounded p-2">
                            <code className="text-xs text-gray-100">{issue.code_snippet}</code>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reviews;
