# 🚨 URGENT: Security Fix Guide

Your Firebase credentials were exposed in GitHub commits. Follow these steps immediately:

## Step 1: Rotate Firebase Credentials (DO THIS FIRST!)

Since your API keys are public, you MUST rotate them:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `haseebfitness-808b2`
3. Click the gear icon (⚙️) → Project Settings
4. Under "Your apps" section, find your web app
5. Click "Delete this app" or "Regenerate" to get new credentials
6. Create a new web app and get fresh credentials
7. Update your `.env` file with the NEW credentials

## Step 2: Clean Git History

We'll completely remove the sensitive commits:

```bash
# WARNING: This rewrites history. Anyone who cloned your repo will need to re-clone
cd "c:\Users\Ahmad\Downloads\img\haseeb fitness"

# Remove all commits and start fresh
git checkout --orphan temp-main
git add -A
git commit -m "Initial commit - Secure version"

# Force push to replace main branch
git branch -D main
git branch -m main
git push -f origin main
```

## Step 3: Verify .env is NOT in the Repo

```bash
# Check if .env exists in git
git ls-files | grep .env

# If it shows .env, remove it:
git rm --cached .env
git commit -m "Remove .env from tracking"
git push
```

## Step 4: Update Environment Variables

Your `.env` file should have the NEW credentials (after rotation):

```env
VITE_FIREBASE_API_KEY=<NEW_KEY_HERE>
VITE_FIREBASE_AUTH_DOMAIN=<YOUR_DOMAIN>
VITE_FIREBASE_PROJECT_ID=haseebfitness-808b2
VITE_FIREBASE_STORAGE_BUCKET=<YOUR_BUCKET>
VITE_FIREBASE_MESSAGING_SENDER_ID=<NEW_SENDER_ID>
VITE_FIREBASE_APP_ID=<NEW_APP_ID>
```

## Step 5: Deploy to Vercel Securely

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Import your GitHub repository
3. Add Environment Variables:
   - Click "Settings" → "Environment Variables"
   - Add each `VITE_*` variable from your `.env` file
4. Deploy!

## ⚠️ Important Notes

- **DO NOT SKIP STEP 1** - Rotating credentials is critical
- The `.gitignore` file now properly excludes `.env`
- Never commit `.env` files again
- The secure version uses placeholders that are replaced at build time

## Verification Checklist

- [ ] Firebase credentials rotated
- [ ] Git history cleaned (no sensitive data)
- [ ] `.env` is in `.gitignore`
- [ ] `.env` is NOT tracked by git
- [ ] New secure version pushed to GitHub
- [ ] Environment variables set in Vercel
- [ ] App deployed and working

## Need Help?

If you need assistance with any step, refer to:
- [Firebase Security Best Practices](https://firebase.google.com/docs/projects/api-keys)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
