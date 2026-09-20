# Changelog

All notable changes to this service will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Short-lived static host: `POST /artifacts` (Bearer) → public `GET /artifacts/:id/…` → TTL delete. Default TTL 24h. Same process locally and on ECS. CLI client is `edges artifacts` in `extensions/clis`.
- New publishes require `from` in the POST body; persisted in `meta.json` and echoed on 201. `kind: task` needs `project` + `stem`; other kinds need `name`. Missing or invalid `from` is 400. No top-level `task` field.
