import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Eye, Bookmark, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Article } from '../services/articleService'
import Avatar from './Avatar'

interface ArticleCardProps {
  article: Article
}

const ArticleCard = ({ article }: ArticleCardProps) => {
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  }

  return (
    <article className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600">
      {/* Featured Image */}
      {article.featuredImage && (
        <div className="relative overflow-hidden">
          <Link to={`/article/${article.id}`}>
            <img
              src={article.featuredImage.url}
              alt={article.title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </Link>
          <div className="absolute top-3 right-3">
            <span className="px-3 py-1 text-xs font-medium bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white rounded-full backdrop-blur-sm">
              {article.category}
            </span>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Author Info */}
        <div className="flex items-center mb-4">
          <Avatar user={article.author} size="sm" />
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {article.author.name}
            </p>
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
              <span>{formatDate(article.publishedAt || article.createdAt)}</span>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{article.readTime} min read</span>
              </div>
            </div>
          </div>
          {article.isBookmarked && (
            <Bookmark className="w-4 h-4 fill-primary-500 text-primary-500" />
          )}
        </div>

        {/* Article Content */}
        <Link to={`/article/${article.id}`} className="block group/content">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover/content:text-primary-600 dark:group-hover/content:text-primary-400 transition-colors line-clamp-2 leading-tight">
            {article.title}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 leading-relaxed">
            {article.excerpt}
          </p>
        </Link>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {article.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              >
                {tag}
              </span>
            ))}
            {article.tags.length > 2 && (
              <span className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-full">
                +{article.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Article Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
              <Heart className={`w-4 h-4 ${article.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              <span>{article.likesCount}</span>
            </button>
            <button className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span>{article.commentsCount}</span>
            </button>
            <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
              <Eye className="w-4 h-4" />
              <span>{article.views}</span>
            </div>
          </div>
          
          {!article.featuredImage && (
            <span className="px-3 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
              {article.category}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

export default ArticleCard