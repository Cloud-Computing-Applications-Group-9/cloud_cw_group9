# Stats Service

A lightweight Python microservice for computing statistical operations on a list of values. Built with FastAPI.

## Supported Methods

| Method       | Description                        |
|--------------|------------------------------------|
| `avg`        | Arithmetic mean                    |
| `sum`        | Sum of all values                  |
| `min`        | Minimum value                      |
| `max`        | Maximum value                      |
| `median`     | Median value                       |
| `stdev`      | Standard deviation (sample)        |
| `variance`   | Variance (sample)                  |
| `percentile` | Nth percentile (requires `percentile` field) |

## API

### `GET /health`
Returns service health status.

### `POST /stats`
**Request body:**
```json
{
  "values": [10, 20, 30, 40, 50],
  "method": "avg",
  "percentile": 90
}
```
> `percentile` field is only required when `method` is `"percentile"`.

**Response:**
```json
{
  "method": "avg",
  "result": 30.0
}
```

## Running Locally

### Option 1 — Python directly
```bash
pip install -r requirements.txt
uvicorn app:app --reload
```

### Option 2 — Docker
```bash
# Build
docker build -t stats_service .

# Run
docker run -d --name stats_service -p 8000:8000 stats_service

# Stop & remove
docker rm -f stats_service
```

Access the Swagger UI at: `http://localhost:8000/docs`
