# LitCircle (ChapterQuest)

> **LitCircle** es el producto. **ChapterQuest** es el nombre técnico del repositorio y la plataforma serverless que lo impulsa.

Plataforma de lectura social serverless en AWS. Esta iteración establece la **fundación**: monorepo, IaC, CI/CD, shell de frontend y backend. Las features de negocio llegan en iteraciones siguientes.

---

## MVP (próxima prioridad)

1. **Invitado sin fricción** — El usuario elige un nombre; se guarda en cookie del navegador con aviso en UI. Se persiste en DynamoDB (`Users`) para validar unicidad ("este nombre ya está en uso").
2. **Upload de PDF** — Subida vía **presigned URLs** generadas por Lambda (no bucket policy con Referer). CORS restringido al origen del frontend.
3. **Lectura de PDF** — Visor integrado en el frontend (evaluar librerías en iteración MVP).
4. **Health check** — `GET /health` operativo (único endpoint implementado hoy).

### Roadmap posterior

Reseñas, comentarios, roleplay, progreso de lectura, biblioteca personal, notificaciones.

---

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React, TypeScript, Vite, React Router |
| Backend | AWS Lambda, API Gateway HTTP API, TypeScript |
| Datos | DynamoDB, S3 |
| Infra | CloudFormation (nested stacks) |
| CI/CD | GitHub Actions + OIDC |
| Tooling | Node 24, pnpm 10 |

---

## Estructura del monorepo

```text
chapterquest-serverless-app/
├── frontend/          # App React (LitCircle UI)
├── functions/         # Lambdas + servidor local Express
├── infrastructure/    # CloudFormation + parámetros por entorno
├── scripts/           # Build, deploy
├── docs/              # Architecture.md, Deployment.md
└── .github/workflows/ # frontend.yml, backend.yml, infra.yml
```

Ver [`functions/README.md`](functions/README.md) para agregar nuevas Lambdas.

---

## Requisitos locales

- **Node.js 24** (`nvm use` lee `.nvmrc`)
- **pnpm 10+** (`corepack enable && corepack prepare pnpm@10.12.1 --activate`)
- **AWS CLI** configurado (para dev local contra recursos `dev` en la nube)

```bash
pnpm install
pnpm dev:frontend    # http://localhost:5173
pnpm dev:api         # http://localhost:3001
```

---

## Entornos

| Rama | Entorno AWS | URLs (sin dominio custom) |
|------|-------------|---------------------------|
| `develop` | dev | CloudFront `*.cloudfront.net`, API Gateway default |
| `master` | prod | Idem |

Cuando compres **litcircle.com**, activa `EnableCustomDomain=true` en `infrastructure/environments/*/params.env` y configura `HostedZoneId`. CloudFormation creará certificados ACM y registros Route53 automáticamente:

- `dev.litcircle.com` / `api-dev.litcircle.com`
- `litcircle.com` / `api.litcircle.com`

---

## Convención de nombres

- Stacks: `chapterquest-root-{env}`, `chapterquest-api-{env}`, etc.
- Lambdas: `{env}-function-{name}`
- Tablas DynamoDB: `{env}-chapterquest-{table}`

---

## Documentación

- **[Startup](docs/Startup.md)** — arranque desde cero, bootstrap OIDC, checklist
- [Architecture](docs/Architecture.md) — diagramas y diseño de datos
- [Deployment](docs/Deployment.md) — bootstrap AWS, dominio custom, troubleshooting

---

## Principios de diseño

- Serverless first
- Infrastructure as Code
- Deploy solo vía GitHub Actions (OIDC, sin access keys de larga vida)
- Least privilege IAM (rol de ejecución por Lambda)
- Sin lógica de negocio en esta iteración — solo fundación sólida

**LitCircle** — *Every chapter is the beginning of a new adventure.*
