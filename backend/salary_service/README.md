# Salary Submission Microservice

A Python (FastAPI) microservice for accepting anonymous tech salary submissions.

## API Endpoints

| Method | Endpoint             | Description                            |
| ------ | -------------------- | -------------------------------------- |
| GET    | `/health`            | Returns service health status          |
| POST   | `/api/salaries/`     | Submit a new salary entry              |
| GET    | `/api/salaries/{id}` | Retrieve a salary submission by its ID |

## API

### POST `/api/salaries/`

**Request body:**

```json
{
  "company_name": "ABC Company",
  "role_title": "Software Engineer",
  "experience_level": "Mid",
  "country": "Sri Lanka",
  "base_salary": 250000.0,
  "currency": "LKR",
  "anonymize": false
}
```

**Response:**

```json
{
  "id": "uuid",
  "company_name": "Acme Corp",
  "role_title": "Software Engineer",
  "experience_level": "Mid",
  "country": "Sri Lanka",
  "base_salary": 250000.0,
  "currency": "LKR",
  "anonymize": false,
  "status": "PENDING",
  "submitted_at": "2024-04-15T12:34:56.789Z"
}
```

### GET `/api/salaries/{id}`

Returns the salary submission with the specified ID.

### GET `/health`

Returns:

```json
{ "status": "healthy" }
```

## Running Locally

### Option 1 — Python directly

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Option 2 — Docker

```bash
# Build
docker build -t salary_service .

# Run
docker run -d --name salary_service -p 8000:8000 salary_service

# Stop & remove
docker rm -f salary_service
```

Access the Swagger UI at: [http://localhost:8000/docs](http://localhost:8000/docs)
