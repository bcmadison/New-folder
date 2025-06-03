# Step 1: Untrack large file types from Git LFS
git lfs untrack "*.zip"
git lfs untrack "*.mp4"
git lfs untrack "*.pkl"

# Step 2: Delete the .gitattributes file (used by Git LFS)
if (Test-Path .gitattributes) {
    git rm --cached .gitattributes
    Remove-Item .gitattributes
}

# Step 3: Commit the removal of LFS tracking
git add .
git commit -m "Remove Git LFS tracking and commit large files directly"

# Step 4: Push the changes to GitHub
git push -u origin master
