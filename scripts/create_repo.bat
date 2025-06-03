@echo off
:: Set up a basic bat script to create a Git repository in the current directory

echo Initializing a new Git repository...

:: Initialize the Git repository
git init

:: Check if the .gitignore file already exists, if not, create one
if not exist .gitignore (
    echo Creating a default .gitignore file...
    echo # Add files or directories to ignore >> .gitignore
    echo *.log >> .gitignore
    echo node_modules/ >> .gitignore
    echo .env >> .gitignore
    echo .DS_Store >> .gitignore
    echo Thumbs.db >> .gitignore
    echo .vscode/ >> .gitignore
) else (
    echo .gitignore already exists; skipping creation.
)

:: Add all files in the directory to the repository
echo Adding files to the staging area...
git add .

:: Create an initial commit
echo Committing initial files...
git commit -m "Initial commit"

echo New Git repository created successfully!
pause