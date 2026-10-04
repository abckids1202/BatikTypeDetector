from __future__ import annotations

import io
import math
import uuid
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageFilter, ImageStat, UnidentifiedImageError
from pydantic import BaseModel


class Motif(BaseModel):
    slug: str
    name: str
    family: str
    summary: str
    visual_signature: list[str]
    traditional_associations: list[str]
    source_status: str = "curation-required"


MOTIFS = [
    Motif(
        slug="kawung",
        name="Kawung",
        family="Geometric",
        summary="A structured family of repeating oval forms arranged around a central axis.",
        visual_signature=["repeated ovals", "four-way rhythm", "strong symmetry"],
        traditional_associations=["Yogyakarta-associated in curated heritage records"],
    ),
    Motif(
        slug="parang",
        name="Parang",
        family="Diagonal",
        summary="A family of slanted, repeating forms that create a directional visual rhythm.",
        visual_signature=["diagonal flow", "continuous repetition", "banded rhythm"],
        traditional_associations=["Courtly Javanese associations vary by documented variant"],
    ),
    Motif(
        slug="mega-mendung",
        name="Mega Mendung",
        family="Organic",
        summary="A cloud-like motif family recognized for layered contours and a sweeping silhouette.",
        visual_signature=["layered contours", "cloud-like curves", "large-scale rhythm"],
        traditional_associations=["Cirebon-associated in curated heritage records"],
    ),
    Motif(
        slug="truntum",
        name="Truntum",
        family="Floral",
        summary="A repeating field of small star or flower-like units with a fine-grained cadence.",
        visual_signature=["small repeated units", "dense field", "even spacing"],
        traditional_associations=["Documented associations depend on the source and variant"],
    ),
    Motif(
        slug="ceplok",
        name="Ceplok",
        family="Geometric",
        summary="A broad family of geometric compositions built from repeated modular cells.",
        visual_signature=["modular cells", "grid repetition", "balanced geometry"],
        traditional_associations=["A family label; individual variants require separate documentation"],
    ),
    Motif(
        slug="nitik",
        name="Nitik",
        family="Geometric",
        summary="A fine, dotted visual language that creates textile-like texture through small marks.",
        visual_signature=["dotted texture", "fine repetition", "woven-looking cadence"],
        traditional_associations=["Associations should be read from reviewed source records"],
    ),
    Motif(
        slug="sekar-jagad",
        name="Sekar Jagad",
        family="Composite",
        summary="A composite field that brings several patch-like visual zones into one composition.",
        visual_signature=["patchwork structure", "varied zones", "composite rhythm"],
        traditional_associations=["Interpretive claims require explicit provenance"],
    ),
]

MOTIF_BY_SLUG = {motif.slug: motif for motif in MOTIFS}


class Prediction(BaseModel):
    motif: str
    motif_slug: str
    probability: float


class AnalysisResult(BaseModel):
    analysis_id: str
    filename: str
    model_version: str
    evaluation_status: str
    known_pattern_probability: float
    ood_score: float
    confidence_level: str
    predictions: list[Prediction]
    features: dict[str, float]
    matches: list[dict[str, Any]]
    cultural_context: dict[str, Any]


