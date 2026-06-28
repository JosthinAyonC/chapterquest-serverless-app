# Architecture — LitCircle (ChapterQuest)

Visión técnica de la plataforma. La definición funcional del producto está en **[ProductSpec.md](./ProductSpec.md)**.

---

## Visión general

LitCircle es una plataforma serverless en AWS orientada a **sesiones de círculo literario en escuelas**: biblioteca curada en S3, API REST para sesiones/reviews, y **WebSocket API** para sincronía en aula.

```mermaid
flowchart TD
  user[Usuario / Host / Estudiante]
  user --> cf[CloudFront]
  cf --> s3web[S3 frontend hosting]
  user --> apigw[API Gateway HTTP API]
  user --> wss[API Gateway WebSocket API]
  apigw --> lusers[Lambda users]
  apigw --> llibrary[Lambda library]
  apigw --> lsessions[Lambda sessions]
  wss --> lws[Lambda ws handlers]
  lusers --> ddbUsers[(DynamoDB Users)]
  lsessions --> ddbSessions[(DynamoDB Sessions)]
  llibrary --> s3library[S3 library bucket]
  lsessions --> s3library
  lws --> ddbSessions
  subgraph cicd [GitHub Actions OIDC]
    gha[Workflows] --> cfn[CloudFormation deploy]
  end
```

---

## Capas del monorepo

| Directorio | Responsabilidad |
|------------|-----------------|
| `frontend/` | SPA React — landing, biblioteca, guía, juguemos, review |
| `functions/` | Handlers Lambda + servidor local Express |
| `infrastructure/` | CloudFormation modular por capa |
| `scripts/` | Build, deploy stacks y frontend |
| `.github/workflows/` | CI/CD con detección de cambios por path |

---

## Infraestructura (nested stacks)

```mermaid
flowchart LR
  root[root stack] --> net[networking]
  root --> storage[storage]
  root --> db[database]
  root --> api[api]
  root --> front[frontend]
  storage --> api
  db --> api
  storage --> front
  net --> api
  net --> front
```

| Stack | Recursos |
|-------|----------|
| `networking` | ACM certs, Route53 (condicional) |
| `storage` | S3 frontend + **library** (`{env}-chapterquest-library`, prefijo `library/`) |
| `database` | DynamoDB **Users**, **Sessions** (single-table + GSI1 + TTL) |
| `api` | HTTP API + WebSocket API + Lambdas + roles IAM |
| `frontend` | CloudFront OAC + bucket policy |

---

## Biblioteca curada (S3)

**Decisión de producto:** no hay upload desde la UI. El curador sube PDFs al bucket `{env}-chapterquest-library` bajo el prefijo `library/`.

```mermaid
sequenceDiagram
  participant CUR as Curador
  participant S3 as S3 library
  participant L as Lambda library
  participant FE as Frontend

  CUR->>S3: PutObject PDF + x-amz-meta-*
  FE->>L: GET /library
  L->>S3: ListObjectsV2 + HeadObject
  L-->>FE: Catálogo JSON
  FE->>L: GET /library/{key}/preview-url
  L-->>FE: Presigned GET
  FE->>S3: Descarga PDF para preview
```

**Metadata recomendada:** `title`, `author`, `language`, `grade` (ver ProductSpec).

**Preview:** presigned URL + visor cliente (PDF.js / react-pdf — por decidir).

---

## Sesiones y role play

```mermaid
stateDiagram-v2
  [*] --> draft: Host crea sesión
  draft --> running: Empecemos + timer
  running --> review: Tiempo = 0 + host confirma
  review --> closed: Host cierra sesión
  closed --> [*]
```

Persistencia propuesta en DynamoDB (`Sessions`): participantes, roles, libro, timer, estado, reviews.

Sincronía en tiempo real (timer, mural): **API Gateway WebSocket** + tabla de conexiones.

---

## Flujo de review

