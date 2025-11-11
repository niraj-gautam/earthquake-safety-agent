#!/bin/bash

# Setup script for test environment
# Run this once to install all test dependencies

echo "🔧 Setting up test environment..."

# Install Node.js dependencies
echo "📦 Installing Node.js test dependencies..."
npm install

# Install Python dependencies
echo "🐍 Installing Python test dependencies..."
cd .. && source agent/venv/bin/activate && pip install -r tests/requirements.txt

echo "✅ Setup complete! You can now run tests with: cd tests && npm test"

