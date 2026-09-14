# ResilienceOS Backend Integration

The React frontend in `client/src/pages/Home.tsx` is connected to the simulation backend.

## Development

Run both layers with:

```bash
npm run dev:all
```

Frontend: http://localhost:3000
Backend: http://localhost:3001

Vite proxies `/api/*` to the backend in development.

## API

- `GET /api/health`
- `GET /api/network`
- `POST /api/simulate`
- `GET /api/analytics/criticality`
- `GET /api/analytics/bottlenecks`
- `GET /api/scenarios`
- `GET /api/scenarios/:name`

The frontend no longer calculates the cascade from hardcoded scenario arrays. It requests the network and simulation results from the backend and renders the returned state.

## Example

```json
{
  "failedAssets": ["river_bridge", "power_central"],
  "severity": "major",
  "outageHours": 24
}
```

The response includes cascade depth, affected assets, population exposure, hospital overload, emergency response, resilience, criticality, bottlenecks, timeline and mitigation options.

All infrastructure and numeric values are synthetic demonstration data.
