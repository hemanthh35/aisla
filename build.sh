#!/bin/bash
# Install dependencies
echo "Installing server dependencies..."
cd server
npm install

echo "Installing client dependencies..."
cd ../client
npm install

echo "Building React app..."
npm run build

echo "Build complete!"
