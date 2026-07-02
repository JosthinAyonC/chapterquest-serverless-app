# Deployment — LitCircle (ChapterQuest)

Guía de despliegue AWS, bootstrap OIDC, entornos dev/prod y troubleshooting.

**Contexto de producto:** [ProductSpec.md](./ProductSpec.md) · **Arquitectura:** [Architecture.md](./Architecture.md)

---

> **¿Primera vez?** Lee [Startup.md](Startup.md) para el checklist completo (bootstrap OIDC, GitHub variables, primer push).

## Prerrequisitos

- Cuenta AWS con permisos de administrador (solo para bootstrap inicial).
- Node.js 24 + pnpm 10 (ver `.nvmrc` y `packageManager` en `package.json`).
- AWS CLI v2 configurado.
- Repositorio en GitHub: `JosthinAyonC/chapterquest-serverless-app`.

## Flujo de ramas → entornos

| Rama GitHub | Entorno AWS | Stack raíz |
|-------------|-------------|------------|
| `develop` | dev | `chapterquest-root-dev` |
| `master` | prod | `chapterquest-root-prod` |

**Única fuente de deploy:** GitHub Actions (workflow [`ci-cd.yml`](../.github/workflows/ci-cd.yml)).

---

## Paso 1: Bootstrap (una sola vez)

Despliega el stack de bootstrap manualmente desde tu máquina:

```bash
aws cloudformation deploy \
  --template-file infrastructure/cloudformation/bootstrap/template.yaml \
  --stack-name chapterquest-bootstrap \
  --parameter-overrides \
    GitHubOrg=JosthinAyonC \
    GitHubRepo=chapterquest-serverless-app \
    ArtifactsBucketName=chapterquest-artifacts-TU_ACCOUNT_ID \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

Anota los outputs:

- `ArtifactsBucketName`
- `GitHubDeployRoleArn`

> **Región recomendada:** `us-east-1` para que los certificados ACM de CloudFront funcionen cuando actives dominio custom.

---

## Paso 2: Configurar GitHub

En el repositorio de GitHub, configura **Variables** (Settings → Secrets and variables → Actions → Variables):

| Variable | Ejemplo | Descripción |
|----------|---------|-------------|
| `AWS_DEPLOY_ROLE_ARN` | `arn:aws:iam::123456789012:role/chapterquest-github-deploy-...` | Output del bootstrap |
| `AWS_REGION` | `us-east-1` | Región de deploy |
| `ARTIFACTS_BUCKET` | `chapterquest-artifacts-123456789012` | Bucket de artefactos |
| `VITE_API_BASE_URL` | *(opcional)* | Ya no es obligatoria: CI y `deploy-frontend.sh` leen `ApiEndpoint` del stack automáticamente. Úsala solo para override manual. |

Crea **Environments** `dev` y `prod` si quieres protecciones de deploy en prod.

---

## Paso 3: Crear ramas

```bash
git checkout -b develop
git push -u origin develop
```

---

## Paso 4: Primer deploy de infraestructura

Opción A — push a `develop` (dispara `ci-cd.yml` en secuencia).

Opción B — manual desde tu máquina:

```bash
export ARTIFACTS_BUCKET=chapterquest-artifacts-TU_ACCOUNT_ID
chmod +x scripts/deploy-stack.sh scripts/deploy-frontend.sh
./scripts/deploy-stack.sh dev
```

Tras el deploy, obtén outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name chapterquest-root-dev \
  --query 'Stacks[0].Outputs' \
  --output table
```

Actualiza `VITE_API_BASE_URL` en GitHub Variables con el `ApiEndpoint`.

Actualiza `FrontendOrigin` en `infrastructure/environments/*/params.env` con la URL de CloudFront del **frontend** y redeploy.

**Library CDN:** el stack crea una segunda distribución CloudFront para el bucket `*-library`. La API devuelve URLs de ese CDN (no presigned S3 directo). CloudFront inyecta los headers CORS.

En **dev**, incluye `LocalDevOrigin=http://localhost:5173` en `params.env` para que pdf.js funcione en local. Tras deploy, copia `LibraryCdnDomainName` a `functions/.env` como `LIBRARY_CDN_DOMAIN` y reinicia `pnpm api`.

