# Architecture — LitCircle (ChapterQuest)

## Visión general

LitCircle es una plataforma serverless en AWS. El frontend se sirve desde CloudFront + S3; la API expone HTTP API Gateway que invoca Lambdas; los datos viven en DynamoDB y S3.

```mermaid
flowchart TD
  user[Usuario] --> cf[CloudFront]
  cf --> s3web[S3 frontend hosting]
  user --> apigw[API Gateway HTTP API]
  apigw --> lhealth[Lambda health]
  apigw --> lusers[Lambda users - futuro]
  lusers --> ddbUsers[(DynamoDB Users)]
  lbooks[Lambda books - futuro] --> ddbBooks[(DynamoDB Books)]
  lbooks --> s3uploads[S3 uploads presigned]
  apigw --> lreviews[Lambda reviews - futuro]
  lreviews --> ddbReviews[(DynamoDB Reviews)]
  subgraph cicd [GitHub Actions OIDC]
    gha[Workflows] -->|AssumeRole| cfn[CloudFormation deploy]
  end
```

## Capas del monorepo

| Directorio | Responsabilidad |
|------------|-----------------|
| `frontend/` | SPA React — UI LitCircle |
| `functions/` | Handlers Lambda + servidor local Express |
| `infrastructure/` | CloudFormation modular por capa |
| `scripts/` | Build esbuild, deploy stacks |
| `.github/workflows/` | CI/CD única fuente de deploy |

## Infraestructura (nested stacks)

El stack raíz `chapterquest-root-{env}` orquesta:

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
| `storage` | S3 frontend + uploads |
| `database` | DynamoDB Users, Books, Reviews, Comments |
| `api` | HTTP API + Lambdas + roles IAM |
| `frontend` | CloudFront OAC + bucket policy |

Parámetro `EnableCustomDomain` (default `false`): cuando compres `litcircle.com`, activa dominios custom sin reescribir templates.

## DynamoDB — diseño de claves

Diseño single-table style por entidad, expandible con GSIs.

### Users

| Atributo | Valor |
|----------|-------|
| PK | `USER#<username>` |
| SK | `PROFILE` |

Unicidad de invitado: `GetItem` por PK antes de crear. Atributos: `type=guest`, `createdAt`, `lastSeenAt`.

### Books

| Atributo | Valor |
|----------|-------|
| PK | `BOOK#<bookId>` |
| SK | `METADATA` |
| GSI1PK | `USER#<ownerId>` |
| GSI1SK | `BOOK#<bookId>` |

### Reviews

| Atributo | Valor |
|----------|-------|
| PK | `BOOK#<bookId>` |
| SK | `REVIEW#<reviewId>` |
| GSI1PK | `USER#<authorId>` |
| GSI1SK | `REVIEW#<reviewId>` |

### Comments

| Atributo | Valor |
|----------|-------|
| PK | `BOOK#<bookId>` |
| SK | `COMMENT#<timestamp>#<commentId>` |

Alternativa futura: PK `REVIEW#<reviewId>` para hilos por reseña.

## Flujo MVP: invitado

```mermaid
sequenceDiagram
  participant U as Usuario
  participant FE as Frontend
  participant C as Cookie
  participant API as API Gateway
  participant L as Lambda users
  participant D as DynamoDB

  U->>FE: Elige nombre invitado
  FE->>C: Guarda litcircle_guest_name
  FE->>U: Muestra banner "navegas como @nombre"
  Note over FE,API: Próxima iteración
  FE->>API: POST /users/guest
  API->>L: Validar unicidad
  L->>D: GetItem USER#username
  alt nombre libre
    L->>D: PutItem perfil guest
    L-->>FE: 201 Created
  else nombre ocupado
    L-->>FE: 409 Conflict
  end
```

## Flujo MVP: upload PDF (presigned URLs)

```mermaid
sequenceDiagram
  participant U as Usuario
  participant FE as Frontend
  participant API as API Gateway
  participant L as Lambda books
  participant S3 as S3 uploads

  U->>FE: Selecciona PDF
  FE->>API: POST /books/upload-url
  API->>L: Genera presigned PUT
  L-->>FE: URL firmada + bookId
  FE->>S3: PUT PDF directo
  Note over S3: Bucket privado, CORS solo origen CloudFront
  FE->>API: POST /books/{id}/confirm
```

**No** usar bucket policy con `Referer` — es falsificable. Presigned URLs + CORS + IAM least privilege.

## Backend — capas Lambda

```text
handler  →  service  →  repository  →  DynamoDB / S3
```

- **Handler**: adapta evento API Gateway, sin lógica de negocio.
- **Service**: reglas de dominio.
- **Repository**: acceso a datos.

## Seguridad

- IAM: rol de ejecución **por Lambda**.
- S3: Block Public Access; frontend solo vía CloudFront OAC.
- DynamoDB: encryption at rest, PITR habilitado.
- CI/CD: GitHub OIDC → IAM Role (sin access keys en secrets).
- HTTPS: CloudFront y API Gateway por defecto.

## Entornos

Recursos aislados por prefijo `{env}-`. Ramas `dev` y `main` despliegan a entornos independientes vía GitHub Actions.
