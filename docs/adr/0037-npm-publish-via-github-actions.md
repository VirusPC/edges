---
status: accepted
---

# `@viruspc/edges` 经 GitHub Actions 发到 npm

**Status:** accepted（2026-10-18；2026-10-25 补 prerelease 的 dist-tag）

## Decision

1. **只认 tag `@viruspc/edges@*`。** 推送这个 tag 才跑 `.github/workflows/publish-edges-cli.yml`。不自动打 tag，不用 changesets，不建 GitHub Release，不改 `deploy.yml`。tag 必须是 annotated（`git tag -a`），轻量 tag 失败。checkout 会把 annotated tag 剥成 commit，断言前先 `git fetch --force` 该 tag 对象。
2. **两个 job。** `test` 不挂 Environment。`publish` `needs: test`，`environment: npm-publish`，等人审过再发。
3. **OIDC Trusted Publishing。** `id-token: write` 只给 `publish`。`actions/setup-node` 带 `registry-url: https://registry.npmjs.org`。不传 `--provenance`，沿用 npm 在 GitHub Actions 上的默认 provenance。Node 22.20 自带 npm 10.9.3，Trusted Publishing 需要 npm >= 11.5.1，而 pnpm publish 会调用 npm 上传，所以 publish job 在 pnpm install 之前执行 `npm install -g npm@^11.5.1`。
4. **三道守卫。** tag 上的版本必须等于 `packages/cli/package.json` 的 `version`；该提交必须是 `origin/main` 的祖先；npm 上已有同一版本则失败。
5. **发布命令。** Node `22.20`。稳定版（`version` 不含 `-`）执行 `pnpm --filter @viruspc/edges publish --no-git-checks --access public`，不传 `--tag`。`pnpm --filter` 走递归发布，未传 `--tag` 时写入 dist-tag `latest`。`version` 含 `-`（semver prerelease，例如 `0.2.6-beta.0`）时同一命令加上 `--tag beta`，只更新 npm 的 `beta` tag，不把该版本标成 `latest`。`prepack` 仍先做 pnpm 校验再构建。
6. **版本只来自 package.json。** 删掉 `src/utils/version.ts`。CLI 运行时读 `packages/cli/package.json` 的 `version`。发版只升这一处，并写入 `CHANGELOG.md`。
