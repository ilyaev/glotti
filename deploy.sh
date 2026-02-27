#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Glotti — Automated Cloud Deployment Script
#
# This script performs a full deployment to Google Cloud Run, including:
#   1. Enabling required GCP APIs
#   2. Creating Firestore database (if not exists)
#   3. Storing the Gemini API key in Secret Manager (if not exists)
#   4. Building and deploying the container to Cloud Run
#
# Usage:
#   ./deploy.sh                          # Uses current gcloud project
#   ./deploy.sh --project my-project-id  # Specify a project
#   ./deploy.sh --region europe-west1    # Override region (default: us-central1)
#
# Prerequisites:
#   - Google Cloud CLI (gcloud) installed and authenticated
#   - A Gemini API key (will prompt if not in Secret Manager)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ─── Defaults ──────────────────────────────────────────────────────────────────
SERVICE_NAME="debatepro-backend"
REGION="us-central1"
PORT="8080"
SECRET_NAME="GEMINI_API_KEY"

# ─── Parse Arguments ──────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --project) PROJECT_ID="$2"; shift 2 ;;
    --region)  REGION="$2";     shift 2 ;;
    --service) SERVICE_NAME="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ─── Resolve Project ──────────────────────────────────────────────────────────
if [[ -z "${PROJECT_ID:-}" ]]; then
  PROJECT_ID=$(gcloud config get-value project 2>/dev/null || true)
  if [[ -z "$PROJECT_ID" ]]; then
    echo "Error: No project set. Use --project <id> or run: gcloud config set project <id>"
    exit 1
  fi
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              Glotti — Cloud Deployment                  ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Project:  $PROJECT_ID"
echo "║  Region:   $REGION"
echo "║  Service:  $SERVICE_NAME"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ─── Step 1: Enable Required APIs ─────────────────────────────────────────────
echo "▶ Step 1/4: Enabling required GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com \
  --project="$PROJECT_ID" \
  --quiet
echo "  ✅ APIs enabled"

# ─── Step 2: Create Firestore Database (if not exists) ────────────────────────
echo ""
echo "▶ Step 2/4: Setting up Firestore..."
if gcloud firestore databases describe --project="$PROJECT_ID" &>/dev/null; then
  echo "  ✅ Firestore database already exists"
else
  echo "  Creating Firestore database (Native mode)..."
  gcloud firestore databases create \
    --project="$PROJECT_ID" \
    --location="$REGION" \
    --type=firestore-native \
    --quiet
  echo "  ✅ Firestore database created"
fi

# ─── Step 3: Store API Key in Secret Manager (if not exists) ──────────────────
echo ""
echo "▶ Step 3/4: Configuring Secret Manager..."
if gcloud secrets describe "$SECRET_NAME" --project="$PROJECT_ID" &>/dev/null; then
  echo "  ✅ Secret '$SECRET_NAME' already exists"
else
  echo "  Secret '$SECRET_NAME' not found. Creating..."
  # Prompt for the API key
  read -rsp "  Enter your Gemini API key: " API_KEY
  echo ""
  if [[ -z "$API_KEY" ]]; then
    echo "  Error: API key cannot be empty."
    exit 1
  fi
  gcloud secrets create "$SECRET_NAME" \
    --replication-policy="automatic" \
    --project="$PROJECT_ID" \
    --quiet
  printf '%s' "$API_KEY" | gcloud secrets versions add "$SECRET_NAME" \
    --data-file=- \
    --project="$PROJECT_ID" \
    --quiet
  echo "  ✅ Secret created and API key stored"
fi

# Grant Cloud Run's service account access to the secret
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
SA_EMAIL="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
echo "  Granting Secret Manager access to Cloud Run service account..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor" \
  --condition=None \
  --quiet &>/dev/null
echo "  ✅ IAM binding configured"

# ─── Step 4: Build & Deploy to Cloud Run ──────────────────────────────────────
echo ""
echo "▶ Step 4/4: Building and deploying to Cloud Run..."
echo "  This will use Cloud Build to build the Docker image and deploy it."
echo ""
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --allow-unauthenticated \
  --set-secrets="${SECRET_NAME}=${SECRET_NAME}:latest" \
  --port="$PORT" \
  --concurrency=1 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=3600 \
  --memory=512Mi \
  --cpu=1 \
  --quiet

# ─── Done ─────────────────────────────────────────────────────────────────────
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --format='value(status.url)')

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              ✅ Deployment Complete!                     ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Service URL: $SERVICE_URL"
echo "║                                                          ║"
echo "║  Manage:  https://console.cloud.google.com/run           ║"
echo "║  Logs:    gcloud run services logs read $SERVICE_NAME    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
