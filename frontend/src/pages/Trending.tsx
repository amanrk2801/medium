import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import articleService, { Article } from '../services/articleService'
import ArticleCard from '../components/ArticleCard'
import LoadingSpinner from '../components/LoadingSpinner'

const Trending: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<7 | 30 | 90>(7)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    loadTrendingArticles(true)
  }, [timeframe])

  const loadTrendingArticles = async (reset = false) => {
    try {
      setLoading(true)
      const currentPage = reset ? 1 : page
      
      const response = await articleService.getTrendingArticles({
        page: currentPage,
        limit: 10,
        days: timeframe
      })

      if (reset) {
        setArticles(response.articles)
        setPage(2)
      } else {
        setArticles(prev => [...prev, ...response.articles])
        setPage(prev => prev + 1)
      }

      setHasMore(currentPage < response.pagination.pages)
    } catch (error) {
      console.error('Error loading trending articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTimeframeChange = (newTimeframe: 7 | 30 | 90) => {
    setTimeframe(newTimeframe)
    setPage(1)
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      loadTrendingArticles()
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🔥 Trending Articles
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Discover the most popular articles based on views, likes, and engagement
        </p>
      </div>

      {/* Timeframe Filter */}
      <div className="mb-8">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { value: 7, label: 'Last 7 days' },
            { value: 30, label: 'Last 30 days' },
            { value: 90, label: 'Last 3 months' }
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleTimeframeChange(value as 7 | 30 | 90)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                timeframe === value
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {loading && articles.length === 0 ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            No trending articles found for the selected timeframe
          </div>
          <Link
            to="/"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
          >
            Browse all articles
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {articles.map((article, index) => (
              <div key={article.id} className="relative">
                {/* Trending Rank */}
                <div className="absolute -left-4 top-4 z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-600' :
                    'bg-primary-500'
                  }`}>
                    {index + 1}
                  </div>
                </div>

                {/* Article Card */}
                <div className="ml-6">
                  <ArticleCard article={article} />
                </div>

                {/* Trending Stats */}
                <div className="ml-6 mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center">
                    👁 {article.views} views
                  </span>
                  <span className="flex items-center">
                    ❤️ {article.likesCount} likes
                  </span>
                  <span className="flex items-center">
                    💬 {article.commentsCount} comments
                  </span>
                  <span className="flex items-center">
                    📅 {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}

          {!hasMore && articles.length > 0 && (
            <div className="text-center mt-8 text-gray-500 dark:text-gray-400">
              You've reached the end of trending articles
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Trending