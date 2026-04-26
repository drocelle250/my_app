# 🚀 Hosting Guide - Quick Reference

Your code is now on GitHub: **https://github.com/drocelle250/my_app**

## 📁 Repository Structure

```
my_app/
├── frontend/          # React + Vite (deploy to Netlify)
└── Backend/           # Node.js + Express (deploy to Railway)
```

---

## 🌐 Deploy Frontend to Netlify (5 minutes)

### Step 1: Go to Netlify
Visit: https://app.netlify.com/

### Step 2: Import Project
1. Click **"Add new site"** → **"Import an existing project"**
2. Choose **"GitHub"**
3. Select repository: **my_app**

### Step 3: Configure Build Settings
```
Base directory:    frontend
Build command:     npm run build
Publish directory: frontend/dist
```

### Step 4: Add Environment Variable
```
Key:   VITE_API_URL
Value: http://localhost:5000/api
```
(You'll update this after deploying backend)

### Step 5: Deploy
Click **"Deploy site"** and wait 2-3 minutes.

Your frontend will be live at: `https://your-app-name.netlify.app`

---

## 🚂 Deploy Backend to Railway (10 minutes)

### Step 1: Go to Railway
Visit: https://railway.app/

### Step 2: Sign Up with GitHub
Click **"Login with GitHub"**

### Step 3: Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose **my_app** repository

### Step 4: Configure Backend Service
1. Railway will detect your code
2. Click **"Add variables"** or go to **Variables** tab
3. Set **Root Directory** to: `Backend`

### Step 5: Add MySQL Database
1. Click **"New"** → **"Database"** → **"Add MySQL"**
2. Railway will create a MySQL instance
3. Copy the connection details

### Step 6: Add Environment Variables
Go to your Backend service → **Variables** tab:

```
PORT=5000
DB_HOST=${{MYSQLHOST}}
DB_USER=${{MYSQLUSER}}
DB_PASSWORD=${{MYSQLPASSWORD}}
DB_NAME=railway
JWT_SECRET=your-super-secret-key-change-this-123456
```

Railway automatically provides `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD` from the MySQL service.

### Step 7: Deploy
Railway will automatically deploy. Wait 3-5 minutes.

### Step 8: Get Backend URL
Click on your Backend service → **Settings** → Copy the **Public URL**

Example: `https://my-app-production.up.railway.app`

### Step 9: Seed Database
Option A - Using Railway Dashboard:
1. Go to Backend service → **Settings**
2. Under **Deploy**, temporarily change start command to: `npm run seed && npm start`
3. Redeploy
4. After seeding, change back to: `npm start`

Option B - Using Railway CLI:
```bash
npm install -g @railway/cli
railway login
railway link
railway run npm run seed
```

---

## 🔗 Connect Frontend to Backend

### Step 1: Update Frontend Environment Variable
1. Go to Netlify dashboard
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Update `VITE_API_URL` to your Railway backend URL:
   ```
   https://your-backend.up.railway.app/api
   ```

### Step 2: Redeploy Frontend
1. Go to **Deploys** tab
2. Click **"Trigger deploy"** → **"Deploy site"**

### Step 3: Update Backend CORS
1. Edit `Backend/server.js` in your local code
2. Change CORS to:
   ```javascript
   app.use(cors({ 
     origin: ["https://your-app-name.netlify.app", "http://localhost:5173"]
   }));
   ```
3. Commit and push:
   ```bash
   git add Backend/server.js
   git commit -m "Update CORS for production"
   git push
   ```
4. Railway will auto-deploy

---

## ✅ Test Your App

1. Visit your Netlify URL: `https://your-app-name.netlify.app`
2. Login with default credentials:
   - Email: `admin@inventory.com`
   - Password: `Admin@123`

---

## 🎉 You're Done!

Your inventory management system is now live!

- **Frontend:** https://your-app-name.netlify.app
- **Backend:** https://your-backend.up.railway.app
- **GitHub:** https://github.com/drocelle250/my_app

---

## 💰 Cost

- **Netlify:** FREE (100GB bandwidth/month)
- **Railway:** FREE ($5 credit/month = ~500 hours)
- **Total:** $0/month

---

## 🆘 Troubleshooting

### Frontend shows "Network Error"
- Check if backend URL in Netlify environment variables is correct
- Verify backend is running on Railway
- Check browser console for CORS errors

### Backend not connecting to database
- Verify MySQL service is running on Railway
- Check environment variables are set correctly
- Look at Railway logs for errors

### Login not working
- Make sure you ran `npm run seed` on Railway
- Check backend logs for errors
- Verify JWT_SECRET is set

---

## 📚 More Help

See detailed guide: [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)
