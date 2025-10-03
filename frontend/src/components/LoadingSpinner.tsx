interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  variant?: 'default' | 'dots' | 'pulse'
}

const LoadingSpinner = ({ size = 'md', className = '', variant = 'default' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  if (variant === 'dots') {
    return (
      <div className={`flex space-x-1 ${className}`}>
        <div className={`${size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} bg-primary-500 rounded-full animate-bounce`}></div>
        <div className={`${size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} bg-primary-500 rounded-full animate-bounce`} style={{ animationDelay: '0.1s' }}></div>
        <div className={`${size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} bg-primary-500 rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={`${sizeClasses[size]} bg-primary-500 rounded-full animate-pulse ${className}`}></div>
    )
  }

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-gray-700"></div>
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary-500 animate-spin"></div>
    </div>
  )
}

export default LoadingSpinner