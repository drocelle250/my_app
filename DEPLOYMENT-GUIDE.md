# Deployment Guide - Frontend & Backend in One Repository

## Repository Structure

```
my_app/
├── frontend/          # React frontend
└── Backend/           # Node.js backend
```

Both frontend and backend are in the same repository but in separate folders for easy deployment.

---

## Step 1: Push to GitHub

### Create Repository (if not exists)

Go to https://github.com/drocelle250 and create a new repository named **my_app** (or use existing one).

### Push Code

Open terminal in `C:\Users\Administrator\Desktop\shadish\my_app`:

```bash
# Check current remote
git remote -v

# If remote is wrong, update it
git remote set-url origin https://github.com/drocelle250/my_app.git

# Add all files
git add .

# Commit
git commit -m "Organized into frontend and Backend folders"

# Push to GitHub
git push -u origin main
```

If you get "branch main doesn't exist" error:
```bash
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Frontend to Netlify

### Option A: Deploy via Netlify UI (Recommended)

1. Go to https://app.netlify.com/
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub" and authorize Netlify
4. Select **my_app** repository
5. Configure build settings:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
6. Add environment variable:
   - Key: `VITE_API_URL`
   - Value: `http://localhost:5000/api` (temporary, will update after backend deployment)
7. Click "Deploy site"

### Option B: Deploy via Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Navigate to frontend folder
cd frontend

# Deploy
netlify deploy --prod
```

When prompted:
- Build command: `npm run build`
- Publish directory: `dist`

---

## Step 3: Deploy Backend to Railway (Free)

### Option A: Deploy via Railway UI (Recommended)

1. Go to https://railway.app/
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select **my_app** repository
5. Railway will detect both frontend and backend
6. Click on "Backend" service (or add new service)
7. Configure:
   - **Root Directory:** `Backend`
   - **Start Command:** `npm start`
8. Add MySQL database:
   - Click "New" → "Database" → "Add MySQL"
   - Railway will provide connection details
9. Add environment variables:
   - Click on Backend service → "Variables" tab
   - Add these variables:
     ```
     PORT=5000
     DB_HOST=${{MYSQLHOST}}
     DB_USER=${{MYSQLUSER}}
     DB_PASSWORD=${{MYSQLPASSWORD}}
     DB_NAME=railway
     JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
     ```
   - Railway automatically provides MySQL variables
10. Deploy!
11. After deployment, run seeder:
    - Go to "Settings" → "Deploy"
    - Add custom start command: `npm run seed && npm start` (first time only)
    - Or use Railway CLI: `railway run npm run seed`

### Option B: Deploy Backend to Render (Free Alternative)

1. Go to https://render.com/
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect **my_app** repository
5. Configure:
   - **Name:** inventory-backend
   - **Root Directory:** `Backend`
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
6. Add environment variables:
   ```
   PORT=5000
   DB_HOST=<your-mysql-host>
   DB_USER=<your-mysql-user>
   DB_PASSWORD=<your-mysql-password>
   DB_NAME=inventory_db
   JWT_SECRET=your-super-secret-jwt-key
   ```
7. For MySQL database, use external service:
   - **PlanetScale** (free tier): https://planetscale.com/
   - **Railway MySQL** (free tier): https://railway.app/
   - **Aiven** (free tier): https://aiven.io/

---

## Step 4: Update Frontend with Backend URL

After backend is deployed:

1. Get your backend URL:
   - Railway: `https://your-app.up.railway.app`
   - Render: `https://inventory-backend.onrender.com`

2. Update Netlify environment variable:
   - Go to Netlify dashboard → Your site
   - "Site settings" → "Environment variables"
   - Update `VITE_API_URL` to: `https://your-backend-url.com/api`

3. Trigger new deploy:
   - "Deploys" tab → "Trigger deploy" → "Deploy site"

---

## Step 5: Update Backend CORS

After frontend is deployed, update CORS in backend:

1. Edit `Backend/server.js`:
```javascript
app.use(cors({ 
  origin: "https://your-app-name.netlify.app" 
}));
```

2. Commit and push:
```bash
git add Backend/server.js
git commit -m "Update CORS for production"
git push
```

Railway/Render will auto-deploy the changes.

---

## Step 6: Seed Production Database

After backend is deployed with database:

### Using Railway CLI:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run seeder
railway run npm run seed
```

### Using Render:
Connect to your MySQL database and run the seeder manually or use the seed.sql file.

---

## Final URLs

After deployment, you'll have:

- **Frontend:** `https://your-app-name.netlify.app`
- **Backend:** `https://your-backend-url.railway.app`
- **Repository:** `https://github.com/drocelle250/my_app`

---

## Troubleshooting

### CORS Issues
Update `Backend/server.js`:
```javascript
app.use(cors({ 
  origin: ["https://your-app-name.netlify.app", "http://localhost:5173"]
}));
```

### Database Connection Issues
- Verify all DB environment variables are correct
- Check if database service is running
- Ensure database name exists
- For Railway, use the provided MySQL variables

### Build Failures on Netlify
- Check build logs
- Verify `frontend/package.json` exists
- Ensure base directory is set to `frontend`

### Backend Not Starting on Railway
- Check logs in Railway dashboard
- Verify `Backend/package.json` has correct start script
- Ensure root directory is set to `Backend`

---

## Cost Summary

- **Frontend (Netlify):** FREE (100GB bandwidth/month)
- **Backend (Railway):** FREE ($5 credit/month, ~500 hours)
- **Database (Railway MySQL):** FREE (included in Railway)

**Total: $0/month** 🎉

---

## Environment Variables Summary

### Frontend (.env)
```
VITE_API_URL=https://your-backend-url.com/api
```

### Backend (.env)
```
PORT=5000
DB_HOST=your-mysql-host
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=inventory_db
JWT_SECRET=your-super-secret-jwt-key
```
