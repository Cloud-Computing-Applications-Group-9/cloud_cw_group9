# TechSalary LK

A microservices-based salary transparency platform for Sri Lankan tech professionals, deployed on Azure Kubernetes Service.

Users can submit salary data, vote on pending submissions, and browse approved salaries grouped by job title.

**Live app:** http://20.255.123.201

---

## Repository Structure 

```
.
├── .github/
│   └── workflows/
│       └── ci-cd.yml               # GitHub Actions CI/CD pipeline
├── db/
│   └── init.sql                    # PostgreSQL schema initialisation
├── k8s/
│   ├── 00-namespaces.yaml          # Kubernetes namespaces (app, data, ingress-nginx)
│   ├── 01-secrets.yaml             # DB credentials and JWT secret
│   ├── 02-configmap.yaml           # DB connection config
│   ├── 03-postgres.yaml            # PostgreSQL deployment + PersistentVolumeClaim
│   ├── 04-app-deployments.yaml     # All 7 microservice deployments + ClusterIP services
│   ├── 05-ingress.yaml             # nginx Ingress routing rules
│   └── 06-ingress-controller.yaml  # nginx Ingress Controller + Azure Load Balancer
├── services/
│   ├── bff-service/                # API gateway (FastAPI, port 8000)
│   ├── frontend-service/           # Single-page app (nginx, port 80)
│   ├── identity-service/           # Auth + JWT (FastAPI, port 8001)
│   ├── salary-submission-service/  # Submit salaries (FastAPI, port 8002)
│   ├── vote-service/               # Community voting (FastAPI, port 8003)
│   ├── search-service/             # Salary search (FastAPI, port 8004)
│   └── stats-service/              # Aggregated stats (FastAPI, port 8005)
└── docker-compose.yml              # Service + image definitions
```

---

## Architecture

The platform runs on **Azure Kubernetes Service (AKS)** (`techsalary-aks`, East Asia region, `cloud-coursework` resource group).

Traffic enters through an **Azure Load Balancer** and is routed by an **nginx Ingress Controller**:

- `/*` → `frontend-service` — static HTML/JS SPA
- `/api/*` → `bff-service` — API gateway, proxies to downstream services

All microservices run in the `app` namespace. PostgreSQL runs in the `data` namespace with a PersistentVolumeClaim backed by an Azure Disk. Container images are stored in **Azure Container Registry** (`techsalaryacr.azurecr.io`).

### Services

| Service | Port | Responsibility |
|---|---|---|
| frontend-service | 80 | HTML/JS SPA served by nginx |
| bff-service | 8000 | Backend-for-frontend: routing and JWT enforcement |
| identity-service | 8001 | User registration, login, JWT issuance (bcrypt + HS256) |
| salary-submission-service | 8002 | Submit salary records (created as PENDING) |
| vote-service | 8003 | Upvote/downvote PENDING entries; auto-approves at net_votes ≥ 3 |
| search-service | 8004 | Search salaries by job title; results grouped by designation |
| stats-service | 8005 | Aggregated salary statistics |

### Database

PostgreSQL 15 with three schemas:

| Schema | Table | Purpose |
|---|---|---|
| `identity` | `users` | Email and bcrypt-hashed password |
| `salary` | `salary_submissions` | Job data, status (PENDING/APPROVED), net_votes |
| `community` | `votes` | Per-user vote records |

Salary records contain no email or user identity — privacy by design.

---

## Submission Approval Flow

```
Submit salary
      │
      ▼
   PENDING ──── logged-in users can vote 👍 👎
      │
      └── net_votes ≥ 3? ──Yes──▶ APPROVED (visible to all users)
                          ──No──▶ stays PENDING (visible to logged-in users only)
```

---

## CI/CD Pipeline

Defined in `.github/workflows/ci-cd.yml`. Two separate jobs — build is automatic, deploy is manual.

### Build (runs on every push to `main`)

Detects which `services/` directories changed and builds only those images, tagged with the short Git SHA:

```
git push → detect changed services → docker buildx (linux/amd64) → push to ACR
```

The build job summary prints the image tag and a link to trigger the deploy.

### Deploy (manual trigger)

Go to **Actions → CI/CD Pipeline → Run workflow** and provide:

- `image_tag` — the Git SHA shown in the build summary (e.g. `a1b2c3d4`)
- A boolean toggle for each service you want to roll out

```
Run workflow → kubectl set image → AKS rolling update → rollout status check
```

This separation ensures no commit can automatically reach the live environment without a deliberate deploy trigger.

### Required GitHub Secret

| Secret | Description |
|---|---|
| `AZURE_CREDENTIALS` | Service Principal JSON from `az ad sp create-for-rbac` with Contributor access to the `cloud-coursework` resource group |

---

## Kubernetes Manifests

Manifests are applied in numbered order. This is only needed when rebuilding the cluster from scratch — ongoing deployments are handled by the CI/CD pipeline.

```bash
kubectl apply -f k8s/00-namespaces.yaml
kubectl apply -f k8s/01-secrets.yaml
kubectl apply -f k8s/02-configmap.yaml
kubectl apply -f k8s/03-postgres.yaml
kubectl apply -f k8s/06-ingress-controller.yaml
kubectl apply -f k8s/04-app-deployments.yaml
kubectl apply -f k8s/05-ingress.yaml
```

To initialise the database schema after PostgreSQL is running:

```bash
POD=$(kubectl get pod -n data -l app=postgres -o jsonpath='{.items[0].metadata.name}')
kubectl cp db/init.sql data/$POD:/tmp/init.sql
kubectl exec -n data $POD -- psql -U techsalary -d techsalary -f /tmp/init.sql
```

---

## Useful kubectl Commands

```bash
# Check pod status
kubectl get pods -n app
kubectl get pods -n data

# View service logs
kubectl logs -n app deployment/bff-service
kubectl logs -n app deployment/vote-service

# Check ingress and external IP
kubectl get ingress -n app
kubectl get svc -n ingress-nginx

# Check persistent storage
kubectl get pvc -n data
```

---

## Security

- Passwords hashed with bcrypt
- JWT tokens signed with HS256, enforced at the BFF layer
- All microservices exposed internally via ClusterIP only (not publicly reachable)
- Salary records store no email or user identity
- Kubernetes Secrets used for credentials and JWT signing key — nothing hardcoded in source
