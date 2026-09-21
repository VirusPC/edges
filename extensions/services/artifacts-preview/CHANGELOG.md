# Changelog

All notable changes to this service will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Short-lived static host: `POST /artifacts` (Bearer) → public `GET /artifacts/:id/…` → TTL delete. Default TTL 24h. Same process locally and on ECS. CLI client is `edges artifacts` in `extensions/clis`.
- Optional `from` on publish: when present, v1 only allows `{ type: "task", id, project }` (`id` is the edges task stem). Omit `from` when there is no task linkage. Other types, `name`/`stem`, and a top-level `task` field are rejected. Echo `from` on 201 only when set.
- ECS host CLI: `edges artifacts server install` (ensure env + deps + user unit, does not start; `--force` may rotate the token), `start` / `stop` / `restart`, `status`, `setup-nginx`. No `server init`. First time: `install` → `start` → `setup-nginx` → `status`. After a pull: `install` then `restart` (or `restart` only). `deploy/bootstrap.sh` is a thin wrapper of those two CLI verbs. `deploy-teach.yml` runs `install` then `restart` after the full-repo pull only when the server env file exists.
- `setup-nginx` injects only into `/etc/nginx/conf.d/teaching.conf` server blocks that already contain `/teaching/` (`TEACHING_CONF`). If the live Aliyun box still has leftover `teach.conf` with `/teach/`, rename/replace to `teaching.conf` and run `deploy/migrate-teaching-nginx-prefix.py` first. Do not dual-support the old names.
