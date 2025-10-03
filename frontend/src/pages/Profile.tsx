import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { Edit, Trash2, Eye, PenTool, Bookmark } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import articleService from '../services/articleService'
import { useAuth } from '../contexts/AuthContext'
import Avatar from '../components/Avatar'
import LoadingSpinner from '../components/LoadingSpinner'
import ArticleCard from '../components/ArticleCard'

const Profile = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'articles'

  const { data: articlesData, isLoading: isLoadingArticles } = useQuery(
    ['my-articles'],
    () => articleService.getMyArticles({ limit: 50 }),
    {
      enabled: activeTab === 'articles',
    }
  )

  const { data: bookmarksData, isLoading: isLoadingBookmarks } = useQuery(
    ['bookmarked-articles'],
    () => articleService.getBookmarkedArticles({ limit: 50 }),
    {
      enabled: activeTab === 'bookmarks',
    }
  )

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab })
  }

  const publishedArticles = articlesData?.articles.filter(article => article.published) || []
  const draftArticles = articlesData?.articles.filter(article => !article.published) || []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Avatar user={user} size="xl" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {user?.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
                {user?.bio && (
                  <p className="text-gray-700 dark:text-gray-300 mt-2">{user.bio}</p>
                )}
                <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>{publishedArticles.length} articles published</span>
                  <span>·</span>
                  <span>{user?.followers?.length || 0} followers</span>
                  <span>·</span>
                  <span>{user?.following?.length || 0} following</span>
                </div>
              </div>
            </div>
            
            <Link to="/write" className="btn btn-primary flex items-center">
              <PenTool className="w-4 h-4 mr-2" />
              Write Article
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('articles')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'articles'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                My Articles ({articlesData?.articles.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('bookmarks')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bookmarks'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Bookmarks ({bookmarksData?.articles.length || 0})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* My Articles Tab */}
            {activeTab === 'articles' && (
              <>
                {isLoadingArticles ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : (
                  <>
                    {articlesData?.articles.length === 0 ? (
                      <div className="text-center py-12">
                        <PenTool className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No articles yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Start writing your first article to share your thoughts with the world.
                        </p>
                        <Link to="/write" className="btn btn-primary">
                          Write your first article
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {/* Published Articles */}
                        {publishedArticles.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                              Published ({publishedArticles.length})
                            </h3>
                            <div className="space-y-4">
                              {publishedArticles.map((article) => (
                                <div
                                  key={article.id}
                                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <Link
                                        to={`/article/${article.id}`}
                                        className="text-xl font-bold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                      >
                                        {article.title}
                                      </Link>
                                      <p className="text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                                        {article.excerpt}
                                      </p>
                                      <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                                        <span>
                                          {formatDistanceToNow(new Date(article.publishedAt!), {
                                            addSuffix: true,
                                          })}
                                        </span>
                                        <span>·</span>
                                        <span>{article.readTime} min read</span>
                                        <span>·</span>
                                        <span>{article.views} views</span>
                                        <span>·</span>
                                        <span>{article.likesCount} likes</span>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2 ml-4">
                                      <Link
                                        to={`/article/${article.id}`}
                                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                        title="View article"
                                      >
                                        <Eye className="w-5 h-5" />
                                      </Link>
                                      <Link
                                        to={`/write/${article.id}`}
                                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                        title="Edit article"
                                      >
                                        <Edit className="w-5 h-5" />
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Draft Articles */}
                        {draftArticles.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                              Drafts ({draftArticles.length})
                            </h3>
                            <div className="space-y-4">
                              {draftArticles.map((article) => (
                                <div
                                  key={article.id}
                                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-yellow-50 dark:bg-yellow-900/20"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <span className="px-2 py-1 text-xs bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded">
                                          Draft
                                        </span>
                                      </div>
                                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {article.title}
                                      </h3>
                                      <p className="text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                                        {article.excerpt}
                                      </p>
                                      <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                                        <span>
                                          Last edited{' '}
                                          {formatDistanceToNow(new Date(article.createdAt), {
                                            addSuffix: true,
                                          })}
                                        </span>
                                        <span>·</span>
                                        <span>{article.readTime} min read</span>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2 ml-4">
                                      <Link
                                        to={`/write/${article.id}`}
                                        className="btn btn-primary btn-sm"
                                      >
                                        Continue writing
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* Bookmarks Tab */}
            {activeTab === 'bookmarks' && (
              <>
                {isLoadingBookmarks ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : (
                  <>
                    {bookmarksData?.articles.length === 0 ? (
                      <div className="text-center py-12">
                        <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No bookmarks yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Bookmark articles you want to read later.
                        </p>
                        <Link to="/" className="btn btn-primary">
                          Explore articles
                        </Link>
                      </div>
                    ) : (
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {bookmarksData?.articles.map((article) => (
                          <ArticleCard key={article.id} article={article} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile