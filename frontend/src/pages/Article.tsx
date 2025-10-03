import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Heart, MessageCircle, Bookmark, Share2, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import articleService, { ArticleDetail, Comment } from '../services/articleService'
import { useAuth } from '../contexts/AuthContext'
import Avatar from '../components/Avatar'
import LoadingSpinner from '../components/LoadingSpinner'
import CommentManager from '../components/CommentManager'
import toast from 'react-hot-toast'

const Article = () => {
  const { id } = useParams<{ id: string }>()
  const { user, isAuthenticated } = useAuth()
  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadArticle()
    }
  }, [id])

  const loadArticle = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await articleService.getArticle(id!)
      setArticle(response.article)
    } catch (err) {
      setError('Failed to load article')
      console.error('Error loading article:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to like articles')
      return
    }
    
    try {
      const response = await articleService.likeArticle(id!)
      if (article) {
        setArticle({
          ...article,
          isLiked: response.isLiked,
          likes: response.isLiked 
            ? [...article.likes, { user: user!.id, createdAt: new Date().toISOString() }]
            : article.likes.filter(like => like.user !== user!.id)
        })
      }
      toast.success(response.isLiked ? 'Article liked!' : 'Article unliked!')
    } catch (error) {
      toast.error('Failed to like article')
    }
  }

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to bookmark articles')
      return
    }
    
    try {
      const response = await articleService.bookmarkArticle(id!)
      if (article) {
        setArticle({
          ...article,
          isBookmarked: response.isBookmarked
        })
      }
      toast.success(response.isBookmarked ? 'Article bookmarked!' : 'Bookmark removed!')
    } catch (error) {
      toast.error('Failed to update bookmark')
    }
  }

  const handleCommentsUpdate = (updatedComments: Comment[]) => {
    if (article) {
      setArticle({
        ...article,
        comments: updatedComments,
        commentsCount: updatedComments.length
      })
    }
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: data?.article.title,
        text: data?.article.excerpt,
        url: window.location.href,
      })
    } catch (error) {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Article not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/" className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors">
            Go home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            {article.title}
          </h1>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Avatar user={article.author} size="md" />
              <div className="ml-4">
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {article.author.name}
                </p>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-2">
                  <span>
                    {formatDistanceToNow(new Date(article.publishedAt || article.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  <span>·</span>
                  <span>{article.readTime} min read</span>
                  <span>·</span>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{article.views} views</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                  article.isLiked
                    ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Heart className={`w-5 h-5 ${article.isLiked ? 'fill-current' : ''}`} />
                <span>{article.likes.length}</span>
              </button>

              <button
                onClick={handleBookmark}
                className={`p-2 rounded-full transition-colors ${
                  article.isBookmarked
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${article.isBookmarked ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={handleShare}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {article.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Featured Image */}
        {article.featuredImage && (
          <div className="mb-8">
            <img
              src={article.featuredImage.url}
              alt={article.title}
              className="w-full h-96 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none mb-12 dark:prose-dark">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content}</ReactMarkdown>
        </div>

        {/* Comments Section */}
        <section className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <CommentManager
            articleId={article.id}
            comments={article.comments}
            onCommentsUpdate={handleCommentsUpdate}
          />
        </section>
      </article>
    </div>
  )
}

export default Article