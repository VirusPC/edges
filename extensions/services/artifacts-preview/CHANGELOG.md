# Changelog

All notable changes to this service will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Short-lived static host: `POST /artifacts` (Bearer) → public `GET /artifacts/:id/…` → TTL delete. Default TTL 24h. Same process locally and on ECS. CLI client is `edges artifacts` in `extensions/clis`.
- Optional `from` on publish: when present, v1 only allows `{ type: "task", id, project }` (`id` is the edges task stem). Omit `from` when there is no task linkage. Other types, `name`/`stem`, and a top-level `task` field are rejected. Echo `from` on 201 only when set.
- ECS runbook in `deploy/`: systemd user unit, `artifacts.env.example`, nginx snippet (`/health` + `/artifacts/` on :80, `/teaching/` untouched), `setup-nginx-artifacts.sh` (human sudo once), `bootstrap.sh` (install/build/restart). `deploy-teach.yml` runs bootstrap after the full-repo pull when the server env file exists.
