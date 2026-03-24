# Render.com Deployment Instructions

## 1. Web Service (Backend)
1. In Render dashboard, click **New +** -> **Web Service**.
2. Connect the GitHub repository.
3. Configuration:
   - **Name:** quantum-ares-api
   - **Environment:** Python 3
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Environment Variables:
   - `PYTHON_VERSION`: `3.11.4`
   - `BLOCKCHAIN_MODE`: `rsa`
   - `ALLOWED_ORIGINS`: `https://your-frontend-url.onrender.com`
   - `SECRET_KEY`: `(generate a secure token)`

## 2. Static Site (Frontend)
1. Click **New +** -> **Static Site**.
2. Connect the same GitHub repository.
3. Configuration:
   - **Name:** quantum-ares-web
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Publish Directory:** `frontend/dist`
4. Environment Variables:
   - `VITE_API_BASE_URL`: `https://quantum-ares-api.onrender.com` (Use the backend URL)
5. **Routing Rules (CRITICAL FOR REACT):**
   - Add a rewrite rule:
     - Source: `/*`
     - Destination: `/index.html`
     - Status: `200`

## 3. Post-Deploy Verification
1. Open the backend URL `https://quantum-ares-api.onrender.com/docs` to verify Swagger UI.
2. Open the frontend URL and test the upload of `demo_hospital.json`.
3. Verify the PDF report generation works via the frontend.
