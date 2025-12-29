# Project Links

> **Single source of truth for all phase-related URLs and deployments.**
>
> This file is referenced from `CLAUDE.md`. Keep all project links here to maintain a clean separation between mutable URLs and immutable project principles.

## Phase Links

| Phase | Folder | GitHub URL | Deployment Link | Published App URL |
|------:|--------|------------|-----------------|-------------------|
| I     | `phase1/` | `<repo_url_phase_1>` | N/A | N/A |
| II    | `phase2/` | `<repo_url_phase_2>` | `<deployment_url_phase_2>` | N/A |
| III   | `phase3/` | `<repo_url_phase_3>` | `<deployment_url_phase_3>` | N/A |
| IV    | `phase4/` | `<repo_url_phase_4>` | N/A | N/A |
| V     | `phase5/` | `<repo_url_phase_5>` | N/A | `<published_app_url_phase_5>` |

### Legend

- **Folder**: Local folder created by `/sp.implement` for each phase
- **GitHub URL**: Link to the repository or branch for each phase
- **Deployment Link**: Staging/preview deployment URL (Phase II & III have active deployments)
- **Published App URL**: Production/public app URL (Phase V is the final published app)
- **N/A**: Not applicable for this phase

---

## Phase Folder Mapping

When `/sp.implement` runs for a phase, it creates the corresponding folder:

| Phase | Folder | Contents |
|-------|--------|----------|
| I | `phase1/` | Python console app (in-memory storage) |
| II | `phase2/` | `frontend/` + `backend/` + `docker-compose.yml` |
| III | `phase3/` | Phase II + `agents/` + `mcp/` |
| IV | `phase4/` | Phase III + `k8s/` + Dockerfiles |
| V | `phase5/` | Phase IV + `dapr-components/` + CI/CD |

---

## Notes

- Update this table as phases are completed and URLs become available
- Replace placeholder values (e.g., `<repo_url_phase_1>`) with actual URLs
- Each phase folder is self-contained and follows the structure defined in `constitution.md`
- All URLs in this file are mutable; project principles remain in `constitution.md`
