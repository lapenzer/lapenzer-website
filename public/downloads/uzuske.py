from __future__ import annotations

import argparse
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from dataclasses import dataclass
from math import exp, log
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

VERSION = "1.0.0"

@dataclass(frozen=True)
class RoutePrediction:
    route: List[str]
    probability: float
    score: float


def normalize_graph(edges: Iterable[dict]) -> Dict[str, List[Tuple[str, float]]]:
    graph: Dict[str, List[Tuple[str, float]]] = {}
    for edge in edges:
        source = str(edge["source"])
        target = str(edge["target"])
        weight = float(edge.get("weight", 1.0))
        if weight <= 0:
            raise ValueError("edge weights must be greater than zero")
        graph.setdefault(source, []).append((target, weight))
        graph.setdefault(target, [])
    return graph


def transition_counts(traces: Iterable[Iterable[str]]) -> Dict[Tuple[str, str], int]:
    counts: Dict[Tuple[str, str], int] = {}
    for trace in traces:
        items = [str(x) for x in trace]
        for a, b in zip(items, items[1:]):
            counts[(a, b)] = counts.get((a, b), 0) + 1
    return counts


def transition_probability(graph, counts, source: str, target: str) -> float:
    neighbors = graph.get(source, [])
    if not neighbors:
        return 1e-12
    total_count = sum(counts.get((source, n), 0) for n, _ in neighbors)
    total_weight = sum(weight for _, weight in neighbors)
    target_weight = next((weight for n, weight in neighbors if n == target), 0.0)
    target_count = counts.get((source, target), 0)
    empirical = (target_count + 1.0) / (total_count + len(neighbors))
    structural = target_weight / total_weight if total_weight else 1.0 / len(neighbors)
    return max(1e-12, 0.72 * empirical + 0.28 * structural)


def recency_bonus(observations: List[str], a: str, b: str) -> float:
    bonus = 1.0
    pairs = list(zip(observations, observations[1:]))
    for idx, pair in enumerate(pairs):
        if pair == (a, b):
            age = len(pairs) - idx - 1
            bonus += 0.18 * exp(-0.55 * age)
    return bonus


def predict_routes(payload: dict, top_k: int = 4, beam_width: int = 48, max_hops: int = 8) -> List[RoutePrediction]:
    graph = normalize_graph(payload.get("edges", []))
    start = str(payload["start"])
    destination = str(payload["destination"])
    observations = [str(x) for x in payload.get("observations", [])]
    counts = transition_counts(payload.get("historical_traces", []))

    if start not in graph:
        raise ValueError(f"start node {start!r} is not present in the network")
    if destination not in graph:
        raise ValueError(f"destination node {destination!r} is not present in the network")

    beam: List[Tuple[float, List[str]]] = [(0.0, [start])]
    completed: List[Tuple[float, List[str]]] = []

    for _ in range(max_hops):
        expanded: List[Tuple[float, List[str]]] = []
        for score, path in beam:
            current = path[-1]
            if current == destination:
                completed.append((score, path))
                continue
            for neighbor, _ in graph.get(current, []):
                if neighbor in path:
                    continue
                p = transition_probability(graph, counts, current, neighbor)
                p *= recency_bonus(observations, current, neighbor)
                expanded.append((score + log(max(p, 1e-12)), path + [neighbor]))
        if not expanded:
            break
        expanded.sort(key=lambda item: item[0], reverse=True)
        beam = expanded[:beam_width]

    completed.extend((score, path) for score, path in beam if path[-1] == destination)
    if not completed:
        raise ValueError(f"no route found from {start} to {destination} within {max_hops} hops")

    best: Dict[Tuple[str, ...], float] = {}
    for score, path in completed:
        key = tuple(path)
        best[key] = max(score, best.get(key, float("-inf")))

    ranked = sorted(((score, list(path)) for path, score in best.items()), reverse=True)[:top_k]
    max_score = ranked[0][0]
    weights = [exp(score - max_score) for score, _ in ranked]
    total = sum(weights)
    return [RoutePrediction(path, weight / total, score) for (score, path), weight in zip(ranked, weights)]


def run_file(path: str, top_k: int, json_output: bool) -> int:
    source = Path(path)
    if not source.exists():
        raise SystemExit(f"input file not found: {source}")
    payload = json.loads(source.read_text(encoding="utf-8"))
    predictions = predict_routes(payload, top_k=max(1, top_k))

    if json_output:
        print(json.dumps({
            "model": "UZUSKE",
            "version": VERSION,
            "routes": [{"route": p.route, "probability": round(p.probability, 6)} for p in predictions],
        }, indent=2))
        return 0

    print(f"UZUSKE {VERSION}")
    print(f"Input network: {source.name}")
    print(f"Observations: {len(payload.get('observations', []))}")
    print("\nCalculating candidate routes...\n")
    for index, p in enumerate(predictions, 1):
        route = " -> ".join(p.route)
        print(f"{index:<3} {route:<38} {p.probability * 100:6.2f}%")
    print("\nPrediction complete.")
    return 0


def serve(port: int) -> int:
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path == "/health":
                body = json.dumps({"status": "ok", "model": "UZUSKE", "version": VERSION}).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            self.send_error(404)

        def do_POST(self):
            if self.path != "/predict":
                self.send_error(404)
                return
            try:
                length = int(self.headers.get("Content-Length", "0"))
                payload = json.loads(self.rfile.read(length).decode("utf-8"))
                predictions = predict_routes(payload, top_k=int(payload.get("top_k", 4)))
                response = {
                    "model": "UZUSKE",
                    "version": VERSION,
                    "routes": [
                        {"route": item.route, "probability": round(item.probability, 6)}
                        for item in predictions
                    ],
                }
                body = json.dumps(response).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            except Exception as exc:
                body = json.dumps({"error": str(exc)}).encode("utf-8")
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)

        def log_message(self, fmt, *args):
            print(f"[UZUSKE] {fmt % args}")

    server = HTTPServer(("127.0.0.1", port), Handler)
    print(f"UZUSKE {VERSION} local API listening on http://127.0.0.1:{port}")
    print("GET /health   POST /predict")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping UZUSKE.")
    finally:
        server.server_close()
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(prog="uzuske", description="UZUSKE local route prediction model")
    parser.add_argument("command", choices=["run", "serve", "version"])
    parser.add_argument("input", nargs="?")
    parser.add_argument("--top-k", type=int, default=4)
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()
    if args.command == "version":
        print(f"UZUSKE {VERSION}")
        return 0
    if args.command == "serve":
        return serve(args.port)
    if not args.input:
        parser.error("run requires a network JSON file")
    return run_file(args.input, args.top_k, args.json)


if __name__ == "__main__":
    raise SystemExit(main())
