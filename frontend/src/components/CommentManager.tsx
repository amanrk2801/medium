import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import articleService, { Comment } from '../services/articleService'

interface CommentManagerProps {
  articleId: string
  comments: Comment[]
  onCommentsUpdate: (comments: Comment[]) => void
}

const CommentManager: React.FC<CommentManagerProps> = ({ 
  articleId, 
  comments, 
  onCommentsUpdate 
}) => {
  const { user } = useAuth()
  const [newComment, setNewComment] = useState('')
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return

    try {
      setLoading(true)
      const response = await articleService.addComment(articleId, newComment.trim())
      
      if (response.success) {
        onCommentsUpdate([...comments, response.comment])
        setNewComment('')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment.id)
    setEditContent(comment.content)
  }

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return

    try {
      setLoading(true)
      const response = await articleService.updateComment(articleId, commentId, editContent.trim())
      
      if (response.success) {
        const updatedComments = comments.map(comment =>
          comment.id === commentId ? response.comment : comment
        )
        onCommentsUpdate(updatedComments)
        setEditingComment(null)
        setEditContent('')
      }
    } catch (error) {
      console.error('Error updating comment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      setLoading(true)
      const response = await articleService.deleteComment(articleId, commentId)
      
      if (response.success) {
        const updatedComments = comments.filter(comment => comment.id !== commentId)
        onCommentsUpdate(updatedComments)
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    } finally {
      setLoading(false)
    }
  }

  const cancelEdit = () => {
    setEditingComment(null)
    setEditContent('')
  }

  return (
    <div className="space-y-6">
      {/* Add Comment Form */}
      {user && (
        <form onSubmit={handleAddComment} className="space-y-4">
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Add a comment
            </label>
            <textarea
              id="comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              disabled={loading}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newComment.trim() || loading}
              className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Comments ({comments.length})
        </h3>

        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No comments yet. Be the first to share your thoughts!
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {comment.user.avatar?.url ? (
                      <img
                        src={comment.user.avatar.url}
                        alt={comment.user.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {comment.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Comment Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {comment.user.name}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      {user && user.id === comment.user.id && (
                        <div className="flex items-center space-x-2">
                          {editingComment === comment.id ? (
                            <>
                              <button
                                onClick={() => handleUpdateComment(comment.id)}
                                disabled={loading || !editContent.trim()}
                                className="text-xs text-green-600 hover:text-green-800 dark:text-green-400 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={loading}
                                className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditComment(comment)}
                                disabled={loading}
                                className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                disabled={loading}
                                className="text-xs text-red-600 hover:text-red-800 dark:text-red-400"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Comment Content */}
                    <div className="mt-2">
                      {editingComment === comment.id ? (
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                          rows={3}
                          disabled={loading}
                        />
                      ) : (
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CommentManager