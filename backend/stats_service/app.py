from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import statistics
from typing import List, Optional

app = FastAPI(title="Stats Service", version="1.0.0")


class StatsRequest(BaseModel):
    values: List[float]
    method: str
    percentile: Optional[float] = None  # required when method is "percentile"


class StatsResponse(BaseModel):
    method: str
    result: float


SUPPORTED_METHODS = {"avg", "sum", "min", "max", "median", "percentile", "stdev", "variance"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/stats", response_model=StatsResponse)
def compute_stats(req: StatsRequest):
    if not req.values:
        raise HTTPException(status_code=400, detail="values list must not be empty")

    method = req.method.lower()

    if method not in SUPPORTED_METHODS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported method '{method}'. Supported: {sorted(SUPPORTED_METHODS)}"
        )

    values = req.values

    if method == "avg":
        result = statistics.mean(values)
    elif method == "sum":
        result = sum(values)
    elif method == "min":
        result = min(values)
    elif method == "max":
        result = max(values)
    elif method == "median":
        result = statistics.median(values)
    elif method == "stdev":
        if len(values) < 2:
            raise HTTPException(status_code=400, detail="stdev requires at least 2 values")
        result = statistics.stdev(values)
    elif method == "variance":
        if len(values) < 2:
            raise HTTPException(status_code=400, detail="variance requires at least 2 values")
        result = statistics.variance(values)
    elif method == "percentile":
        if req.percentile is None:
            raise HTTPException(status_code=400, detail="'percentile' field is required for percentile method")
        if not (0 <= req.percentile <= 100):
            raise HTTPException(status_code=400, detail="percentile must be between 0 and 100")
        sorted_values = sorted(values)
        k = (req.percentile / 100) * (len(sorted_values) - 1)
        lower, upper = int(k), min(int(k) + 1, len(sorted_values) - 1)
        result = sorted_values[lower] + (k - lower) * (sorted_values[upper] - sorted_values[lower])

    return StatsResponse(method=method, result=result)
