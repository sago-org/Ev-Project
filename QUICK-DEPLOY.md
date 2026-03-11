# Quick Deploy Guide

## Current Configuration
✅ **Base Path**: `/` (Correct for Vercel/Netlify)  
✅ **Build**: Working  
✅ **Tests**: 225 passing

---

## Deploy to Vercel (Recommended - 5 minutes)

```bash
# 1. Push to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Go to vercel.com
# 3. Sign up with GitHub
# 4. Click "New Project"
# 5. Import your repository
# 6. Click "Deploy"
# Done! 🎉
```

**Your app will be live at**: `https://your-project.vercel.app`

---

## Deploy to Netlify (Alternative - 5 minutes)

```bash
# 1. Push to GitHub (same as above)
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Go to netlify.com
# 3. Sign up with GitHub
# 4. Click "Add new site" → "Import an existing project"
# 5. Select your repository
# 6. Click "Deploy site"
# Done! 🎉
```

**Your app will be live at**: `https://your-project.netlify.app`

---

## Deploy to GitHub Pages (10 minutes)

### ⚠️ Important: Update vite.config.ts first!

**Change this line in `vite.config.ts`**:
```typescript
base: '/',  // Current (for Vercel/Netlify)
```

**To this**:
```typescript
base: '/ev-charging-station-finder/',  // For GitHub Pages
```

**Then update `package.json`**:
- Replace `YOUR_USERNAME` with your GitHub username in the `homepage` field

### Deploy:
```bash
# 1. Rebuild with new base path
npm run build

# 2. Deploy to GitHub Pages
npm run deploy

# 3. Enable GitHub Pages
# Go to: GitHub repo → Settings → Pages
# Source: Deploy from branch
# Branch: gh-pages → /root
# Save
```

**Your app will be live at**: `https://YOUR_USERNAME.github.io/ev-charging-station-finder`

---

## Which Platform Should I Choose?

| Platform | Best For | Deployment |
|----------|----------|------------|
| **Vercel** | Production apps | Automatic |
| **Netlify** | Production apps | Automatic |
| **GitHub Pages** | Portfolio/demos | Manual |

**Recommendation**: Use **Vercel** for the easiest experience.

---

## Common Issues

### 404 Errors for CSS/JS Files?

**Problem**: Wrong base path configuration

**Solution**:
- **Vercel/Netlify**: Use `base: '/'` ✅ (current setting)
- **GitHub Pages**: Use `base: '/ev-charging-station-finder/'`

After changing, rebuild:
```bash
npm run build
```

### Routes Not Working?

**Problem**: SPA routing not configured

**Solution**:
- **Vercel/Netlify**: Automatically handled ✅
- **GitHub Pages**: May need additional configuration

---

## Need Help?

See the full [DEPLOYMENT.md](./DEPLOYMENT.md) guide for detailed instructions.
