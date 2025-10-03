#!/bin/bash

echo "🚀 Setting up Medium Clone MERN Stack..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is running (optional check)
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB or use MongoDB Atlas."
fi

echo "📦 Installing root dependencies..."
npm install

echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "⚙️  Setting up environment files..."

# Backend environment
if [ ! -f backend/.env ]; then
    echo "Creating backend/.env file..."
    cat > backend/.env << EOL
PORT=5000
MONGODB_URI=mongodb://localhost:27017/medium-clone
JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_random_$(date +%s)
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
EOL
    echo "✅ Created backend/.env"
    echo "⚠️  Please update the Cloudinary credentials in backend/.env"
else
    echo "✅ backend/.env already exists"
fi

# Frontend environment
if [ ! -f frontend/.env ]; then
    echo "Creating frontend/.env file..."
    echo "VITE_API_URL=http://localhost:5000/api" > frontend/.env
    echo "✅ Created frontend/.env"
else
    echo "✅ frontend/.env already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update backend/.env with your MongoDB URI and Cloudinary credentials"
echo "2. Start MongoDB (if using local installation)"
echo "3. Run 'npm run dev' to start both servers"
echo ""
echo "🌐 URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "📚 For more information, check the README.md file"