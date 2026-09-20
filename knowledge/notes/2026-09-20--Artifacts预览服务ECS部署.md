# Artifacts 预览服务：挂到现有 teach ECS

Teach 站点部署经验的 sibling（对照 [`2026-09-08--Teach站点部署与大陆备案经验.md`](./2026-09-08--Teach站点部署与大陆备案经验.md)）。产品决策仍看 [ADR 0013](../../docs/adr/0013-artifacts-preview-service.md)；这里只记运维落点。

## 结论

Artifacts 预览和 teach **同机、同一次整仓 pull**。Node 进程走 `cheng-dev` 的 systemd **user** unit（8787 只绑 127.0.0.1）；公网仍走已有 :80。人机接口是 `edges artifacts server`：`init` 只写配置，`install` 装依赖/unit 但不启动，`start`/`stop`/`restart` 只管进程，`status` 看 health+unit。nginx 必须同时接住 `POST /artifacts`（无尾斜杠，CLI publish）和 `GET /artifacts/<uuid>/`，但这是宿主机运维，不是 CLI 动词——静态文件在 `deploy/nginx-artifacts.conf`，人跑一次带 sudo 的 `setup-nginx-artifacts.sh`（和当年 `~/setup-teach-nginx80.sh` 同一限制：助手注不进 sudo 密码）。`/teaching/` 不动。给手机的 BASE_URL 写公网 IP 的 http，不写 Mesh 主机名，也不在备案完成前把域名当可用入口。

## 已核实的约束（不要再发明）

- 同步：GitHub Actions SSH → `~/projects/edges` 上 `git fetch` / `reset --hard origin/main`。不要改回 path-subset rsync。`git fetch` 若偶发失败，Action 仍是主路径；后备是「能同时到 GitHub 和这台机器」的环境打一份整仓 tar，再在盒上跑 `edges artifacts server install` 然后 `restart`（`deploy/bootstrap.sh` 是这两条的薄包装）。
- nginx：系统 nginx 已在 :80 提供 `/teaching/`。新增 location 只覆盖精确 `/health` 和前缀 `/artifacts/`。不要为 8787 再开安全组（安全组仍由人在控制台改）。
- 进程：user unit + `loginctl enable-linger`，否则 Actions SSH 断开后服务会随会话死掉。
- 密钥：`EDGES_ARTIFACTS_TOKEN` 只活在盒上 `~/.config/edges/artifacts-preview.env` 和本机 `~/.config/edges/artifacts.env`。仓里只有 `artifacts.env.example`。
- URL 纪律：对外用 `http://182.92.131.89/...`；禁止再把内部 Mesh 名当成公网网址（teach 笔记里已被当面纠正过）。

## 人要做的一次性动作

1. 盒上装好 Node ≥ 20 与 pnpm（user PATH）。
2. 盒上 `edges artifacts server init --base-url http://182.92.131.89`（只写 env）。本机 `edges artifacts init --base-url http://182.92.131.89`，同一 token。
3. `edges artifacts server install` 然后 `edges artifacts server start`（不要合成一个 install-and-start）。
4. 要暴露在 :80 时，另跑一次 `sudo bash …/deploy/setup-nginx-artifacts.sh`（不是 CLI 动词）。
5. `edges artifacts server status`；盒上 `curl http://127.0.0.1:8787/health`；外网 `curl http://182.92.131.89/health`；再确认 `/teaching/` 仍在。

之后每次 main 部署：现有 `deploy-teach.yml` 在 pull 之后，若 env 文件在就 `install` 再 `restart`。

## 交叉

- 服务与 CLI：`extensions/services/artifacts-preview/`、`edges artifacts`
- 工作流：`.github/workflows/deploy-teach.yml`（concurrency `ecs-edges-pull`，environment `production`）
- Teach 公网前缀：`/teaching/`（本层不改教学内容）
