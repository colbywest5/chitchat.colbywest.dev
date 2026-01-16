# Roadmap: ChitChat (OvermindOps)

## Overview

Building an AI agent orchestration platform from scaffold to working system. Development runs in parallel tracks:
- **Backend track (v1.0):** Database schema and API foundation
- **Frontend track (v1.1):** Apple-inspired UI with command center layout

## Domain Expertise

None (standard web application patterns)

## Milestones

- 🚧 **v1.0 Database & API Foundation** - Phases 1-5 (in progress)
- 🚧 **v1.1 Frontend MVP** - Phases 6-12 (in progress, parallel track)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Schema Validation** - Audit and validate database schema design
- [ ] **Phase 2: Migration Implementation** - Complete Alembic migration with full SQL
- [ ] **Phase 3: API Route Completion** - Implement remaining API endpoints
- [ ] **Phase 4: API Validation & Testing** - Validate all endpoints work correctly
- [ ] **Phase 5: Docker Database Setup** - Configure PostgreSQL in Docker Compose
- [ ] **Phase 6: Design System Foundation** - Tailwind config, color tokens, typography, base components
- [ ] **Phase 7: Shell & Navigation** - App layout, sidebar, top bar, routing structure
- [ ] **Phase 8: Authentication Flow** - Login page, auth state, protected routes
- [ ] **Phase 9: Projects Home** - Project cards grid, empty states, project creation
- [ ] **Phase 10: Project Dashboard** - Kanban board, live runs panel, chat panel, command center layout
- [ ] **Phase 11: Analytics & Data Viz** - Charts, metrics cards, performance dashboard
- [ ] **Phase 12: Polish & Integration** - Responsive refinements, WebSocket integration, accessibility audit

## Phase Details

### 🚧 v1.0 Database & API Foundation (In Progress)

**Milestone Goal:** Establish a working database layer with complete API endpoints that can be tested and integrated with frontend/QA work happening in parallel.

#### Phase 1: Schema Validation

**Goal**: Audit the database schema from first.md against SQLAlchemy models and identify any gaps, inconsistencies, or improvements needed
**Depends on**: Nothing (first phase)
**Research**: Unlikely (established PostgreSQL patterns)
**Plans**: TBD

Plans:
- [ ] 01-01: TBD (run /gsd:plan-phase 1 to break down)

#### Phase 2: Migration Implementation

**Goal**: Create the complete Alembic migration file with all tables, indexes, constraints, and proper PostgreSQL 16 features
**Depends on**: Phase 1
**Research**: Unlikely (SQLAlchemy/Alembic standard patterns)
**Plans**: TBD

Plans:
- [ ] 02-01: TBD

#### Phase 3: API Route Completion

**Goal**: Implement all remaining API router endpoints (agents, runs, conversations, recordings, orchestrator) following the established patterns
**Depends on**: Phase 2
**Research**: Unlikely (FastAPI standard patterns exist in codebase)
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

#### Phase 4: API Validation & Testing

**Goal**: Validate all API endpoints function correctly with proper error handling, status codes, and response schemas
**Depends on**: Phase 3
**Research**: Unlikely (validation against first.md spec)
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

#### Phase 5: Docker Database Setup

**Goal**: Ensure PostgreSQL container is properly configured in docker-compose.yml with correct volumes, health checks, and initialization
**Depends on**: Phase 2
**Research**: Unlikely (Docker Compose patterns)
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

---

### 🚧 v1.1 Frontend MVP (In Progress)

**Milestone Goal:** Deliver a complete, polished frontend for ChitChat with Apple-inspired design, real-time WebSocket integration, and responsive layouts for all device sizes.

**Design Philosophy:**
- **Color Scheme:** Space Gray (dark mode primary with subtle blue accents)
- **Animations:** Minimal (essential transitions only, performance-focused)
- **Layout:** Command Center (dense information panels, maximum data visibility)
- **Data Visualization:** Stocks/Finance style (clean line charts, sparklines, numerical emphasis)

#### Phase 6: Design System Foundation

**Goal**: Establish the visual language - Tailwind configuration with Space Gray palette, typography scale, spacing system, and foundational UI components (buttons, inputs, cards, badges)
**Depends on**: Nothing (parallel track, first frontend phase)
**Research**: Unlikely (established Tailwind patterns)
**Plans**: TBD

Plans:
- [ ] 06-01: TBD (run /gsd:plan-phase 6 to break down)

#### Phase 7: Shell & Navigation

**Goal**: Build the app shell - responsive sidebar navigation, top bar with breadcrumbs and actions, main content area layout, and route structure matching the page hierarchy
**Depends on**: Phase 6
**Research**: Unlikely (internal patterns from Phase 6)
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

#### Phase 8: Authentication Flow

**Goal**: Complete login experience - sign-in form with validation, auth state management, session persistence, protected route wrapper, and logout flow
**Depends on**: Phase 7
**Research**: Unlikely (standard Next.js auth patterns)
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

#### Phase 9: Projects Home

**Goal**: Projects listing page - project cards with status indicators, empty state for no projects, project creation modal, and loading/error states
**Depends on**: Phase 8
**Research**: Unlikely (using established component patterns)
**Plans**: TBD

Plans:
- [ ] 09-01: TBD

#### Phase 10: Project Dashboard

**Goal**: The command center - three-panel layout with Kanban task board, live agent runs console with streaming logs, and chat panel with voice controls. The heart of the application
**Depends on**: Phase 9
**Research**: Likely (WebSocket patterns for streaming logs, drag-and-drop for Kanban)
**Research topics**: WebSocket event handling patterns, drag-and-drop alternatives, virtualized log rendering
**Plans**: TBD

Plans:
- [ ] 10-01: TBD

#### Phase 11: Analytics & Data Viz

**Goal**: Analytics dashboard - line charts for task throughput, sparklines for agent metrics, summary cards, and time range selectors. Settings and recordings pages
**Depends on**: Phase 10
**Research**: Likely (charting library selection)
**Research topics**: Lightweight React charting options (recharts, visx, lightweight-charts), number formatting
**Plans**: TBD

Plans:
- [ ] 11-01: TBD

#### Phase 12: Polish & Integration

**Goal**: Final refinements - responsive breakpoint testing, WebSocket connection reliability, loading skeletons, error boundaries, accessibility audit (WCAG 2.1 AA), and performance optimization
**Depends on**: Phase 11
**Research**: Unlikely (applying established patterns)
**Plans**: TBD

Plans:
- [ ] 12-01: TBD

## Progress

**Execution Order:**
- Backend track (v1.0): 1 → 2 → 3 → 4 → 5
- Frontend track (v1.1): 6 → 7 → 8 → 9 → 10 → 11 → 12

Tracks run in parallel.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Schema Validation | v1.0 | 0/? | Not started | - |
| 2. Migration Implementation | v1.0 | 0/? | Not started | - |
| 3. API Route Completion | v1.0 | 0/? | Not started | - |
| 4. API Validation & Testing | v1.0 | 0/? | Not started | - |
| 5. Docker Database Setup | v1.0 | 0/? | Not started | - |
| 6. Design System Foundation | v1.1 | 0/? | Not started | - |
| 7. Shell & Navigation | v1.1 | 0/? | Not started | - |
| 8. Authentication Flow | v1.1 | 0/? | Not started | - |
| 9. Projects Home | v1.1 | 0/? | Not started | - |
| 10. Project Dashboard | v1.1 | 0/? | Not started | - |
| 11. Analytics & Data Viz | v1.1 | 0/? | Not started | - |
| 12. Polish & Integration | v1.1 | 0/? | Not started | - |
