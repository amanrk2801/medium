import { User } from 'lucide-react'

interface AvatarProps {
  user?: {
    name: string
    avatar?: { url: string }
  } | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const Avatar = ({ user, size = 'md', className = '' }: AvatarProps) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (user?.avatar?.url) {
    return (
      <img
        src={user.avatar.url}
        alt={user.name}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-primary-600 text-white flex items-center justify-center font-medium ${className}`}
    >
      {user?.name ? getInitials(user.name) : <User className="w-1/2 h-1/2" />}
    </div>
  )
}

export default Avatar