app = FastAPI(
    title="BatikVision API",
    version="0.1.0",
    description="Prototype visual analysis and cultural knowledge API for BatikVision.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def rounded(value: float) -> float:
    return round(max(0.0, min(1.0, value)), 3)


def extract_features(image: Image.Image) -> dict[str, float]:
    image = image.convert("RGB")
    image.thumbnail((256, 256))
    stat = ImageStat.Stat(image)
    channels = [channel / 255 for channel in stat.mean]
    brightness = sum(channels) / 3
    contrast = rounded(sum(stat.rms) / (3 * 255) - brightness * 0.15)
    gray = image.convert("L")
    edges = gray.filter(ImageFilter.FIND_EDGES)
    edge_density = rounded(ImageStat.Stat(edges).mean[0] / 255)
    width, height = image.size
    aspect_balance = rounded(1 - abs(math.log(max(width, 1) / max(height, 1))) / 4)
    return {
        "mean_red": rounded(channels[0]),
        "mean_green": rounded(channels[1]),
        "mean_blue": rounded(channels[2]),
        "brightness": brightness,
        "contrast": contrast,
        "edge_density": edge_density,
        "aspect_balance": aspect_balance,
    }


def prototype_predictions(features: dict[str, float]) -> tuple[list[Prediction], float, float, str]:
    # This is a transparent, deterministic stand-in for the future trained model.
    # It keeps the API and UX testable without implying that the prototype is evaluated.
    b = features["brightness"]
    c = features["contrast"]
    e = features["edge_density"]
    r = features["mean_red"]
    g = features["mean_green"]
    blue = features["mean_blue"]
    raw_scores = {
        "kawung": 0.48 + 0.28 * (1 - abs(c - 0.42)) + 0.12 * (1 - abs(e - 0.24)),
        "parang": 0.44 + 0.25 * (1 - abs(e - 0.32)) + 0.1 * features["aspect_balance"],
        "mega-mendung": 0.42 + 0.26 * (1 - abs(blue - 0.42)) + 0.16 * (1 - abs(c - 0.3)),
        "truntum": 0.41 + 0.26 * (1 - abs(e - 0.46)) + 0.1 * (1 - abs(b - 0.52)),
        "ceplok": 0.43 + 0.27 * (1 - abs(c - 0.5)) + 0.1 * (1 - abs(e - 0.3)),
        "nitik": 0.4 + 0.3 * (1 - abs(e - 0.56)) + 0.08 * (1 - abs(c - 0.58)),
        "sekar-jagad": 0.4 + 0.18 * (1 - abs(r - g)) + 0.18 * (1 - abs(c - 0.34)),
    }
    total = sum(max(value, 0.01) for value in raw_scores.values())
    predictions = [
        Prediction(
            motif=MOTIF_BY_SLUG[slug].name,
            motif_slug=slug,
            probability=rounded(max(value, 0.01) / total),
        )
        for slug, value in raw_scores.items()
    ]
    predictions.sort(key=lambda item: item.probability, reverse=True)
    # Keep the visual result calibrated as a prototype rather than a confident claim.
    pattern_signal = 0.35 + 0.4 * e + 0.25 * c
    known = rounded(min(0.93, max(0.18, pattern_signal)))
    ood = rounded(1 - known)
    confidence = "High" if known >= 0.78 else "Moderate" if known >= 0.54 else "Low"
    return predictions[:3], known, ood, confidence


def matches_for(primary: Prediction) -> list[dict[str, Any]]:
    return [
        {
            "image_id": f"demo-{primary.motif_slug}-{index}",
            "motif": primary.motif,
            "motif_slug": primary.motif_slug,
            "similarity": rounded(0.91 - index * 0.07),
            "verification_level": "curation-required",
            "thumbnail": f"/demo-images/{primary.motif_slug}-{index}.jpg",
        }
        for index in range(1, 4)
    ]


@app.get("/api/v1/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "batikvision-api", "model_status": "prototype"}


@app.get("/api/v1/motifs", response_model=list[Motif])
def list_motifs() -> list[Motif]:
    return MOTIFS


@app.get("/api/v1/motifs/{slug}", response_model=Motif)
def get_motif(slug: str) -> Motif:
    motif = MOTIF_BY_SLUG.get(slug)
    if motif is None:
        raise HTTPException(status_code=404, detail="Motif not found")
    return motif


@app.post("/api/v1/analyses", response_model=AnalysisResult)
async def create_analysis(file: UploadFile = File(...)) -> AnalysisResult:
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Upload a JPG, PNG, or WEBP image.")
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Images must be 10 MB or smaller.")
    try:
        image = Image.open(io.BytesIO(content))
        image.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(status_code=422, detail="The uploaded file is not a readable image.") from exc
    if image.width < 64 or image.height < 64:
        raise HTTPException(status_code=422, detail="Use an image at least 64 by 64 pixels.")

    features = extract_features(image)
    predictions, known, ood, confidence = prototype_predictions(features)
    primary = predictions[0]
    motif = MOTIF_BY_SLUG[primary.motif_slug]
    return AnalysisResult(
        analysis_id=str(uuid.uuid4()),
        filename=file.filename or "uploaded-image",
        model_version="prototype-features-v0.1",
        evaluation_status="not-evaluated",
        known_pattern_probability=known,
        ood_score=ood,
        confidence_level=confidence,
        predictions=predictions,
        features=features,
        matches=matches_for(primary),
        cultural_context={
            "motif": motif.name,
            "summary": motif.summary,
            "visual_signature": motif.visual_signature,
            "traditional_associations": motif.traditional_associations,
            "source_status": motif.source_status,
        },
    )
