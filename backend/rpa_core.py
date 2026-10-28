"""Reference FastAPI/Python numerical core for LAPENZER RPA v4.
The web UI runs the TypeScript implementation; this module is the backend reference
for graph/state/resistance/probability contracts and server-side validation.
"""
from __future__ import annotations
from dataclasses import dataclass
from math import atan2, cos, exp, log, radians, sin, sqrt
from typing import Iterable, Sequence

EARTH_RADIUS_M = 6_371_008.8
EPS = 1e-12
MATRIX_NAMES = ("distance", "terrain", "movement", "logistics", "weather", "risk", "interest", "asset")

@dataclass(frozen=True)
class Node:
    id: str
    x: float
    y: float
    lat: float | None = None
    lon: float | None = None
    attraction: float = 1.0

@dataclass(frozen=True)
class Edge:
    id: str
    source: str
    target: str
    distance_km: float
    terrain: float = 0.0
    movement: float = 0.0
    logistics: float = 0.0
    weather: float = 0.0
    risk: float = 0.0
    interest: float = 0.0
    asset: float = 0.0

@dataclass(frozen=True)
class Observation:
    timestamp: float
    x: float | None = None
    y: float | None = None
    lat: float | None = None
    lon: float | None = None
    accuracy_m: float = 25.0


def stable_softmax(logits: Sequence[float], temperature: float = 1.0) -> list[float]:
    if not logits:
        return []
    t = max(0.05, float(temperature))
    m = max(logits)
    ex = [exp((v - m) / t) for v in logits]
    z = sum(ex) or 1.0
    return [v / z for v in ex]


def haversine_m(a_lat: float, a_lon: float, b_lat: float, b_lon: float) -> float:
    p1, p2 = radians(a_lat), radians(b_lat)
    dp, dl = radians(b_lat - a_lat), radians(b_lon - a_lon)
    h = sin(dp / 2) ** 2 + cos(p1) * cos(p2) * sin(dl / 2) ** 2
    return 2 * EARTH_RADIUS_M * atan2(sqrt(h), sqrt(max(0.0, 1 - h)))


def observation_distance(node: Node, obs: Observation) -> float:
    if node.lat is not None and node.lon is not None and obs.lat is not None and obs.lon is not None:
        return haversine_m(node.lat, node.lon, obs.lat, obs.lon)
    if obs.x is None or obs.y is None:
        return float("inf")
    return sqrt((node.x - obs.x) ** 2 + (node.y - obs.y) ** 2)


def map_match(nodes: Iterable[Node], observation: Observation, top_k: int = 5) -> list[tuple[str, float]]:
    sigma = max(1.0, observation.accuracy_m)
    scored = []
    for node in nodes:
        d = observation_distance(node, observation)
        likelihood = exp(-0.5 * (d / sigma) ** 2) if d < float("inf") else 0.0
        scored.append((node.id, likelihood))
    scored.sort(key=lambda x: x[1], reverse=True)
    scored = scored[:max(1, top_k)]
    z = sum(v for _, v in scored) or 1.0
    return [(node_id, value / z) for node_id, value in scored]


def generalized_resistance(edge: Edge, coefficients: dict[str, float] | None = None) -> tuple[float, dict[str, float]]:
    coeff = {"distance": 1.0, "terrain": .55, "movement": .35, "logistics": .45, "weather": .5, "risk": .7, "interest": -.35, "asset": -.25}
    if coefficients:
        coeff.update(coefficients)
    values = {"distance": edge.distance_km, "terrain": edge.terrain, "movement": edge.movement, "logistics": edge.logistics, "weather": edge.weather, "risk": edge.risk, "interest": edge.interest, "asset": edge.asset}
    return sum(coeff[k] * values[k] for k in MATRIX_NAMES), values


def distance_only_probabilities(distances: Sequence[float], alpha: float) -> list[float]:
    return stable_softmax([-max(0.0, alpha) * max(0.0, d) for d in distances])


def candidate_probabilities(beta_dot: Sequence[float], attraction: Sequence[float], resistance: Sequence[float], resistance_lambda: float = .65) -> list[float]:
    if not (len(beta_dot) == len(attraction) == len(resistance)):
        raise ValueError("candidate vectors must have the same length")
    logits = [b + log(max(EPS, a)) - resistance_lambda * r for b, a, r in zip(beta_dot, attraction, resistance)]
    return stable_softmax(logits)


def bayesian_shrinkage(entity_count: float, entity_total: float, population_probability: float, tau: float = 20.0) -> float:
    prior = min(1 - EPS, max(EPS, population_probability))
    return (max(0.0, entity_count) + max(0.0, tau) * prior) / max(EPS, max(0.0, entity_total) + max(0.0, tau))


def brier(probabilities: Sequence[float], true_index: int) -> float:
    return sum((p - (1.0 if i == true_index else 0.0)) ** 2 for i, p in enumerate(probabilities))


def nll(probabilities: Sequence[float], true_index: int) -> float:
    return -log(max(EPS, probabilities[true_index]))