```mermaid
sequenceDiagram
  participant H as Host
  participant API as API
  participant P as Participante
  participant D as DynamoDB

  H->>API: Abre fase review
  API-->>H: QR + código + enlace
  P->>API: Entra con código
  P->>API: Claim PARTICIPANT#slot
  API->>D: Conditional write nombre
  alt slot libre
    API-->>P: 200 OK → formulario review
    P->>API: POST review
  else ya tomado
    API-->>P: 409 Conflict
  end
  H->>API: GET mural + export
```

---

## DynamoDB — diseño actual y evolución

### Users (implementado)

| Atributo | Valor |
|----------|-------|
| PK | `USER#<username>` |
| SK | `PROFILE` |

Invitado: unicidad por username, cookie en frontend.

### Sessions (desplegado en IaC — lógica pendiente)

Tabla `{env}-chapterquest-sessions` con TTL en atributo `ttl` y **GSI1** para lookup por código de acceso.

| Atributo | Valor |
|----------|-------|
| PK | `SESSION#<sessionId>` |
| SK | `METADATA` \| `PARTICIPANT#<n>` \| `REVIEW#<n>` \| `CONNECTION#<id>` |
| GSI1PK | `CODE#<accessCode>` |
| GSI1SK | `SESSION#<sessionId>` |

Reviews y conexiones WebSocket viven en la misma tabla (single-table design).

---

## Flujo implementado: invitado

```mermaid
sequenceDiagram
  participant U as Usuario
  participant FE as Frontend
  participant API as API Gateway
  participant L as Lambda users
  participant D as DynamoDB

  U->>FE: Elige nombre en /profile
  FE->>API: POST /users/guest
  API->>L: Validar unicidad
  L->>D: GetItem / PutItem
  L-->>FE: 201 o 409
  FE->>FE: Cookie + banner @nombre
```

---

## Backend — capas Lambda

```text
handler  →  service  →  repository  →  DynamoDB / S3
```

Servicios previstos por dominio:

| Servicio | Rutas / triggers | Estado IaC |
|----------|------------------|------------|
| `auth` | `GET /health` | ✅ |
| `users` | `POST /users/guest` | ✅ |
| `library` | `GET /library`, `GET /library/{key}/preview-url` | ✅ stub |
| `sessions` | CRUD sesión, reviews, export, by-code | ✅ stub |
| `ws` | `$connect`, `$disconnect`, `$default` | ✅ stub |

---

## Frontend — mapa de rutas (objetivo)

| Ruta | Sección | Estado |
|------|---------|--------|
| `/` | Landing | Placeholder |
| `/library` | Biblioteca | Placeholder |
| `/guide` | Guía | Por crear |
| `/play` | Juguemos | Por crear |
| `/play/:sessionId/review` | Mural host | Por crear |
| `/review/:code` | Entrada participante | Por crear |
| `/profile` | Perfil invitado | Implementado |

Rutas legacy `/reviews`, `/community` se deprecarán o redirigirán en favor del flujo de sesión.

---

## Seguridad

- IAM: rol de ejecución **por Lambda**
- S3: Block Public Access; lectura PDF vía presigned URLs
- DynamoDB: encryption at rest, PITR
- CI/CD: GitHub OIDC (sin access keys de larga vida)
- Host token para cerrar sesión (MVP); auth docente completa — decisión abierta

---

## Entornos y build frontend

| Variable | Dev | Prod |
|----------|-----|------|
| `VITE_APP_ENV` | `dev` | `prod` |
| `VITE_API_BASE_URL` | ApiEndpoint stack dev | ApiEndpoint stack prod |

CI inyecta ambas en `deploy-frontend`. Chip MUI visible solo en `dev` y `local`.

---

## Referencias

- [ProductSpec.md](./ProductSpec.md) — SDD completo
- [Deployment.md](./Deployment.md)
- [functions/README.md](../functions/README.md)
