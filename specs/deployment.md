# Deploying Glotti

The simplest deployment is a **single Cloud Run service** that serves both the backend (API + WebSocket) and the frontend (static React build). This is described in Part 1.

If you need to host the frontend separately (e.g., for CDN edge caching, custom domain routing, or independent scaling), see Part 2.

---

## Part 1: Full Deployment — Google Cloud Run (Backend + Frontend)

### Prerequisites

- [Google Cloud CLI (`gcloud`)](https://cloud.google.com/sdk/docs/install) installed and initialized
- A [Gemini API key](https://aistudio.google.com/apikey)
- A Google Cloud project with billing enabled

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 1. Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com
```

### 2. Set Up Firestore

Firestore stores session data, transcripts, and reports. No schema or table creation needed — collections are created automatically on first write.

1. Go to the [Firestore Console](https://console.cloud.google.com/firestore)
2. Click **"CREATE DATABASE"**
3. Select **Native mode**
4. Choose a location (e.g., `us-central1`)
5. Select **Production mode** for security rules

### 3. Store Your API Key in Secret Manager

```bash
# Create the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# Add your API key value
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant Cloud Run access to the secret
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 4. Deploy

The project uses a multi-stage Dockerfile that builds both the TypeScript server and the React client. The runtime image serves the client as static files alongside the API and WebSocket endpoints.

```bash
gcloud run deploy glotti \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --port=8080
```

Once the deploy finishes, `gcloud` prints the service URL (e.g., `https://glotti-abc123yz-uc.a.run.app`). Open it in a browser — both the app UI and the backend are served from this single URL.

---

## Part 2: Separate Frontend Hosting (Optional)

If you prefer to serve the frontend independently — for example, to use a CDN, a custom domain with a different provider, or to decouple frontend and backend release cycles — you can build and deploy the client separately.

### Build the Client

```bash
cd client
npm install
npm run build
```

This produces a `client-dist/` directory containing static files (HTML, JS, CSS) ready for deployment.

### Configure the Backend URL

The client connects to the backend via a `VITE_WS_URL` environment variable. When served from the same Cloud Run instance (Part 1), this is not needed — it defaults to the current page's host. For separate deployments, set it before building:

```bash
VITE_WS_URL=wss://glotti-abc123yz-uc.a.run.app npm run build
```

### Deployment Options

#### Vercel

```bash
npm install -g vercel
cd client-dist
vercel --prod
```

Or connect your GitHub repo in the [Vercel Dashboard](https://vercel.com/dashboard) and set:
- **Build Command:** `cd client && npm run build`
- **Output Directory:** `client-dist`
- **Environment Variable:** `VITE_WS_URL` = `wss://YOUR_BACKEND_URL`

#### Netlify

```bash
npm install -g netlify-cli
cd client-dist
netlify deploy --prod --dir=.
```

Or connect your repo in [Netlify](https://app.netlify.com/) with the same build settings as Vercel above.

#### Cloudflare Pages

1. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
2. Connect your GitHub repo
3. Set **Build Command:** `cd client && npm run build`
4. Set **Build Output Directory:** `client-dist`
5. Add environment variable `VITE_WS_URL`

#### DigitalOcean App Platform

1. Go to [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
2. Create a new app from your GitHub repo
3. Select **Static Site** as the component type
4. Set **Build Command:** `cd client && npm run build`
5. Set **Output Directory:** `client-dist`
6. Add environment variable `VITE_WS_URL`

#### Google Cloud Storage (Static Site)

```bash
# Create a bucket
gsutil mb -l us-central1 gs://YOUR_BUCKET_NAME

# Enable static website hosting
gsutil web set -m index.html -e index.html gs://YOUR_BUCKET_NAME

# Upload the build
gsutil -m rsync -r client-dist/ gs://YOUR_BUCKET_NAME

# Make publicly readable
gsutil iam ch allUsers:objectViewer gs://YOUR_BUCKET_NAME
```

---

## Verify

1. Open the frontend URL in your browser
2. Select a scenario mode and start a session
3. Confirm that WebSocket audio streaming and Gemini Live API barge-ins work
4. End the session and verify the report is generated and saved

---

## Managing the Backend

### Logs & Metrics
- [Cloud Run Console](https://console.cloud.google.com/run) — select your service
- **LOGS** tab for real-time server output
- **METRICS** tab for request counts, latency, and resource usage

### Viewing Session Data
- [Firestore Console](https://console.cloud.google.com/firestore/data) — browse the `sessions` collection

### Redeploying
Run the same `gcloud run deploy` command. Cloud Build will create a new revision automatically.

### Shutting Down
Cloud Run scales to zero when idle (no cost). To fully remove the service:
1. Go to the [Cloud Run services list](https://console.cloud.google.com/run)
2. Select the service and click **DELETE**
