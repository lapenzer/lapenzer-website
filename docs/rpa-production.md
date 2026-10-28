# LAPENZER RPA production configuration

## Runtime modes

`/rpa` is the production laboratory. The primary prediction task is unknown-destination route forecasting. A hidden simulation destination is generated only after the graph is complete and is stored outside the predictor inputs. It is revealed only after completion for evaluation.

The lab supports synthetic graphs, imported graphs/trajectories, and a Google Maps mode. Google Maps mode creates a **provider-derived routable-location graph** from sampled locations in the current visible map bounds. It is not labelled as a complete street-intersection topology. The provider-derived graph is built before the hidden destination is generated.

## Google Maps and Routes API

Two credentials are expected:

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: browser key for Maps JavaScript API and Places. Restrict this key by HTTP referrer to the production LAPENZER domains and only the browser APIs required by the lab.
- `GOOGLE_MAPS_SERVER_API_KEY`: server-only key for Routes API `ComputeRouteMatrix` and `ComputeRoutes`. Restrict this key to the Routes API and to the deployment environment where supported. Never expose it to the browser.

Billing and quota must be enabled in the Google Cloud project. When either key, billing, or provider quota is unavailable, the UI must show **Live Map unavailable**. It must not silently replace live/provider data with synthetic data.

The server adapter never receives the hidden endpoint or future observations when building a graph. Top predicted route geometry is requested only after a prediction has already been made from observed history.

## API contract

Implemented Next.js API routes:

- `POST /api/rpa/graphs/build`
- `POST /api/rpa/train`
- `POST /api/rpa/observations`
- `POST /api/rpa/predict/next`
- `POST /api/rpa/predict/destination`
- `POST /api/rpa/predict/beam`
- `POST /api/rpa/evaluate`
- `POST /api/rpa/promote`
- `POST /api/rpa/google/route-matrix`
- `POST /api/rpa/google/compute-route`

Prediction responses include model version, feature schema version, graph version, context/data timestamps, seed, latency and provenance. The in-process session store is intentionally ephemeral; production persistence should be replaced by a durable database without changing the API semantics.

## Python reference backend

`backend/rpa_core.py` contains the reference numerical contract and `backend/rpa_api.py` exposes FastAPI endpoints for core probability/resistance operations. `backend/requirements.txt` lists the production scientific stack: FastAPI, NumPy, SciPy, scikit-learn and NetworkX. The web application currently executes the full interactive model in TypeScript for low-latency browser simulation while retaining the Python service contract for server deployment and cross-language verification.

## Evidence and update boundaries

Class A updates can refresh counts, recency statistics, node visits, observed durations and monitoring statistics after the outcome is known. Class B model updates are gated by held-out/validation metrics and promotion rules. Class C graph rebuilds occur only on material topology/context changes. Ranker weights, calibration temperature and conformal thresholds are never altered directly from a single newly observed outcome.

## Required verification before production claims

Run:

```text
npm run lint
npm run check:models
npm run check:rpa
npm run check:rpa:framework
python -m unittest backend.test_rpa_backend
npm run build
```

Real-world accuracy must be calculated only from predictions stored before their linked real outcomes. Synthetic experiments remain labelled synthetic.
