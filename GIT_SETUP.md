# 📤 Git Setup & Push Instructions

This guide will help you push the project to GitHub and share it with your team.

## 🚀 Initial Push to GitHub

### Step 1: Initialize Git (if not already done)

```bash
cd E:\Kayak
git init
```

### Step 2: Add Remote Repository

```bash
git remote add origin https://github.com/aneessaheba/kayak-distributed-travel-system.git
```

### Step 3: Stage All Files

```bash
git add .
```

### Step 4: Commit Changes

```bash
git commit -m "Initial commit: Kayak Travel Booking System"
```

### Step 5: Push to GitHub

```bash
# Push to main branch
git branch -M main
git push -u origin main
```

## 📝 Daily Workflow

### Making Changes

```bash
# 1. Check status
git status

# 2. Add changed files
git add .

# 3. Commit with message
git commit -m "Description of changes"

# 4. Push to GitHub
git push
```

### Pull Latest Changes (from teammates)

```bash
git pull origin main
```

## 🔒 What's Excluded from Git

The `.gitignore` file ensures these are NOT pushed to GitHub:

- ✅ `node_modules/` - Dependencies (too large)
- ✅ `database/data/` - MongoDB data files (too large)
- ✅ `database/logs/` - Log files
- ✅ `.env` files - Environment variables (sensitive)
- ✅ `dist/` - Build outputs
- ✅ IDE settings (`.vscode/`, `.idea/`)
- ✅ Temporary files

## ⚠️ Important Notes

1. **Never commit:**
   - `.env` files with real secrets
   - Database files (`database/data/`)
   - `node_modules/` folder

2. **Always commit:**
   - Source code (`.js`, `.jsx`, `.json`)
   - Configuration files
   - Documentation (`.md` files)
   - Scripts (`.ps1`, `.sh`)

3. **Before pushing:**
   - Test that everything works
   - Check `git status` to see what will be pushed
   - Make sure no sensitive data is included

## 🔄 Updating the Repository

### If you need to update existing files:

```bash
# 1. Pull latest changes first
git pull origin main

# 2. Make your changes
# ... edit files ...

# 3. Add and commit
git add .
git commit -m "Updated: description of changes"

# 4. Push
git push
```

### If there are conflicts:

```bash
# Pull and merge
git pull origin main

# Resolve conflicts in files
# Then:
git add .
git commit -m "Resolved conflicts"
git push
```

## 👥 For Your Friends (Getting the Code)

Your friends should:

```bash
# 1. Clone the repository
git clone https://github.com/aneessaheba/kayak-distributed-travel-system.git

# 2. Navigate to project
cd kayak-distributed-travel-system

# 3. Install dependencies
npm install

# 4. Start everything
npm run start:all  # Windows
# OR
./start-all.sh     # Mac/Linux
```

## 📋 Checklist Before Pushing

- [ ] All code is working
- [ ] No sensitive data in `.env` files (they're gitignored)
- [ ] Database files are not included (gitignored)
- [ ] `node_modules` is not included (gitignored)
- [ ] README.md is updated
- [ ] All team members can understand the setup

## 🆘 Troubleshooting

### Error: "Repository not found"
- Check repository URL is correct
- Verify you have push access to the repository

### Error: "Permission denied"
- Check your GitHub credentials
- May need to set up SSH keys or use Personal Access Token

### Error: "Large files"
- Make sure `node_modules` and `database/data` are in `.gitignore`
- If already committed, remove them:
  ```bash
  git rm -r --cached node_modules
  git rm -r --cached database/data
  git commit -m "Remove large files"
  ```

---

**Ready to push?** Follow the steps above! 🚀

