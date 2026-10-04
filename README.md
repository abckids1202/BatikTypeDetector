# BatikVision

BatikVision is a visual heritage explorer for Indonesian batik. It separates three things that are often conflated in image-classification demos:

- an experimental visual prediction
- visual similarity between images
- curated cultural knowledge with provenance

The first slice in this repository is intentionally honest about its current state. The FastAPI service performs a deterministic visual-feature analysis so the full upload flow is runnable from day one. It is labelled as an experimental prototype until trained, evaluated model artifacts and curator-reviewed sources are added.

## Run locally

### Frontend

Requires Node.js 18 or newer.

    cd frontend
    npm install
    npm run dev

### Backend

Requires Python 3.11 or newer.

    cd backend
    python -m venv .venv
    .venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn app.main:app --reload --port 8000

The Vite dev server runs on port 5173 and proxies API requests to the backend. The API documentation is available at http://localhost:8000/docs.

## Docker

    docker compose up --build

This starts the frontend on port 5173 and the API on port 8000. PostgreSQL, pgvector, object storage, and a trained model service are deliberately not bundled yet; their interfaces are described in the project documentation and are the next integration boundary.

## Product principles

- Use “likely motif family”, not “this is definitely authentic”.
- Label similarity as visual similarity, never as probability.
- Keep regional associations and historical claims in source-backed records.
- Treat model explanations as influential image regions, not cultural explanations.
- Surface unknown and out-of-distribution states instead of forcing a label.

## Next milestones

1. Add a provenance-preserving dataset ingestion and duplicate-group split pipeline.
2. Train and evaluate a MobileNetV3 or EfficientNet baseline.
3. Replace the prototype analyzer behind the existing service interface.
4. Add pgvector-backed retrieval and cached atlas coordinates.
5. Add curator authentication, claim review, and source management.

