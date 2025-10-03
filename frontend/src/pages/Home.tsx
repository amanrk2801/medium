import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, TrendingUp, BookOpen, Users, Zap, ArrowRight, Heart, MessageCircle } from 'lucide-react'
import articleService from '../services/articleService'
import ArticleCard from '../components/ArticleCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../contexts/AuthContext'

const categories = [
  'All',
  'Technology',
  'Health',
  'Business',
  'Science',
  'Politics',
  'Sports',
  'Entertainment',
  'Other',
]

const Home = () => {
  const { isAuthenticated } = useAuth()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [page, setPage] = useState(1)
  const [featuredArticles, setFeaturedArticles] = useState<any[]>([])
  const [trendingArticles, setTrendingArticles] = useState<any[]>([])
  const [stats, setStats] = useState({ articles: 0, writers: 0, reads: 0 })

  // Load featured and trending articles
  useEffect(() => {
    const loadFeaturedContent = async () => {
      try {
        // Load trending articles
        const trendingResponse = await articleService.getTrendingArticles({ limit: 6 })
        setTrendingArticles(trendingResponse.articles.slice(0, 6))

        // Load latest articles as featured
        const featuredResponse = await articleService.getArticles({ limit: 3 })
        setFeaturedArticles(featuredResponse.articles.slice(0, 3))

        // Mock stats (you can replace with real API calls)
        setStats({
          articles: featuredResponse.pagination.total || 0,
          writers: Math.floor((featuredResponse.pagination.total || 0) * 0.3),
          reads: Math.floor((featuredResponse.pagination.total || 0) * 150)
        })
      } catch (error) {
        console.error('Error loading featured content:', error)
      }
    }

    loadFeaturedContent()
  }, [])

  // Load articles based on filters
  const loadArticles = async () => {
    try {
      const params: any = {
        page,
        limit: 12,
      }
      
      if (search && search.trim()) {
        params.search = search.trim()
      }
      
      if (category && category !== 'All') {
        params.category = category
      }
      
      return await articleService.getArticles(params)
    } catch (error) {
      console.error('Error loading articles:', error)
      throw error
    }
  }

  const [articlesData, setArticlesData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await loadArticles()
        setArticlesData(data)
      } catch (err) {
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchArticles()
  }, [search, category, page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory)
    setPage(1)
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Failed to load articles. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-yellow-50 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="absolute inset-0 opacity-30 dark:opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, #f59e0b 2px, transparent 2px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Hero Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-medium mb-6">
                <Zap className="w-4 h-4 mr-2" />
                Where ideas come to life
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                Stay <span className="text-yellow-500">curious</span>.
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Discover stories, thinking, and expertise from writers on any topic. 
                Join a community of curious minds.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {!isAuthenticated ? (
                  <>
                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Start reading
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-900 dark:border-white text-gray-900 dark:text-white rounded-full font-semibold hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 transition-all duration-200"
                    >
                      Sign in
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/write"
                    className="inline-flex items-center justify-center px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Start writing
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                )}
              </div>

              {/* Stats */}
              <div className="flex justify-center lg:justify-start space-x-8 mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.articles}+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Articles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.writers}+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Writers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.reads}K+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Reads</div>
                </div>
              </div>
            </div>

            {/* Right Column - Featured Articles Preview */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl transform rotate-3 opacity-20"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Featured Stories</h3>
                    <TrendingUp className="w-5 h-5 text-yellow-500" />
                  </div>
                  
                  <div className="space-y-4">
                    {featuredArticles.slice(0, 3).map((article, index) => (
                      <div key={article.id || index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                            {article.title || 'Untitled'}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {article.author?.name || 'Unknown'} • {article.readTime || 1} min read
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Link
                    to="/trending"
                    className="inline-flex items-center text-sm font-medium text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 mt-4"
                  >
                    View all trending
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Section */}
      {trendingArticles.length > 0 && (
        <section className="bg-yellow-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Trending on Medium</h2>
                  <p className="text-gray-600 dark:text-gray-400">Most popular stories right now</p>
                </div>
              </div>
              <Link
                to="/trending"
                className="hidden sm:inline-flex items-center text-sm font-medium text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300"
              >
                See all trending
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingArticles.map((article, index) => (
                <Link
                  key={article.id || index}
                  to={`/article/${article.id}`}
                  className="group block bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <img
                          src={article.author?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(article.author?.name || 'User')}&background=f59e0b&color=fff`}
                          alt={article.author?.name || 'User'}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {article.author?.name || 'Unknown'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors line-clamp-2 mb-2">
                        {article.title || 'Untitled'}
                      </h3>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>{article.readTime || 1} min read</span>
                        <div className="flex items-center space-x-1">
                          <Heart className="w-3 h-3" />
                          <span>{article.likesCount || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>{article.commentsCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Search and Filters */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Explore Stories</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover articles from our community of writers covering every topic imaginable
          </p>
        </div>

        <div className="mb-8">
          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for articles, topics, or authors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </form>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                  category === cat
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:shadow-md'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Articles Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <LoadingSpinner />
            <p className="text-gray-500 dark:text-gray-400 mt-4">Loading amazing stories...</p>
          </div>
        ) : (
          <>
            {articlesData?.articles.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                  {category === 'All' && !search ? 'No stories yet' : 'No articles found'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {category === 'All' && !search 
                    ? 'Be the first to share your story with the world. Every great journey starts with a single step.' 
                    : 'Try adjusting your search terms or explore different categories to discover amazing content.'}
                </p>
                {!isAuthenticated && (
                  <Link
                    to="/register"
                    className="inline-flex items-center px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                  >
                    Start writing
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {articlesData?.articles.map((article: any) => (
                    <div key={article.id} className="group">
                      <ArticleCard article={article} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {articlesData && articlesData.pagination.pages > 1 && (
                  <div className="flex justify-center mt-16">
                    <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 p-2">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, articlesData.pagination.pages) }, (_, i) => {
                          const pageNum = i + 1
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                                page === pageNum
                                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              {pageNum}
                            </button>
                          )
                        })}
                      </div>

                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === articlesData.pagination.pages}
                        className="px-4 py-2 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>

      {/* Call to Action Section */}
      {!isAuthenticated && (
        <section className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 text-white">
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to start your writing journey?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of writers sharing their stories, insights, and expertise with readers around the world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-8 py-4 bg-yellow-500 text-gray-900 rounded-full font-semibold hover:bg-yellow-400 transition-colors shadow-lg hover:shadow-xl"
              >
                Get started for free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                to="/trending"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white rounded-full font-semibold hover:bg-white hover:text-gray-900 transition-colors"
              >
                Explore stories
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Why writers choose Medium
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to share your story and connect with readers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Beautiful Writing Experience
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Focus on your words with our distraction-free editor designed for writers.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Engaged Community
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Connect with readers who care about your topics and build meaningful relationships.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Grow Your Audience
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Reach new readers through our recommendation system and trending features.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home