import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, Save, Send, Image as ImageIcon } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import articleService, { CreateArticleData, ArticleDetail } from '../services/articleService'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

interface ArticleForm {
  title: string
  content: string
  excerpt?: string
  tags: string
  category: string
  published: boolean
}

const categories = [
  'Technology',
  'Health',
  'Business',
  'Science',
  'Politics',
  'Sports',
  'Entertainment',
  'Other',
]

const Write = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showPreview, setShowPreview] = useState(false)
  const [featuredImage, setFeaturedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageChanged, setImageChanged] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isLoadingArticle, setIsLoadingArticle] = useState(false)
  const [article, setArticle] = useState<ArticleDetail | null>(null)

  const isEditing = !!id

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ArticleForm>({
    defaultValues: {
      title: '',
      content: '',
      excerpt: '',
      tags: '',
      category: 'Other',
      published: false,
    },
  })

  const watchedContent = watch('content')

  // Load article for editing
  useEffect(() => {
    if (isEditing && id) {
      loadArticle()
    } else {
      // Reset form for new article
      reset({
        title: '',
        content: '',
        excerpt: '',
        tags: '',
        category: 'Other',
        published: false
      })
      setImagePreview('')
      setFeaturedImage(null)
      setImageChanged(false)
      setShowPreview(false)
      setArticle(null)
    }
  }, [id, isEditing])

  // Populate form when article is loaded
  useEffect(() => {
    if (article && isEditing) {
      const formData = {
        title: article.title,
        content: article.content,
        excerpt: article.excerpt || '',
        tags: article.tags.join(', '),
        category: article.category,
        published: article.published
      }
      
      console.log('Populating form with article data:', formData)
      reset(formData)
      
      if (article.featuredImage) {
        setImagePreview(article.featuredImage.url)
      }
    }
  }, [article, isEditing, reset])

  const loadArticle = async () => {
    try {
      setIsLoadingArticle(true)
      console.log('Loading article with ID:', id)
      
      const response = await articleService.getArticle(id!)
      console.log('Article API response:', response)
      
      if (!response.success || !response.article) {
        throw new Error('Invalid response from server')
      }
      
      const articleData = response.article
      console.log('Article data loaded:', articleData)
      
      setArticle(articleData)
      
      // Reset image states
      setFeaturedImage(null) // Clear any previously selected file
      setImageChanged(false) // Reset image changed flag
      
      if (articleData.featuredImage) {
        setImagePreview(articleData.featuredImage.url)
      } else {
        setImagePreview('')
      }
      
      setShowPreview(false)
    } catch (error: any) {
      console.error('Error loading article:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load article'
      toast.error(errorMessage)
      
      // Don't navigate away immediately, let user try again
      if (error.response?.status === 404) {
        navigate('/dashboard')
      }
    } finally {
      setIsLoadingArticle(false)
    }
  }

  const createArticle = async (data: CreateArticleData) => {
    try {
      setLoading(true)
      const response = await articleService.createArticle(data)
      const articleId = response.article.id
      
      // Upload featured image if a file was selected
      if (featuredImage && featuredImage instanceof File && imageChanged) {
        try {
          await articleService.uploadFeaturedImage(articleId, featuredImage)
          toast.success('Article and image uploaded successfully!')
          setImageChanged(false) // Reset flag after successful upload
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || 'Unknown error'
          toast.error(`Article created but image upload failed: ${errorMessage}`)
        }
      } else {
        toast.success('Article created successfully!')
      }
      
      navigate(`/article/${articleId}`)
    } catch (error) {
      console.error('Error creating article:', error)
      toast.error('Failed to create article')
    } finally {
      setLoading(false)
    }
  }

  const updateArticle = async (data: CreateArticleData) => {
    try {
      setLoading(true)
      await articleService.updateArticle(id!, data)
      
      // Only upload featured image if a new file was selected and changed
      if (featuredImage && featuredImage instanceof File && imageChanged) {
        console.log('Uploading image:', {
          name: featuredImage.name,
          size: featuredImage.size,
          type: featuredImage.type
        })
        
        try {
          await articleService.uploadFeaturedImage(id!, featuredImage)
          toast.success('Article and image updated successfully!')
          setImageChanged(false) // Reset flag after successful upload
        } catch (error: any) {
          console.error('Image upload error:', error)
          const errorMessage = error.response?.data?.message || error.message || 'Unknown error'
          toast.error(`Article updated but image upload failed: ${errorMessage}`)
          
          // Keep imageChanged as true so user can try again
          console.log('Image upload failed, keeping imageChanged flag for retry')
        }
      } else {
        console.log('No new image to upload, featuredImage:', featuredImage)
        toast.success('Article updated successfully!')
      }
      
      navigate(`/article/${id}`)
    } catch (error) {
      console.error('Error updating article:', error)
      toast.error('Failed to update article')
    } finally {
      setLoading(false)
    }
  }

  const validateFile = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!file || file.size === 0) {
        toast.error('Selected file is empty')
        resolve(false)
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('File too large. Maximum size is 5MB')
        resolve(false)
        return
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed')
        resolve(false)
        return
      }

      // Try to read the file to ensure it's not corrupted
      const reader = new FileReader()
      reader.onload = () => resolve(true)
      reader.onerror = () => {
        toast.error('Failed to read file. The file may be corrupted')
        resolve(false)
      }
      reader.readAsArrayBuffer(file.slice(0, 1024)) // Read first 1KB to test
    })
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    console.log('Image file selected:', file)
    
    if (file) {
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      })
      
      // Validate file before setting it
      const isValid = await validateFile(file)
      if (!isValid) {
        // Clear the input
        e.target.value = ''
        return
      }
      
      setFeaturedImage(file)
      setImageChanged(true)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.onerror = () => {
        toast.error('Failed to preview image')
        setFeaturedImage(null)
        setImageChanged(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = (data: ArticleForm) => {
    const articleData: CreateArticleData = {
      title: data.title,
      content: data.content,
      excerpt: data.excerpt || undefined,
      tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      category: data.category,
      published: data.published,
    }

    if (isEditing) {
      updateArticle(articleData)
    } else {
      createArticle(articleData)
    }
  }

  const handleSaveDraft = async () => {
    const formData = watch()
    const articleData: CreateArticleData = {
      title: formData.title,
      content: formData.content,
      excerpt: formData.excerpt || undefined,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      category: formData.category,
      published: false,
    }

    try {
      setLoading(true)
      
      if (isEditing) {
        await articleService.updateArticle(id!, articleData)
        
        // Only upload image if a new file was selected
        if (featuredImage && featuredImage instanceof File && imageChanged) {
          try {
            await articleService.uploadFeaturedImage(id!, featuredImage)
            toast.success('Draft and image saved successfully!')
          } catch (error: any) {
            toast.error(`Draft saved but image upload failed: ${error.response?.data?.message || error.message}`)
          }
        } else {
          toast.success('Draft saved successfully!')
        }
      } else {
        const createResponse = await articleService.createArticle(articleData)
        const articleId = createResponse.article.id
        
        // Upload image if selected
        if (featuredImage && featuredImage instanceof File && imageChanged) {
          try {
            await articleService.uploadFeaturedImage(articleId, featuredImage)
            toast.success('Draft and image saved successfully!')
          } catch (error: any) {
            toast.error(`Draft saved but image upload failed: ${error.response?.data?.message || error.message}`)
          }
        } else {
          toast.success('Draft saved successfully!')
        }
        
        // Navigate to edit mode for the new article
        navigate(`/write/${articleId}`)
      }
    } catch (error) {
      console.error('Error saving draft:', error)
      toast.error('Failed to save draft')
    } finally {
      setLoading(false)
    }
  }

  if (isEditing && isLoadingArticle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading article...</p>
        </div>
      </div>
    )
  }

  if (isEditing && !isLoadingArticle && !article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Failed to load article
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The article could not be loaded for editing.
          </p>
          <div className="space-x-4">
            <button
              onClick={loadArticle}
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">


        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Article' : 'Write Article'}
          </h1>
          
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="btn btn-outline flex items-center"
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Edit' : 'Preview'}
            </button>
            
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={loading}
              className="btn btn-secondary flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </button>

            {/* Test Upload Button (Development Only) */}
            {import.meta.env.DEV && featuredImage && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    console.log('Testing upload with file:', featuredImage)
                    const response = await fetch('/api/articles/test/upload', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      },
                      body: (() => {
                        const formData = new FormData()
                        formData.append('image', featuredImage)
                        return formData
                      })()
                    })
                    const result = await response.json()
                    console.log('Test upload result:', result)
                    toast.success('Test upload: ' + (result.success ? 'Success' : 'Failed'))
                  } catch (error) {
                    console.error('Test upload error:', error)
                    toast.error('Test upload failed')
                  }
                }}
                className="btn btn-outline text-xs"
              >
                Test Upload
              </button>
            )}
          </div>
        </div>



        <form key={`article-form-${id || 'new'}-${article?.id || 'empty'}`} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {!showPreview && (
            <>
              {/* Title */}
              <div>
                <input
                  {...register('title', { required: 'Title is required' })}
                  type="text"
                  placeholder="Article title..."
                  className="w-full text-3xl font-bold border-none outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* Featured Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Featured Image
                </label>
                <div className="flex items-center space-x-4">
                  <label className="btn btn-outline cursor-pointer">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Choose Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {imagePreview && (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          console.log('Clearing image')
                          setFeaturedImage(null)
                          setImagePreview('')
                          setImageChanged(true) // Mark as changed when clearing
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Category and Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select {...register('category')} className="input">
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags (comma separated)
                  </label>
                  <input
                    {...register('tags')}
                    type="text"
                    placeholder="react, javascript, web development"
                    className="input"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Excerpt (optional)
                </label>
                <textarea
                  {...register('excerpt')}
                  rows={3}
                  placeholder="Brief description of your article..."
                  className="input resize-none"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content
                </label>
                <textarea
                  {...register('content', { required: 'Content is required' })}
                  rows={20}
                  placeholder="Write your article content in Markdown..."
                  className="input resize-none font-mono"
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                )}
              </div>
            </>
          )}

          {/* Preview */}
          {showPreview && (
            <div className="prose prose-lg max-w-none dark:prose-dark">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Featured"
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              )}
              <h1>{watch('title') || 'Article Title'}</h1>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {watchedContent || 'Start writing your article...'}
              </ReactMarkdown>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <input
                {...register('published')}
                type="checkbox"
                id="published"
                className="mr-2"
              />
              <label htmlFor="published" className="text-sm text-gray-700 dark:text-gray-300">
                Publish immediately
              </label>
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex items-center"
              >
                {loading ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">{isEditing ? 'Updating...' : 'Publishing...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {isEditing ? 'Update' : 'Publish'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Write