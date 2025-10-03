import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300 dark:text-gray-600">404</h1>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Page not found
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="btn btn-primary flex items-center justify-center"
          >
            <Home className="w-4 h-4 mr-2" />
            Go home
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="btn btn-outline flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go back
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotFound