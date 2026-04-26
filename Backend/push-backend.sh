#!/bin/bash

echo "=========================================="
echo "Pushing Backend to GitHub"
echo "=========================================="

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Backend (Node.js + Express + MySQL)"

# Add remote
git remote add origin https://github.com/drocelle250/inventory-backend.git

# Push to GitHub
git branch -M main
git push -u origin main

echo ""
echo "✅ Backend pushed successfully!"
echo "Repository: https://github.com/drocelle250/inventory-backend"
