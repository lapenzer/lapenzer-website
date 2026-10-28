"""FastAPI reference service for the RPA numerical contract."""
from __future__ import annotations
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from .rpa_core import Edge, generalized_resistance, distance_only_probabilities, candidate_probabilities

app = FastAPI(title="LAPENZER RPA backend", version="4.0")

class ResistanceRequest(BaseModel):
    edge: dict
    coefficients: dict[str, float] | None = None

class DistanceRequest(BaseModel):
    distances: list[float]
    alpha: float = 1.0

class CandidateRequest(BaseModel):
    beta_dot: list[float]
    attraction: list[float]
    resistance: list[float]
    resistance_lambda: float = .65

@app.get("/health")
def health():
    return {"ok": True, "service": "lapenzer-rpa", "version": "4.0"}

@app.post("/resistance")
def resistance(req: ResistanceRequest):
    try:
        payload = req.edge
        edge = Edge(id=str(payload.get("id", "edge")), source=str(payload.get("from", payload.get("source", "u"))), target=str(payload.get("to", payload.get("target", "v"))), distance_km=float(payload.get("distanceKm", payload.get("distance_km", 0))), terrain=float(payload.get("terrain", 0)), movement=float(payload.get("movement", payload.get("traffic", 0))), logistics=float(payload.get("logistics", 0)), weather=float(payload.get("weather", 0)), risk=float(payload.get("risk", 0)), interest=float(payload.get("interest", 0)), asset=float(payload.get("asset", 0)))
        value, components = generalized_resistance(edge, req.coefficients)
        return {"resistance": value, "components": components}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@app.post("/distance-probabilities")
def distance_probabilities(req: DistanceRequest):
    return {"probabilities": distance_only_probabilities(req.distances, req.alpha)}

@app.post("/candidate-probabilities")
def candidates(req: CandidateRequest):
    try:
        return {"probabilities": candidate_probabilities(req.beta_dot, req.attraction, req.resistance, req.resistance_lambda)}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
