#!/bin/bash
# Replace YOUR_GITHUB_USERNAME with your actual GitHub username
GITHUB_USERNAME="Joemnewton"

echo "Setting up remote and pushing to GitHub..."
git branch -M main
git remote add origin "https://github.com/${GITHUB_USERNAME}/logseq-reminder-notifications-db.git"
git push -u origin main

echo ""
echo "✅ Done! Your repository is now on GitHub!"
echo "Repository URL: https://github.com/${GITHUB_USERNAME}/logseq-reminder-notifications-db"
