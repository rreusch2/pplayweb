#!/bin/bash

echo "🚀 Deploying ParleyApp with Facebook Pixel & Analytics..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Creating .env.local from template..."
    cp .env.local.analytics .env.local
    echo "❗ IMPORTANT: Edit .env.local and add your actual Pixel ID!"
    echo "   NEXT_PUBLIC_FACEBOOK_PIXEL_ID=your_pixel_id_here"
    exit 1
fi

# Check if Pixel ID is set
if grep -q "your_pixel_id_here" .env.local; then
    echo "❗ ERROR: Please set your Facebook Pixel ID in .env.local"
    echo "   Replace 'your_pixel_id_here' with your actual Pixel ID"
    exit 1
fi

echo "✅ Environment variables configured"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Deploy to your hosting platform"
    echo "2. Follow FACEBOOK_PIXEL_SETUP_GUIDE.md for Meta setup"
    echo "3. Test tracking with the debug panel (development mode only)"
    echo ""
    echo "🧪 To test locally:"
    echo "   npm run dev"
    echo "   Visit http://localhost:3000 and look for the purple 'Analytics Debug' button"
else
    echo "❌ Build failed. Check the errors above."
    exit 1
fi
