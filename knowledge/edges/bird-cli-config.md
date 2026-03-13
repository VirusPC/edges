# bird CLI 配置经验

> 日期: 2025-02-08
> 来源: 实际测试 bird skill (X/Twitter CLI)

## 核心发现

### 1. 配置文件不支持 auth_token/ct0

**文档说支持，实际测试不支持**。bird CLI 只能从以下方式读取凭证：

- ✅ 环境变量 `AUTH_TOKEN` / `CT0` （推荐）
- ✅ 命令行参数 `--auth-token` / `--ct0`
- ✅ 浏览器 cookies 自动检测（Safari/Chrome/Firefox）
- ❌ `~/.config/bird/config.json5` 中的 `auth_token` / `ct0` （不生效）

### 2. 凭证获取方式

从浏览器 DevTools 获取：
1. 打开 https://x.com 并登录
2. DevTools → Application → Cookies → https://x.com
3. 复制 `auth_token` 和 `ct0` 值

### 3. macOS 的 Chrome Cookie 加密问题

Chrome cookies 被 macOS Keychain 加密，bird 无法读取：
```
Failed to read macOS Keychain (Chrome Safe Storage): exit 36
```

**解决方案**：直接使用环境变量，不依赖浏览器自动读取。

### 4. 配置文件实际用途

`~/.config/bird/config.json5` 仅支持以下配置：
```json5
{
  timeoutMs: 20000,
  quoteDepth: 1,
  // 浏览器自动检测（如果 cookies 未加密）
  cookieSource: ["safari"], // 或 "chrome", "firefox"
}
```

## 推荐配置方案

### 方案 A: 环境变量（推荐长期使用）

添加到 `~/.zshrc` 或 `~/.bash_profile`：
```bash
export AUTH_TOKEN="你的长token"
export CT0="你的短ct0"
```

### 方案 B: 命令行参数（临时使用）
```bash
bird --auth-token "xxx" --ct0 "yyy" whoami
```

### 方案 C: 浏览器自动检测（仅限 Safari/未加密 Chrome）
```json5
// ~/.config/bird/config.json5
{
  cookieSource: ["safari"],
  timeoutMs: 20000,
}
```

## 故障排查

| 错误 | 原因 | 解决 |
|------|------|------|
| `auth_token: not found` | 凭证未提供 | 使用环境变量或参数 |
| `Failed to read macOS Keychain` | Chrome cookies 加密 | 改用环境变量 |
| `socket connection was closed` | 网络/API 限制 | 稍后重试或检查代理 |
| `The socket connection was closed unexpectedly` | Twitter API 超时 | 增加 timeoutMs 或检查网络 |

## 标签

#twitter #x #cli #bird #api #authentication #macos
