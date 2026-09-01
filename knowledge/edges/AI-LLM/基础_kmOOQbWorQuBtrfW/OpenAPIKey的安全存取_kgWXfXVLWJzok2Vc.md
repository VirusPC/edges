# Open API Key 的安全存取

- [1. **使用环境变量（Environment Variables）**](#1-%E4%BD%BF%E7%94%A8%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8Fenvironment-variables)
  * [实现步骤：](#%E5%AE%9E%E7%8E%B0%E6%AD%A5%E9%AA%A4)
- [2. **使用配置文件，但不提交敏感信息**](#2-%E4%BD%BF%E7%94%A8%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6%E4%BD%86%E4%B8%8D%E6%8F%90%E4%BA%A4%E6%95%8F%E6%84%9F%E4%BF%A1%E6%81%AF)
  * [实现步骤：](#%E5%AE%9E%E7%8E%B0%E6%AD%A5%E9%AA%A4-1)
- [3. **使用云端密钥管理服务**](#3-%E4%BD%BF%E7%94%A8%E4%BA%91%E7%AB%AF%E5%AF%86%E9%92%A5%E7%AE%A1%E7%90%86%E6%9C%8D%E5%8A%A1)
  * [优点：](#%E4%BC%98%E7%82%B9)
  * [示例：](#%E7%A4%BA%E4%BE%8B)
- [4. **使用环境变量管理工具**](#4-%E4%BD%BF%E7%94%A8%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F%E7%AE%A1%E7%90%86%E5%B7%A5%E5%85%B7)
- [5. **避免密钥泄漏的其他建议**](#5-%E9%81%BF%E5%85%8D%E5%AF%86%E9%92%A5%E6%B3%84%E6%BC%8F%E7%9A%84%E5%85%B6%E4%BB%96%E5%BB%BA%E8%AE%AE)
- [总结](#%E6%80%BB%E7%BB%93)

---

在开发 Node.js 项目时，直接将敏感信息（如 API 密钥）硬编码到代码中是非常不安全的。以下是几种常见的解决方案，可以有效地避免 API 密钥泄露：

***

### 1. **使用环境变量（Environment Variables）**

这是最常见的做法，将敏感信息存储在环境变量中，代码通过读取环境变量来获取密钥。

#### 实现步骤：

1. **创建 **`.env`** 文件**：\
   在项目根目录创建一个 `.env` 文件，用来存储你的 API 密钥。例如：

```plain
OPENAI_API_KEY=your_api_key_here
```

2. **安装 **`dotenv`** 模块**：\
   使用 `dotenv` 模块加载 `.env` 文件中的变量到 `process.env`。

```bash
npm install dotenv
```

3. **在代码中加载环境变量**：

```javascript
require('dotenv').config();

const apiKey = process.env.OPENAI_API_KEY;
console.log(`Your API key is: ${apiKey}`);
```

4. **将 **`.env`** 文件加入 **`.gitignore`** 文件**：\
   确保 `.env` 文件不会被提交到版本控制系统中。在 `.gitignore` 中添加以下内容：

```plain
.env
```

***

### 2. **使用配置文件，但不提交敏感信息**

如果需要更复杂的配置，可以使用配置文件（如 JSON 或 JS 文件），但不要直接包含敏感信息。

#### 实现步骤：

1. **创建配置模板文件**：\
   创建一个 `config.example.json` 文件，作为配置文件的模板。例如：

```json
{
  "openaiApiKey": "your_api_key_here"
}
```

2. **创建实际的配置文件**：\
   在本地创建一个 `config.json` 文件，填入实际的 API 密钥：

```json
{
  "openaiApiKey": "your_real_api_key"
}
```

3. \*\*将实际配置文件加入 \*\*`.gitignore`：\
   确保 `config.json` 不会被提交到版本控制系统中。
4. **在代码中加载配置文件**：

```javascript
const config = require('./config.json');
const apiKey = config.openaiApiKey;
console.log(`Your API key is: ${apiKey}`);
```

***

### 3. **使用云端密钥管理服务**

如果你部署的项目需要更高的安全性，可以使用云服务提供的密钥管理工具，例如：

* **AWS Secrets Manager**
* **Google Cloud Secret Manager**
* **Azure Key Vault**

#### 优点：

* 密钥存储在云端，只有有权限的服务才能访问。
* 支持自动密钥轮换。

#### 示例：

以 AWS Secrets Manager 为例：

1. 在 AWS Secrets Manager 中存储你的 API 密钥。
2. 使用 AWS SDK 在代码中访问密钥：

```javascript
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

async function getSecret() {
    const data = await secretsManager.getSecretValue({ SecretId: 'YourSecretName' }).promise();
    return JSON.parse(data.SecretString).openaiApiKey;
}

getSecret().then(apiKey => {
    console.log(`Your API key is: ${apiKey}`);
});
```

***

### 4. **使用环境变量管理工具**

如果你需要在团队中协作，可以使用一些专门的环境变量管理工具，例如：

* **Doppler**：集中化管理环境变量。
* **Vault by HashiCorp**：企业级密钥管理工具。

这些工具可以帮助你更方便地管理、共享和保护密钥。

***

### 5. **避免密钥泄漏的其他建议**

* **检查 **`.gitignore`** 是否正确配置**：确保敏感文件（如 `.env` 或 `config.json`）不会被提交到版本控制系统。
* **使用 Git 钩子检查密钥**：可以使用工具（如 [git-secrets](https://github.com/awslabs/git-secrets)）来防止敏感信息被提交。
* **定期轮换密钥**：即使密钥意外泄漏，也可以通过定期轮换密钥来降低风险。

***

### 总结

推荐使用 **环境变量** 的方式来存储和加载 API 密钥，这是最简单且安全的方式。对于更复杂的生产环境，可以结合云端密钥管理服务来增强安全性。


> 更新: 2025-05-25 15:18:25  
> 原文: <https://www.yuque.com/viruspc/el3mi0/wafn3eqzbvyiu6ay>