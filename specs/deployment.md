# Deployment Guide (Cloud Run)

## Contest Compliance
**Question:** *If I host the client part on my side, but will use Google Cloud to host the backend (AI agent) will it satisfy the contest requirement?*

**Answer:** **Yes, absolutely.** The primary requirement for the Gemini API Developer Competition is to use the Gemini API and integrate with at least one Google Cloud service. By hosting your AI agent backend on Google Cloud Run, you are fulfilling the "Google Cloud service" requirement perfectly. Hosting your static/React frontend elsewhere (like Vercel, Netlify, or Cloudflare) is a standard architecture and does not violate the rules.

---

## Instructions: Deploying Backend to Cloud Run

### 1. Prerequisites
Ensure you have the [Google Cloud CLI (`gcloud`)](https://cloud.google.com/sdk/docs/install) installed and initialized.

```bash
# Login to your Google Cloud account
gcloud auth login

# Set your active project (replace with your actual project ID)
gcloud config set project YOUR_PROJECT_ID
```

### 2. Enable Required APIs
Enable the necessary services in your Google Cloud Project:

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com
```

### 3. Initialize Firestore Database
Firestore is needed for session persistence.
1. Go to the [Firestore Console](https://console.cloud.google.com/firestore).
2. Click **"CREATE DATABASE"**.
3. Select **"Native mode"** (recommended).
4. Choose a location (e.g., `us-central1`).
5. Choose **"Production mode"** for security rules (you can adjust them later, but by default, Cloud Run will have internal access).

---

### 4. Securely Store Your API Key
Do not hardcode your Gemini API Key. Use Google Cloud Secret Manager.

```bash
# Create a secret named GEMINI_API_KEY
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# Add your actual API key as the secret value
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant Cloud Run access to the Secret Manager
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 4. Prepare for Deployment
Since you plan to host the frontend separately, but the current `Dockerfile` expects `client-dist/` to be present, you must either:
1. Run `npm run build` locally to generate `client-dist/` *before* deploying, so the Docker build succeeds.
2. OR, modify your `Dockerfile` to remove `COPY client-dist/ ./client-dist/` if the server does not serve the frontend files at all.

Assuming you just run a full build locally before deploying:
```bash
# Build both client and server dist folders
npm run build
```

### 5. Deploy to Cloud Run
Deploy your backend app directly from the source code. Cloud Build will automatically build the container from your `Dockerfile`.

```bash
gcloud run deploy debatepro-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --port=8080
```

### 6. Connect Your Separate Client
Once the deployment finishes, `gcloud` will output a **Service URL** (e.g., `https://debatepro-backend-abc123yz-uc.a.run.app`).

In your separately hosted client (e.g., Vercel / Netlify), set your production environment variable to point to this backend URL:

```env
VITE_API_URL=https://debatepro-backend-abc123yz-uc.a.run.app
VITE_WS_URL=wss://debatepro-backend-abc123yz-uc.a.run.app
```
*(Make sure to adjust the env var names based on your Vite setup - usually you replace `http` with `https` and `ws` with `wss`)*

---

## 7. Managing Your Service (Web UI)

You can manage your backend through the **Google Cloud Console**.

### How to access:
1. Visit the [Cloud Run Console](https://console.cloud.google.com/run).
2. Ensure your project (`debate-pro-488321`) is selected in the top bar.
3. Click on the service name: `debatepro-backend`.

### Managing & Monitoring:
*   **Logs**: Click the **"LOGS"** tab to see real-time output from your Node.js server.
*   **Metrics**: The **"METRICS"** tab shows request counts, latency, and CPU/Memory usage.
*   **Updating**: You can redeploy with different environment variables or memory limits using the **"EDIT & DEPLOY NEW REVISION"** button.

### How to Shutdown / Delete:
Cloud Run is "serverless," meaning Google only charges you when requests are actually being processed. However, if you want to completely remove the service:
1. Go to the [Cloud Run Services list](https://console.cloud.google.com/run).
2. Check the box next to `debatepro-backend`.
3. Click **"DELETE"** at the top. This will stop all billing and remove the endpoint.

---

## 8. Data Management (Firestore)

The `FirestoreStore` class (`server/store.ts`) handles saving your coaching sessions.

### Schema Management:
*   **NoSQL / Schema-less**: You do **not** need to create tables or define columns.
*   **Auto-creation**: The first time a session is saved, Firestore will automatically create a `sessions` collection and the document inside it.

### How to see your data:
1. Go to [Firestore Data](https://console.cloud.google.com/firestore/data).
2. You will see a `sessions` collection.
3. Click on any document (Session ID) to see the full transcript, metrics, and generated report.

---

### Final Verification
1. Open your client URL.
2. Select a scenario mode and start a session.
3. Validate that WebSockets connect successfully to Cloud Run and Gemini Live API barge-ins work.
4. Test the post-session report generation to ensure standard Gemini endpoints work too.
