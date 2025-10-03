import api from './api'

export interface Article {
  id: string
  title: string
  content: string
  excerpt: string
  author: {
    id: string
    name: string
    email: string
    avatar?: { url: string }
    bio?: string
  }
  tags: string[]
  category: string
  featuredImage?: { url: string }
  readTime: number
  likesCount: number
  commentsCount: number
  views: number
  published: boolean
  publishedAt?: string
  createdAt: string
  isLiked?: boolean
  isBookmarked?: boolean
}

export interface Comment {
  id: string
  content: string
  user: {
    id: string
    name: string
    email: string
    avatar?: { url: string }
  }
  createdAt: string
}

export interface ArticleDetail extends Article {
  likes: Array<{ user: string; createdAt: string }>
  comments: Comment[]
  isFollowingAuthor?: boolean
}

export interface CreateArticleData {
  title: string
  content: string
  excerpt?: string
  tags?: string[]
  category?: string
  published?: boolean
}

export interface ArticlesResponse {
  success: boolean
  articles: Article[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

class ArticleService {
  async getArticles(params?: {
    page?: number
    limit?: number
    tag?: string
    category?: string
    search?: string
    author?: string
  }): Promise<ArticlesResponse> {
    const queryParams = new URLSearchParams()
    
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.tag) queryParams.append('tag', params.tag)
    if (params?.category) queryParams.append('category', params.category)
    if (params?.search) queryParams.append('search', params.search)
    if (params?.author) queryParams.append('author', params.author)

    const response = await api.get(`/articles?${queryParams}`)
    return response.data
  }

  async getArticle(id: string): Promise<{ success: boolean; article: ArticleDetail }> {
    const response = await api.get(`/articles/${id}`)
    return response.data
  }

  async createArticle(data: CreateArticleData): Promise<{ success: boolean; article: Article }> {
    const response = await api.post('/articles', data)
    return response.data
  }

  async updateArticle(id: string, data: Partial<CreateArticleData>): Promise<{ success: boolean; article: Article }> {
    const response = await api.put(`/articles/${id}`, data)
    return response.data
  }

  async deleteArticle(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/articles/${id}`)
    return response.data
  }

  async likeArticle(id: string): Promise<{ success: boolean; likesCount: number; isLiked: boolean }> {
    const response = await api.post(`/articles/${id}/like`)
    return response.data
  }

  async bookmarkArticle(id: string): Promise<{ success: boolean; isBookmarked: boolean }> {
    const response = await api.post(`/articles/${id}/bookmark`)
    return response.data
  }

  async addComment(id: string, content: string): Promise<{ success: boolean; comment: Comment }> {
    const response = await api.post(`/articles/${id}/comments`, { content })
    return response.data
  }

  async getMyArticles(params?: {
    page?: number
    limit?: number
  }): Promise<ArticlesResponse> {
    const queryParams = new URLSearchParams()
    
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const response = await api.get(`/articles/user/my-articles?${queryParams}`)
    return response.data
  }

  async getBookmarkedArticles(params?: {
    page?: number
    limit?: number
  }): Promise<ArticlesResponse> {
    const queryParams = new URLSearchParams()
    
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const response = await api.get(`/articles/user/bookmarks?${queryParams}`)
    return response.data
  }

  async uploadFeaturedImage(articleId: string, file: File): Promise<{ success: boolean; featuredImage: { url: string } }> {
    // Validate file before upload
    if (!file || file.size === 0) {
      throw new Error('Invalid file: File is empty or missing')
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('File too large: Maximum size is 5MB')
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type: Only JPEG, PNG, GIF, and WebP images are allowed')
    }

    console.log('Uploading file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    })

    const formData = new FormData()
    formData.append('image', file)

    // Log FormData contents (for debugging)
    console.log('FormData entries:')
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(key, `File: ${value.name} (${value.size} bytes, type: ${value.type})`)
        
        // Additional file validation
        if (value.size === 0) {
          throw new Error('File is empty (0 bytes)')
        }
      } else {
        console.log(key, value)
      }
    }

    // Test if we can read the file
    try {
      const arrayBuffer = await file.arrayBuffer()
      console.log('File arrayBuffer length:', arrayBuffer.byteLength)
      if (arrayBuffer.byteLength === 0) {
        throw new Error('File content is empty')
      }
    } catch (error) {
      console.error('Error reading file:', error)
      throw new Error('Cannot read file content: ' + error.message)
    }

    const response = await api.post(`/articles/${articleId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  async getUserArticles(userId: string, params?: {
    page?: number
    limit?: number
  }): Promise<ArticlesResponse> {
    const queryParams = new URLSearchParams()
    
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const response = await api.get(`/articles/user/${userId}?${queryParams}`)
    return response.data
  }

  async updateComment(articleId: string, commentId: string, content: string): Promise<{ success: boolean; comment: Comment }> {
    const response = await api.put(`/articles/${articleId}/comments/${commentId}`, { content })
    return response.data
  }

  async deleteComment(articleId: string, commentId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/articles/${articleId}/comments/${commentId}`)
    return response.data
  }

  async bulkDeleteArticles(articleIds: string[]): Promise<{ success: boolean; message: string }> {
    const response = await api.delete('/articles/bulk/delete', { data: { articleIds } })
    return response.data
  }

  async bulkUpdateArticles(articleIds: string[], updates: { published?: boolean; category?: string }): Promise<{ 
    success: boolean; 
    message: string; 
    modifiedCount: number 
  }> {
    const response = await api.put('/articles/bulk/update', { articleIds, updates })
    return response.data
  }

  async getArticleStats(): Promise<{ 
    success: boolean; 
    stats: {
      totalArticles: number
      publishedArticles: number
      draftArticles: number
      totalViews: number
      totalLikes: number
      totalComments: number
      totalBookmarks: number
    }
  }> {
    const response = await api.get('/articles/stats/overview')
    return response.data
  }

  async getTrendingArticles(params?: {
    page?: number
    limit?: number
    days?: number
  }): Promise<ArticlesResponse> {
    const queryParams = new URLSearchParams()
    
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.days) queryParams.append('days', params.days.toString())

    const response = await api.get(`/articles/trending?${queryParams}`)
    return response.data
  }
}

export default new ArticleService()