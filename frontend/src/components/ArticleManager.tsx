import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import articleService, { Article } from '../services/articleService'
import LoadingSpinner from './LoadingSpinner'

interface ArticleManagerProps {
  onArticleSelect?: (article: Article) => void
}

const ArticleManager: React.FC<ArticleManagerProps> = ({ onArticleSelect }) => {
  const { user } = useAuth()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedArticles, setSelectedArticles] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<'publish' | 'unpublish' | 'delete' | ''>('')
  const [stats, setStats] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')

  useEffect(() => {
    if (user) {
      loadArticles()
      loadStats()
    }
  }, [user, filter])

  const loadArticles = async () => {
    try {
      setLoading(true)
      const response = await articleService.getMyArticles({ limit: 50 })
      let filteredArticles = response.articles

      if (filter === 'published') {
        filteredArticles = response.articles.filter(article => article.published)
      } else if (filter === 'draft') {
        filteredArticles = response.articles.filter(article => !article.published)
      }

      setArticles(filteredArticles)
    } catch (error) {
      console.error('Error loading articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await articleService.getArticleStats()
      setStats(response.stats)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleSelectArticle = (articleId: string) => {
    setSelectedArticles(prev => 
      prev.includes(articleId) 
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    )
  }

  const handleSelectAll = () => {
    if (selectedArticles.length === articles.length) {
      setSelectedArticles([])
    } else {
      setSelectedArticles(articles.map(article => article.id))
    }
  }

  const handleBulkAction = async () => {
    if (!bulkAction || selectedArticles.length === 0) return

    try {
      setLoading(true)
      
      if (bulkAction === 'delete') {
        await articleService.bulkDeleteArticles(selectedArticles)
      } else {
        const updates = { published: bulkAction === 'publish' }
        await articleService.bulkUpdateArticles(selectedArticles, updates)
      }

      setSelectedArticles([])
      setBulkAction('')
      await loadArticles()
      await loadStats()
    } catch (error) {
      console.error('Bulk action error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return

    try {
      await articleService.deleteArticle(articleId)
      await loadArticles()
      await loadStats()
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const handleTogglePublish = async (article: Article) => {
    try {
      await articleService.updateArticle(article.id, { 
        published: !article.published 
      })
      await loadArticles()
      await loadStats()
    } catch (error) {
      console.error('Toggle publish error:', error)
    }
  }

  if (loading && articles.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Articles</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalArticles}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Published</h3>
            <p className="text-2xl font-bold text-green-600">{stats.publishedArticles}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Views</h3>
            <p className="text-2xl font-bold text-primary-600">{stats.totalViews}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Likes</h3>
            <p className="text-2xl font-bold text-red-600">{stats.totalLikes}</p>
          </div>
        </div>
      )}

      {/* Filters and Bulk Actions */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Filter Tabs */}
          <div className="flex space-x-1">
            {(['all', 'published', 'draft'] as const).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === filterType
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>

          {/* Bulk Actions */}
          {selectedArticles.length > 0 && (
            <div className="flex items-center space-x-2">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select Action</option>
                <option value="publish">Publish</option>
                <option value="unpublish">Unpublish</option>
                <option value="delete">Delete</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-md hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Apply ({selectedArticles.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedArticles.length === articles.length && articles.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedArticles.includes(article.id)}
                      onChange={() => handleSelectArticle(article.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {article.featuredImage && (
                        <img
                          src={article.featuredImage.url}
                          alt=""
                          className="h-10 w-10 rounded object-cover mr-3"
                        />
                      )}
                      <div>
                        <div 
                          className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:text-primary-600"
                          onClick={() => onArticleSelect?.(article)}
                        >
                          {article.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {article.category} • {article.readTime} min read
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      article.published
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                    }`}>
                      {article.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex space-x-4">
                      <span>👁 {article.views}</span>
                      <span>❤️ {article.likesCount}</span>
                      <span>💬 {article.commentsCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(article.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleTogglePublish(article)}
                        className={`px-3 py-1 text-xs font-medium rounded ${
                          article.published
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300'
                            : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
                        }`}
                      >
                        {article.published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => onArticleSelect?.(article)}
                        className="px-3 py-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteArticle(article.id)}
                        className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {articles.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              {filter === 'all' ? 'No articles found' : `No ${filter} articles found`}
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}
    </div>
  )
}

export default ArticleManager