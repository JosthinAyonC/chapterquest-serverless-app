# LitCircle — Features (backlog)

Checklist de funcionalidades ordenadas por área de producto. Cada ítem enlaza al [SDD (ProductSpec.md)](./ProductSpec.md).

**Cómo usar:** marca `[x]` en **Listo** cuando la feature esté completa en dev (o prod, si aplica). Actualiza este archivo en el mismo PR que entrega la feature.

**Leyenda SDD:** `§4.2` = sección 4.2 del ProductSpec · `R3` = regla de negocio · `NFR-1` = requisito no funcional.

---

## 0. Fundación y plataforma

| ID | Feature | Descripción breve | SDD | Listo |
|----|---------|-------------------|-----|-------|
| F-00 | Monorepo y tooling | Node 24, pnpm, frontend + functions + IaC + scripts | [§11 I1](./ProductSpec.md#11-roadmap-sugerido-por-iteraciones) | [x] |
| F-01 | CI/CD unificado | GitHub Actions: validate → deploy-stack → deploy-frontend, OIDC | [§11 I1](./ProductSpec.md#11-roadmap-sugerido-por-iteraciones) · NFR-4 | [x] |
| F-02 | Deploy por paths | Skip deploy-stack o frontend si solo cambió un lado | [§11](./ProductSpec.md#11-roadmap-sugerido-por-iteraciones) | [x] |
| F-03 | Entornos dev / prod | Ramas `develop` / `master`, stacks aislados, chip «Test environment» | [§8 NFR-6](./ProductSpec.md#8-requisitos-no-funcionales) | [x] |
| F-04 | API health | `GET /health` operativo local y en AWS | [§10](./ProductSpec.md#10-estado-de-implementación) | [x] |
| F-05 | IaC alineado al producto | Tabla `sessions`, bucket `library`, HTTP + WebSocket API, Lambdas stub | [§9.2](./ProductSpec.md#92-planificado--persiste-la-actividad-no-el-usuario) · NFR-4 | [x] |

---

## 1. Shell de aplicación (UI global)

| ID | Feature | Descripción breve | SDD | Listo |
|----|---------|-------------------|-----|-------|
| F-10 | Layout y navegación base | Header, footer, rutas React Router | [§4](./ProductSpec.md#4-mapa-del-sitio) | [x] |
| F-11 | Nav por secciones de producto | Landing, Biblioteca, Guía, Juguemos (reemplazar legacy reviews/community) | [§4](./ProductSpec.md#4-mapa-del-sitio) · [§10](./ProductSpec.md#10-estado-de-implementación) | [ ] |
| F-12 | Chip entorno | «Test environment» / «Local dev» en dev; oculto en prod | [§8 NFR-6](./ProductSpec.md#8-requisitos-no-funcionales) | [x] |
| F-13 | Responsive escolar | Layout usable en tablet, proyector y móvil | [§8 NFR-5](./ProductSpec.md#8-requisitos-no-funcionales) | [ ] |
| F-14 | Perfil invitado (opcional) | Cookie en `/profile` — navegación general, **no** identidad en Juguemos | [§2.1](./ProductSpec.md#21-modelo-de-identidad--sin-login-ni-sesión-de-usuario) · [§9.1](./ProductSpec.md#91-implementado-hoy) | [x] |

---

## 2. Landing (Home)

| ID | Feature | Descripción breve | SDD | Listo |
|----|---------|-------------------|-----|-------|
| F-20 | Copy de bienvenida | *Read, Share, Learn Together* + texto acordado con cliente | [§4.1](./ProductSpec.md#41-landing-home) | [ ] |
| F-21 | Sección «What is the literary circle?» | Definición del círculo literario + copy EN | [§4.1](./ProductSpec.md#41-landing-home) | [ ] |
| F-22 | Imagen Malu y Danna | Placeholder estático hasta animación final | [§4.1](./ProductSpec.md#41-landing-home) | [ ] |
| F-23 | Hero Three.js (futuro) | Modelo 3D en landing | [§4.1](./ProductSpec.md#41-landing-home) · [§11 I10](./ProductSpec.md#11-roadmap-sugerido-por-iteraciones) | [ ] |

---

## 3. Biblioteca (Read)

| ID | Feature | Descripción breve | SDD | Listo |
|----|---------|-------------------|-----|-------|
| F-30 | Convención S3 curador | PDFs en `{env}-chapterquest-library/library/` con metadata | [§4.2](./ProductSpec.md#42-biblioteca) · [§9.2](./ProductSpec.md#92-planificado--persiste-la-actividad-no-el-usuario) | [ ] |
| F-31 | API listado biblioteca | `GET /library` — ListObjects + HeadObject → JSON catálogo | [§4.2](./ProductSpec.md#42-biblioteca) | [ ] |
| F-32 | API preview PDF | `GET /library/{key}/preview-url` — presigned GET | [§4.2](./ProductSpec.md#42-biblioteca) · D1 | [ ] |
| F-33 | UI catálogo | Grid/lista: título, autor, idioma, nivel | [§4.2](./ProductSpec.md#42-biblioteca) | [ ] |
| F-34 | Visor PDF en frontend | Preview integrado (PDF.js o similar) | [§4.2](./ProductSpec.md#42-biblioteca) · D1 | [ ] |
| F-35 | Script / doc subida curador | Guía CLI para admin (aws s3 cp + metadata) | [§3 Curador](./ProductSpec.md#3-personas) · [§4.2](./ProductSpec.md#42-biblioteca) | [ ] |

---

## 4. Guía (Share — explicación)

| ID | Feature | Descripción breve | SDD | Listo |
|----|---------|-------------------|-----|-------|
| F-40 | Página Guía | Ruta `/guide` con explicación del role play | [§4.3](./ProductSpec.md#43-guía) | [ ] |
| F-41 | Contenido 6 roles | Tarjetas Facilitator, Connector, etc. con copy pedagógico | [§5](./ProductSpec.md#5-los-seis-roles) | [ ] |
| F-42 | Flujo resumido | Diagrama o pasos: nombres → ruleta → libro → timer → review | [§4.3](./ProductSpec.md#43-guía) · [§6](./ProductSpec.md#6-flujo-de-actividad-role-play) | [ ] |
| F-43 | CTA «¿Todo listo? Empecemos» | Botón → navega a Juguemos | [§4.3](./ProductSpec.md#43-guía) | [ ] |

---

## 5. Juguemos — Crear actividad (Share)

| ID | Feature | Descripción breve | SDD | Listo |
|----|---------|-------------------|-----|-------|
| F-50 | Ruta Juguemos | Shell `/play` para flujo del host | [§4.4](./ProductSpec.md#44-juguemos) | [ ] |
| F-51 | Ingreso 6 nombres | 6 campos de texto; validación básica | [§6](./ProductSpec.md#6-flujo-de-actividad-role-play) · R1 | [ ] |
| F-52 | Ruleta de roles | Asignación aleatoria 1 rol por nombre | [§5](./ProductSpec.md#5-los-seis-roles) · R2 | [ ] |
| F-53 | Roster confirmación | Pantalla 6× **Nombre · Rol** antes de continuar | [§2.2](./ProductSpec.md#22-visibilidad-nombre--rol-requisito-ux) · R2 · NFR-7 | [ ] |
| F-54 | Selección de libro | Elegir PDF desde biblioteca curada | [§6](./ProductSpec.md#6-flujo-de-actividad-role-play) · R3 | [ ] |
| F-55 | API crear actividad | `POST /sessions` — persiste metadata + 6 participantes + roles | [§9.2](./ProductSpec.md#92-planificado--persiste-la-actividad-no-el-usuario) · R1–R3 | [ ] |
| F-56 | Host token | Token docente para controlar/cerrar actividad (sin login estudiantil) | [§9.2](./ProductSpec.md#92-planificado--persiste-la-actividad-no-el-usuario) · D7 | [ ] |

---

## 6. Juguemos — Timer y actividad en curso (Share)

| ID | Feature | Descripción breve | SDD | Listo |
|----|---------|-------------------|-----|-------|
| F-60 | Configurar tiempo | Input minutos, default 40, copy explicativo | [§6](./ProductSpec.md#6-flujo-de-actividad-role-play) · R4 | [ ] |
| F-61 | Botón «Empecemos» | Inicia cronómetro cuenta atrás | [§6](./ProductSpec.md#6-flujo-de-actividad-role-play) | [ ] |
| F-62 | Cronómetro UI | Cuenta regresiva visible; roster sigue en pantalla | [§2.2](./ProductSpec.md#22-visibilidad-nombre--rol-requisito-ux) · R5 · NFR-7 | [ ] |
| F-63 | Alerta fin de tiempo | Modal suave + sonido opcional al llegar a 0 | [§6](./ProductSpec.md#6-flujo-de-actividad-role-play) · R5 · NFR-3 · D6 | [ ] |
| F-64 | Transición a review | Botón manual «Pasemos a las reviews» | [§6](./ProductSpec.md#6-flujo-de-actividad-role-play) · R6 | [ ] |
| F-65 | Panel roster persistente | Componente reutilizable nombre + rol durante toda la actividad | [§2.2](./ProductSpec.md#22-visibilidad-nombre--rol-requisito-ux) · NFR-7 | [ ] |
| F-66 | API timer / estado | `PATCH /sessions/{id}` — running, timerEndsAt, status | [§9.2](./ProductSpec.md#92-planificado--persiste-la-actividad-no-el-usuario) | [ ] |
| F-67 | Nav «Actividad en curso» | Entrada condicional si hay actividad abierta (`activityId`) | [§4.5](./ProductSpec.md#45-actividad-en-curso-opcional-condicional) · NFR-2 · D4 | [ ] |

---

## 7. Review y mural (Learn Together)

| ID | Feature | Descripción breve | SDD | Listo |
|----|---------|-------------------|-----|-------|
| F-70 | Pantalla host review | Estilo Kahoot: código grande + QR + copiar enlace | [§7](./ProductSpec.md#7-flujo-de-review-mural) | [ ] |
| F-71 | Entrada por QR / enlace | Ruta `/review/:code` — resolver actividad | [§4.6](./ProductSpec.md#46-entrada-a-review-participantes) · [§7](./ProductSpec.md#7-flujo-de-review-mural) | [ ] |
| F-72 | Botón «Tengo que hacer un review» | Entrada global discreta + input código | [§4.6](./ProductSpec.md#46-entrada-a-review-participantes) | [ ] |
| F-73 | Claim participante | Elegir 1 de 6 nombres; bloqueo para otros | [§6.2](./ProductSpec.md#62-identificación-de-participantes-sin-login) · R7 | [ ] |
| F-74 | Mostrar rol al participante | Tras elegir nombre, ver su rol antes de escribir | [§7](./ProductSpec.md#7-flujo-de-review-mural) · [§2.2](./ProductSpec.md#22-visibilidad-nombre--rol-requisito-ux) | [ ] |
| F-75 | Formulario review | Texto/tarjeta; guardar con etiqueta **nombre · rol** | [§7](./ProductSpec.md#7-flujo-de-review-mural) · R8 | [ ] |
| F-76 | Mural Padlet-like | Host ve reviews en tiempo real | [§7](./ProductSpec.md#7-flujo-de-review-mural) | [ ] |
| F-77 | API review | `POST .../reviews/claim`, `POST .../reviews`, `GET .../by-code` | [§9.2](./ProductSpec.md#92-planificado--persiste-la-actividad-no-el-usuario) | [ ] |
| F-78 | Cerrar actividad | Host cierra; libera para nueva actividad | [§6](./ProductSpec.md#6-flujo-de-actividad-role-play) · R9 | [ ] |
| F-79 | Export reporte | PDF o captura con nombre, rol y review por participante | [§6](./ProductSpec.md#6-flujo-de-actividad-role-play) · R10 · [§7](./ProductSpec.md#7-flujo-de-review-mural) | [ ] |

---

## 8. Tiempo real (WebSocket)

| ID | Feature | Descripción breve | SDD | Listo |
|----|---------|-------------------|-----|-------|
| F-80 | WebSocket infra | API Gateway WS + Lambdas connect/disconnect/message desplegadas | [§8.1](./ProductSpec.md#81-websockets--dirección-técnica-borrador) · NFR-1 | [x] |
| F-81 | Sync roster y ruleta | Broadcast asignación de roles a clientes conectados | [§8.1](./ProductSpec.md#81-websockets--dirección-técnica-borrador) · NFR-1 | [ ] |
| F-82 | Sync timer | Tick cuenta atrás vía WS (`timer.tick`) | [§8.1](./ProductSpec.md#81-websockets--dirección-técnica-borrador) · NFR-1 | [ ] |
| F-83 | Sync mural | Nueva review visible al host al instante (`review.posted`) | [§7](./ProductSpec.md#7-flujo-de-review-mural) · NFR-1 | [ ] |
| F-84 | Cliente WS frontend | Conexión, reconexión, suscripción por `activityId` | [§8.1](./ProductSpec.md#81-websockets--dirección-técnica-borrador) | [ ] |

---

## 9. Resumen de progreso

| Área | Total | Listas |
|------|-------|--------|
| 0. Fundación | 6 | 6 |
| 1. Shell UI | 5 | 3 |
| 2. Landing | 4 | 0 |
| 3. Biblioteca | 6 | 0 |
| 4. Guía | 4 | 0 |
| 5. Juguemos — crear | 7 | 0 |
| 6. Juguemos — timer | 8 | 0 |
| 7. Review | 10 | 0 |
| 8. WebSocket | 5 | 1 |
| **Total** | **55** | **10** |

---

## Referencias

- [ProductSpec.md](./ProductSpec.md) — SDD (fuente de verdad funcional)
- [Architecture.md](./Architecture.md) — diseño técnico
- [Deployment.md](./Deployment.md) — deploy y migraciones
