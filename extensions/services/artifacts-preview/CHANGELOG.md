# Changelog

All notable changes to this service will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Short-lived static host: `POST /artifacts` (Bearer) → public `GET /artifacts/:id/…` → TTL delete. Default TTL 24h. Same process locally and on ECS. CLI client is `edges artifacts` in `extensions/clis`.
- Optional `from` on publish: when present, v1 only allows `{ type: "task", id, project }` (`id` is the edges task stem). Omit `from` when there is no task linkage. Other types, `name`/`stem`, and a top-level `task` field are rejected. Echo `from` on 201 only when set.
- ECS host CLI: `edges artifacts server init` (config only), `install` (deps + user unit, does not start), `start` / `stop` / `restart`, `status`. After a pull: `install` then `restart`. nginx stays out of the CLI — `deploy/nginx-artifacts.conf` plus one-shot `setup-nginx-artifacts.sh` (human sudo when exposing on :80). `deploy/bootstrap.sh` is a thin wrapper of those two CLI verbs. `deploy-teach.yml` runs `install` then `restart` after the full-repo pull only when the server env file exists.
