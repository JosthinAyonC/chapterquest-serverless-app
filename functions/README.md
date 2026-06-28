# Functions — Guía para agregar una nueva Lambda

Este directorio contiene las funciones Lambda de **ChapterQuest** (producto: **LitCircle**), organizadas por dominio.

Especificación funcional del producto: [`docs/ProductSpec.md`](../docs/ProductSpec.md).

## Estructura por servicio

```text
functions/
├── common/           # Utilidades compartidas (http, logger, dynamo, models)
├── auth/             # Health check y futura autenticación
├── users/            # Perfiles de invitado
├── books/            # Biblioteca S3 (list + presigned preview) — planificado
├── sessions/         # Sesiones role play — planificado
├── reviews/          # Mural + claim participante — planificado
├── ws/               # WebSocket handlers — planificado
├── comments/         # Reservado
├── roleplay/         # Lógica compartida role play (opcional)
└── local/            # Servidor Express para desarrollo local
```

Cada servicio sigue la misma capa:

```text
<service>/
├── handlers/     # Entry points Lambda (thin)
├── services/     # Lógica de negocio
├── repositories/ # Acceso a DynamoDB / S3
└── models/       # Tipos del dominio (opcional si usa common/models)
```

## Checklist: agregar una nueva Lambda

### 1. Crear el handler

```text
functions/<service>/handlers/<name>.ts
```

Exporta una función `handler` compatible con API Gateway HTTP API v2.

### 2. Implementar service y repository

- **Service**: reglas de negocio, sin dependencias de AWS SDK directas.
- **Repository**: lectura/escritura en DynamoDB o S3.

### 3. Registrar en el build

El script [`functions/scripts/build.mjs`](scripts/build.mjs) detecta automáticamente archivos `*.ts` en cada carpeta `handlers/` (excepto tests). Genera `.js` + `.zip` por handler.

### 4. Exponer ruta en el servidor local

Edita [`local/server.ts`](local/server.ts) y monta la ruta Express que invoque tu handler.

### 5. Agregar recurso en CloudFormation

Edita [`infrastructure/cloudformation/api/template.yaml`](../infrastructure/cloudformation/api/template.yaml):

1. Crear **Execution Role** dedicado (`<env>-role-function-<name>`).
2. Crear **Lambda Function** (`<env>-function-<name>`).
3. Crear **Integration** + **Route** en HTTP API.
4. Agregar **Lambda Permission**.

Principio: **un rol por función** (least privilege).

### 6. Desplegar

El pipeline [`ci-cd.yml`](../.github/workflows/ci-cd.yml) compila con esbuild, despliega el stack y luego el frontend. Solo GitHub Actions despliega a AWS.

## Desarrollo local

Requisitos: Node 24, pnpm, AWS CLI configurado con acceso al entorno `dev`.

```bash
# Desde la raíz del monorepo
pnpm install
pnpm api              # Express en http://localhost:3001
curl http://localhost:3001/health
```

Variables de entorno útiles:

| Variable | Default | Descripción |
|----------|---------|-------------|
| `ENV` | `dev` | Prefijo de tablas y recursos |
| `AWS_PROFILE` | *(ninguno)* | Perfil CLI — define en `functions/.env` (ej. `litcircle`) |
| `AWS_REGION` | `us-east-1` | Región AWS |
| `LOCAL_API_PORT` | `3001` | Puerto del servidor local |

Copia [`functions/.env.example`](.env.example) a `functions/.env` antes de registrar invitados. `/health` no necesita AWS; `/users/guest` escribe en DynamoDB remoto (`dev-chapterquest-users`).

## Convención de nombres

| Recurso | Patrón | Ejemplo |
|---------|--------|---------|
| Lambda | `{env}-function-{name}` | `dev-function-health` |
| IAM Role | `{env}-role-function-{name}` | `dev-role-function-health` |
| DynamoDB | `{env}-chapterquest-{table}` | `dev-chapterquest-users` |
| S3 | `{env}-chapterquest-{purpose}` | `dev-chapterquest-uploads` |

## Runtime

- **Local / CI**: Node 24 (`.nvmrc`, `engines` en package.json).
- **Lambda en AWS**: `nodejs22.x` (runtime más reciente disponible en Lambda; se actualizará cuando AWS publique Node 24).

## Endpoints

### Implementados

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/users/guest` | Registro invitado (unicidad username) |

### Planificados (ver ProductSpec)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/library` | Lista PDFs desde S3 + metadata |
| `GET` | `/library/{key}/url` | Presigned GET para preview |
| `POST` | `/sessions` | Crear sesión role play |
| `PATCH` | `/sessions/{id}` | Timer, estado, cerrar |
| `POST` | `/sessions/{id}/reviews/claim` | Participante elige nombre |
| `POST` | `/sessions/{id}/reviews` | Publicar review |
| `GET` | `/sessions/{id}/export` | Reporte PDF/imagen |
| WebSocket | `$connect`, `$default`, `$disconnect` | Sync timer y mural |