**Outputs nuevos del stack:** `WebSocketEndpoint`, `LibraryBucketName`, `LibraryPrefix`, `LibraryCdnUrl`, `LibraryCdnDomainName`.

---

## Migración de stack (jun 2026)

El stack se alineó con [ProductSpec.md](./ProductSpec.md). Al redeploy:

| Eliminado | Reemplazo |
|-----------|-----------|
| DynamoDB `books`, `reviews`, `comments` | Tabla **`sessions`** (single-table) |
| S3 `{env}-chapterquest-uploads` | S3 **`{env}-chapterquest-library`** |
| Lambdas solo health + guest | + library, sessions, ws (stubs 501) |
| Solo HTTP API | HTTP API + **WebSocket API** |

**Antes de prod:** si tenías PDFs en `*-uploads`, cópialos a `*-library/library/` con metadata antes del deploy. CloudFormation **eliminará** recursos que ya no están en el template.

Subir un PDF curado (admin) con portada y metadata:

```bash
sh scripts/upload_book.sh \
  --env dev \
  --bookname "Charlotte's Web" \
  --bookdescription "A tender farm story about friendship." \
  --bookauthor "E.B. White" \
  --booklang EN \
  --bookaudience "+10 anos" \
  --path ./charlottes-web.pdf \
  --cover ./charlottes-web-cover.png
```

Requisitos: `AWS_PROFILE=litcircle` (o exportado), bucket `{env}-chapterquest-library`. El script resuelve el bucket desde el stack `chapterquest-root-{env}`.

Tras subir, verifica: `curl "$VITE_API_BASE_URL/library"` (local o API desplegada).

---

## Paso 5: Deploy del frontend

Automático al push en `develop`/`master` vía `ci-cd.yml` (job `deploy-frontend`).

Manual:

```bash
./scripts/deploy-frontend.sh dev
```

---

## Desarrollo local

```bash
pnpm install
pnpm client            # Vite → :5173
pnpm api               # Express → :3001
curl http://localhost:3001/health
```

El servidor local usa el **credential chain** del AWS SDK (mismo código que en Lambda, distinto principal IAM).

Variables útiles en `functions/`:

```bash
export ENV=dev
export AWS_REGION=us-east-1
export LOCAL_API_PORT=3001
export LIBRARY_CDN_DOMAIN=dxxxxxxxxxxxxx.cloudfront.net
```

---

## Activar dominio custom (litcircle.com)

Cuando compres el dominio y crees la hosted zone en Route53:

1. Edita `infrastructure/environments/{dev,prod}/params.env`:

   ```env
   EnableCustomDomain=true
   DomainName=litcircle.com
   HostedZoneId=Z1234567890ABC
   FrontendOrigin=https://dev.litcircle.com   # o prod URL
   ```

2. Redeploy vía GitHub Actions o `./scripts/deploy-stack.sh`.

CloudFormation creará:

| Entorno | Frontend | API |
|---------|----------|-----|
| dev | `dev.litcircle.com` | `api-dev.litcircle.com` |
| prod | `litcircle.com` | `api.litcircle.com` |

Certificados ACM se validan automáticamente vía DNS en Route53.

---

## Agregar una nueva Lambda

Ver [`functions/README.md`](../functions/README.md).

Resumen: handler → build esbuild → ruta local → recurso en `api/template.yaml` → push a `dev`.

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| OIDC assume role falla | Verifica `sub` en bootstrap coincide con org/repo/rama |
| Lambda 502 | Revisa logs en CloudWatch; confirma S3 key del artefacto |
| CORS en PDF reader | Redeploy stack (library CDN). Dev: `LocalDevOrigin=http://localhost:5173` + `LIBRARY_CDN_DOMAIN` en `functions/.env` |
| Cert ACM pendiente | Hosted zone debe estar en la misma cuenta; espera validación DNS |

---

## Runtime Lambda vs local

| Entorno | Node |
|---------|------|
| Local / CI | 24 (`.nvmrc`) |
| AWS Lambda | `nodejs22.x` (actualizar cuando AWS publique Node 24) |
