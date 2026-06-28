# Architecture — LitCircle (ChapterQuest)

Visión técnica de la plataforma. La definición funcional del producto está en **[ProductSpec.md](./ProductSpec.md)**.

---

## Visión general

LitCircle es una plataforma serverless en AWS orientada a **actividades de círculo literario en escuelas**. **No hay login:** persiste la **actividad de role play** (6 nombres + roles), no una sesión de usuario.

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
  lsessions --> ddbSessions[(DynamoDB Activities)]
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
| `database` | DynamoDB **Users** (perfil invitado opcional), **Sessions** (= actividades role play) |
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

> **Terminología:** en producto = **actividad**; en API/IaC = `Session` / `/sessions` / tabla `*-chapterquest-sessions`. No implica login.

### Roster nombre + rol (UX)

Durante toda la actividad la UI debe mostrar los 6 participantes con su rol asignado (panel fijo en host/proyector). Ver ProductSpec §2.2.

```mermaid
stateDiagram-v2
  [*] --> draft: Host crea actividad
  draft --> running: Empecemos + timer
  running --> review: Tiempo = 0 + host confirma
  review --> closed: Host cierra actividad
  closed --> [*]
```

Persistencia en DynamoDB (`Sessions`): participantes con `displayName` + `role`, libro, timer, reviews.

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

### Users (perfil invitado — opcional, no es login)

Cookie + `POST /users/guest` para navegar el sitio. **No** identifica estudiantes en Juguemos.

| Atributo | Valor |
|----------|-------|
| PK | `USER#<username>` |
| SK | `PROFILE` |

### Activities (tabla `sessions` — implementado en IaC)

Actividad de role play: lo que **sí** persiste entre pasos del juego.

| Atributo | Valor |
|----------|-------|
| PK | `SESSION#<activityId>` |
| SK | `METADATA` \| `PARTICIPANT#<n>` \| `REVIEW#<n>` \| `CONNECTION#<id>` |
| PARTICIPANT.role | Ej. `Facilitator` — mostrar siempre en UI con `displayName` |
| GSI1PK | `CODE#<accessCode>` |
| GSI1SK | `SESSION#<activityId>` |

Reviews y conexiones WebSocket en la misma tabla (single-table design).

---

## Flujo implementado: perfil invitado (opcional)

> Independiente del flujo Juguemos. No sustituye a los 6 nombres de la actividad.

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
| `sessions` | CRUD **actividad**, reviews, export, by-code | ✅ stub |
| `ws` | `$connect`, `$disconnect`, `$default` | ✅ stub |

---

## Frontend — mapa de rutas (objetivo)

| Ruta | Sección | Estado |
|------|---------|--------|
| `/` | Landing | Placeholder |
| `/library` | Biblioteca | Placeholder |
| `/guide` | Guía | Por crear |
| `/play` | Juguemos (roster nombre+rol visible) | Por crear |
| `/play/:activityId/review` | Mural host | Por crear |
| `/review/:code` | Entrada participante | Por crear |
| `/profile` | Perfil invitado (opcional, no login) | Implementado |

Rutas legacy `/reviews`, `/community` se deprecarán o redirigirán en favor del flujo de sesión.

---

## Seguridad

- IAM: rol de ejecución **por Lambda**
- S3: Block Public Access; lectura PDF vía presigned URLs
- DynamoDB: encryption at rest, PITR
- CI/CD: GitHub OIDC (sin access keys de larga vida)
- Host token para cerrar actividad (MVP); **sin login estudiantil**

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
