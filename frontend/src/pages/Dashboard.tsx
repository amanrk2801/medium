import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import ArticleManager from '../components/ArticleManager'
import { Article } from '../services/articleService'

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const handleArticleSelect = (article: Article) => {
    navigate(`/write/${article.id}`)
  }

  const handleNewArticle = () => {
    navigate('/write')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your articles and track your writing progress
              </p>
            </div>
            <button
              onClick={handleNewArticle}
              className="px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors shadow-lg hover:shadow-xl"
            >
              Write New Article
            </button>
          </div>
        </div>

        {/* Article Manager */}
        <ArticleManager onArticleSelect={handleArticleSelect} />
      </div>
    </div>
  )
}

export default Dashboard