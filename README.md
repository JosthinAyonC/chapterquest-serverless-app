# LitCircle

> **LitCircle** es el producto. **ChapterQuest** es el nombre técnico del repositorio y la plataforma serverless que lo impulsa.

Plataforma web para **círculos literarios escolares** — sin login. Persiste la **actividad de role play** (6 estudiantes + roles), no una sesión de usuario.

**Tagline:** *Read, Share, Learn Together*

---

## ¿Qué hace LitCircle?

| Sección | Propósito |
|---------|-----------|
| **Landing** | Bienvenida, qué es un círculo literario, animación (futuro Three.js) |
| **Biblioteca** | Catálogo de PDFs curados desde S3 (sin upload público) |
| **Guía** | Explicación del role play y los 6 roles → CTA «Empecemos» |
| **Juguemos** | 6 nombres, ruleta, roster **nombre + rol**, cronómetro, review |

Flujo completo, roles, reglas de negocio y roadmap: **[docs/ProductSpec.md](docs/ProductSpec.md)** (SDD) · checklist: **[docs/Features.md](docs/Features.md)**

---

## Estado actual vs planificado

| Capacidad | Estado |
|-----------|--------|
| Infra AWS (dev + prod), CI/CD OIDC | ✅ |
| Registro invitado (`/profile`, cookie) | ✅ Opcional — **no** es login ni identidad en Juguemos |
| Roster estudiante + rol visible | 🔲 |
| Chip entorno (dev / local vs prod) | ✅ |
| Landing con copy cliente | 🔲 |
| Biblioteca S3 + preview PDF | 🔲 |
| Guía + 6 roles | 🔲 |
| Juguemos (ruleta, timer, actividad) | 🔲 |
| Role review (host QR + player wizard) | ✅ |
| WebSockets / mural en tiempo real | ❌ Removido — fuera del flujo principal |

---

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React, TypeScript, Vite, React Router, MUI (chips) |
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
├── docs/              # ProductSpec, Architecture, Deployment, Startup
└── .github/workflows/ # ci-cd.yml (único pipeline)
```

Ver [`functions/README.md`](functions/README.md) para agregar nuevas Lambdas.

---

## Desarrollo local

- **Node.js 24** (`nvm use`)
- **pnpm 10+**
- **AWS CLI** con perfil con acceso al entorno `dev` (DynamoDB remoto)

```bash
pnpm install
pnpm client           # http://localhost:5173
pnpm api              # http://localhost:3001
```

Variables: `frontend/.env` (`VITE_API_BASE_URL`, `VITE_APP_ENV=local`) y `functions/.env` (`AWS_PROFILE`, `AWS_REGION`).

---

## Entornos

| Rama | Entorno | Frontend (prod actual) |
|------|---------|------------------------|
| `develop` | dev | CloudFront + chip «Test environment» |
| `master` | prod | CloudFront sin chip |

| Recurso | Dev | Prod |
|---------|-----|------|
| Frontend | `d3isl53amscx76.cloudfront.net` | `d35dxri6348d76.cloudfront.net` |

Dominio custom (`litcircle.com`): ver [Deployment.md](docs/Deployment.md).

---

## Documentación

| Documento | Contenido |
|-----------|-----------|
| **[ProductSpec.md](docs/ProductSpec.md)** | Especificación de producto (SDD) — fuente de verdad funcional |
| **[Features.md](docs/Features.md)** | Backlog por feature con checklist y enlace al SDD |
| [Architecture.md](docs/Architecture.md) | Diagramas técnicos AWS, datos, flujos |
| [Deployment.md](docs/Deployment.md) | Bootstrap, deploy, troubleshooting |
| [Startup.md](docs/Startup.md) | Arranque desde cero |

---

## Principios

- Serverless first · Infrastructure as Code · Deploy vía GitHub Actions (OIDC)
- Least privilege IAM · Biblioteca curada (no CRUD de libros en app)
- Actividad presencial apoyada por digital; reviews pueden ser asíncronas

**LitCircle** — *Every chapter is the beginning of a new adventure.*
