# 2026-09-27--Windows-uv-安装Kev-踩到CPU版torch

> 在 Windows 上按 Kev 官方 `uv sync --extra serve` 装完后，服务能跑但一直在 CPU；根因是 PyPI 的 Windows torch 默认只有 CPU wheel，而文档假设环境里已经有 CUDA 版 torch。

## 背景

想在本机 Windows + NVIDIA 显卡上跑官方 Kev-4B（`jaredpalmer/kev`），端口 8009，走 TypeSafe System One API（`POST /v1/systemone`）。官方 README 写「有 GPU 就 CUDA / ROCm，Apple Silicon 用 MLX」，安装步骤只有 `uv sync --extra serve` 再 serve，没有单独的 Windows CUDA 安装说明。目标是确认真正用上 GPU，而不是默默落在 CPU。

## 过程

### 日间 克隆与首次 serve（CPU）

用 `uv` 克隆仓库并 `uv sync --extra serve`，依赖解析成功。首次启动会拉取 Hugging Face 权重（Qwen3.5-4B-Base 与 kev-4b adapter）。API 可用，样本请求能返回；`GET /v1/models` 显示 `"device":"cpu"`，单次延迟大约两秒量级。当时误以为「能通就算装好了」。

### 日间 对照官方文档与平台差异

核对官方路径后发现：文档并未给出 Windows 上如何安装 CUDA 版 torch；公开材料更贴近 Mac（MLX）与云端 Linux GPU（例如 Modal）。同时确认本机驱动与显卡正常，问题不在硬件识别，而在 Python 环境里的 torch 构建变体。

### 日间 第一次强行换 CUDA 源（版本越界）

从 `https://download.pytorch.org/whl/cu128` 强制装 CUDA torch，结果装到了 `2.11.0+cu128`。项目约束是 `torch>=2.6,<2.9`，随后再跑带 `--extra serve` 的 `uv` 命令时，解析器又回到 PyPI 的 `2.8.0+cpu`，白白下载了数 GB。

### 日间 用 uv index/sources 钉到 2.8.0+cu128

在本地 `pyproject.toml` 增加 pytorch cu128 索引，并用 `[tool.uv.sources]` 把 `torch` 指到该索引。`uv lock` 正确解析为 `2.8.0+cu128`（约 3GB 级下载）。下载进行中用户要求先停装、先复盘，进程被停掉；Hugging Face 模型缓存保留，半成品 venv / 本地 pyproject 补丁可能仍在。

### 日间 复盘与对外检索

确认不必重装整套环境：权重缓存可复用，只需把 torch 来源与版本范围对齐。网上几乎没有「Kev 专用 Windows CUDA」issue，但 `uv` 官方 PyTorch 集成文档写明：PyPI 在 Windows/macOS 默认提供 CPU-only torch；同族问题在 Stack Overflow 等处很常见。Kev 仓库另有 Windows 换行/编码类 issue，说明有人在 Win 上跑，但 CUDA torch 这条尚未写进 README。

## 所学

无（行动类对话；可复用步骤见行动指南）。

## 行动指南

### 主题行动指南

#### 背景

在 Windows 上用 `uv` 安装依赖了 PyTorch 且声称「有 GPU 就 CUDA」的 Python 服务时，默认 `uv sync` 很容易装成 CPU 版 torch，服务能通但完全跑在 CPU 上。

#### 核心问题

PyPI 上的 torch 在 Windows（以及 macOS）默认是 CPU-only wheel；项目若把 torch 版本钉在某一区间，又从 pytorch.org 拉到区间外的 CUDA 构建，下次 `uv sync` / `uv run` 仍可能被解析回 PyPI CPU 包。官方「一条命令装好」往往默认「环境里已经有对的 CUDA torch」。

#### 核心解决方案

1. 装完后立刻查：`import torch; print(torch.__version__, torch.cuda.is_available())`，以及服务自己的 models/health 接口里的 `device` 字段；不要只看 HTTP 200。
2. 在项目里用 `uv` 的 PyTorch 集成方式配置 CUDA 索引（`tool.uv.index` + `tool.uv.sources`，或文档推荐的 `--torch-backend`），让解析结果落在项目允许的版本区间内（例如需要 `<2.9` 时选 `2.8.x+cu12x`，不要默默升到区间外的最新 cu 包）。
3. 改完后重新 `uv lock` / `uv sync`，确认 lock 文件里的 torch 带 `+cu…` 而不是 `+cpu`，再启动服务复核 `device`。
4. 大模型权重缓存与 torch wheel 分开看待：换 torch 构建一般不必重下 HF 权重；停装时优先杀下载进程，保留缓存。

#### 验收标准

- 虚拟环境中 `torch.__version__` 带 CUDA 构建后缀，且落在项目声明的版本区间内
- `torch.cuda.is_available()` 为 True
- 服务对外的 models（或等价）接口报告 GPU/cuda，而不是 cpu
- 再次 `uv sync` 后不会自动退回 `+cpu`

### 细节与其他

#### 若装的是 Kev（jaredpalmer/kev）且要本机 GPU serve

则：

1. 克隆后按官方做 `uv sync --extra serve`，但把「device=cpu」当成失败信号，而不是成功。
2. 在本地 `pyproject.toml`（或不污染上游的等价 uv 配置）把 torch 指到 pytorch.org 的 cu128（或与驱动匹配的 cu 系列）索引，并保证解析到 `2.8.0+cu128` 这类满足 `>=2.6,<2.9` 的构建。
3. 同步完成后再启动官方 serve；用 `GET /v1/models` 确认 `"device":"cuda"`。
4. 本地改过的 `pyproject.toml` / lock 视为本机补丁，不要默认推回上游，除非单独提 PR 改善 Windows 文档。

#### 若已经误装成 2.11.0+cu128 或又被 sync 回 2.8.0+cpu

则：不要整库重装、不要删 HF 缓存；只修正索引与版本约束后重新 sync。区间外的 CUDA 包等于没钉住，下次解析仍会漂。

#### 若通过远程助手在 Windows 上跑 PowerShell

则：部分远程执行通道会吞掉命令里的 `$`，导致变量脚本坏掉。把逻辑写成 `.ps1` 文件再执行，比一行内联命令更稳。

#### 若只想确认是不是「只有我踩过」

则：优先查 Astral `uv` 的 PyTorch 集成文档与「Windows uv 仍装到 CPU torch」类问答；Kev 自己的 issue 里未必有同名工单，但 Windows 相关反馈（如换行/编码）说明平台有人在用。

## 补充说明

- 参考：[uv — Using uv with PyTorch](https://docs.astral.sh/uv/guides/integration/pytorch/) — 明确平台默认 CPU / 需自配 GPU 索引
- 参考：[Stack Overflow：uv 在 Windows 上仍装到 CPU torch](https://stackoverflow.com/questions/79829472/pytorch-installed-via-uv-project-shows-cpu-only-version-on-windows-with-cuda-spe) — 与本次症状同族
- 参考：[jaredpalmer/kev](https://github.com/jaredpalmer/kev) — 官方安装路径短；Windows CUDA 未单独说明
- 参考：Kev [#12](https://github.com/jaredpalmer/kev/issues/12)（Windows 换行/编码）、[#34](https://github.com/jaredpalmer/kev/issues/34)（torch 钉死与 wheel）— 侧面说明依赖与 Win 环境都脆
- 本次未把机器名、内网地址、账号写进可复用步骤；具体本机路径只留在操作现场，不进主题行动指南
