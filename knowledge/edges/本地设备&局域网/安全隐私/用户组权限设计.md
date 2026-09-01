# 用户组权限设计

- [一、总原则（先记住这三句）](#%E4%B8%80%E6%80%BB%E5%8E%9F%E5%88%99%E5%85%88%E8%AE%B0%E4%BD%8F%E8%BF%99%E4%B8%89%E5%8F%A5)
    + [✅ 原则 1：一个人 = 多身份，而不是一个万能号](#%E2%9C%85-%E5%8E%9F%E5%88%99-1%E4%B8%80%E4%B8%AA%E4%BA%BA--%E5%A4%9A%E8%BA%AB%E4%BB%BD%E8%80%8C%E4%B8%8D%E6%98%AF%E4%B8%80%E4%B8%AA%E4%B8%87%E8%83%BD%E5%8F%B7)
    + [✅ 原则 2：服务账号 = 一事一号](#%E2%9C%85-%E5%8E%9F%E5%88%99-2%E6%9C%8D%E5%8A%A1%E8%B4%A6%E5%8F%B7--%E4%B8%80%E4%BA%8B%E4%B8%80%E5%8F%B7)
    + [✅ 原则 3：写权限永远比读权限稀缺](#%E2%9C%85-%E5%8E%9F%E5%88%99-3%E5%86%99%E6%9D%83%E9%99%90%E6%B0%B8%E8%BF%9C%E6%AF%94%E8%AF%BB%E6%9D%83%E9%99%90%E7%A8%80%E7%BC%BA)
- [二、各组「子用户」设计模板（直接可抄）](#%E4%BA%8C%E5%90%84%E7%BB%84%E5%AD%90%E7%94%A8%E6%88%B7%E8%AE%BE%E8%AE%A1%E6%A8%A1%E6%9D%BF%E7%9B%B4%E6%8E%A5%E5%8F%AF%E6%8A%84)
  * [1️⃣ admin 组（控制中枢）](#1%EF%B8%8F%E2%83%A3-admin-%E7%BB%84%E6%8E%A7%E5%88%B6%E4%B8%AD%E6%9E%A2)
    + [建议子用户](#%E5%BB%BA%E8%AE%AE%E5%AD%90%E7%94%A8%E6%88%B7)
  * [2️⃣ dev 组（生产力核心）](#2%EF%B8%8F%E2%83%A3-dev-%E7%BB%84%E7%94%9F%E4%BA%A7%E5%8A%9B%E6%A0%B8%E5%BF%83)
    + [建议子用户](#%E5%BB%BA%E8%AE%AE%E5%AD%90%E7%94%A8%E6%88%B7-1)
  * [3️⃣ data 组（资产仓库）](#3%EF%B8%8F%E2%83%A3-data-%E7%BB%84%E8%B5%84%E4%BA%A7%E4%BB%93%E5%BA%93)
    + [建议子用户](#%E5%BB%BA%E8%AE%AE%E5%AD%90%E7%94%A8%E6%88%B7-2)
  * [4️⃣ family 组（生活层）](#4%EF%B8%8F%E2%83%A3-family-%E7%BB%84%E7%94%9F%E6%B4%BB%E5%B1%82)
    + [建议子用户](#%E5%BB%BA%E8%AE%AE%E5%AD%90%E7%94%A8%E6%88%B7-3)
  * [5️⃣ guest 组（缓冲区）](#5%EF%B8%8F%E2%83%A3-guest-%E7%BB%84%E7%BC%93%E5%86%B2%E5%8C%BA)
    + [建议子用户](#%E5%BB%BA%E8%AE%AE%E5%AD%90%E7%94%A8%E6%88%B7-4)
  * [6️⃣ project 组（⚠️ 建议再细分）](#6%EF%B8%8F%E2%83%A3-project-%E7%BB%84%E2%9A%A0%EF%B8%8F-%E5%BB%BA%E8%AE%AE%E5%86%8D%E7%BB%86%E5%88%86)
    + [子用户（按项目）](#%E5%AD%90%E7%94%A8%E6%88%B7%E6%8C%89%E9%A1%B9%E7%9B%AE)
  * [7️⃣ service 组（安全关键）](#7%EF%B8%8F%E2%83%A3-service-%E7%BB%84%E5%AE%89%E5%85%A8%E5%85%B3%E9%94%AE)
    + [建议子用户](#%E5%BB%BA%E8%AE%AE%E5%AD%90%E7%94%A8%E6%88%B7-5)
- [三、推荐「标准用户矩阵」（你可以对照）](#%E4%B8%89%E6%8E%A8%E8%8D%90%E6%A0%87%E5%87%86%E7%94%A8%E6%88%B7%E7%9F%A9%E9%98%B5%E4%BD%A0%E5%8F%AF%E4%BB%A5%E5%AF%B9%E7%85%A7)
- [四、最小可行方案（不折腾版）](#%E5%9B%9B%E6%9C%80%E5%B0%8F%E5%8F%AF%E8%A1%8C%E6%96%B9%E6%A1%88%E4%B8%8D%E6%8A%98%E8%85%BE%E7%89%88)
- [五、什么时候这套设计失败？（反指标）](#%E4%BA%94%E4%BB%80%E4%B9%88%E6%97%B6%E5%80%99%E8%BF%99%E5%A5%97%E8%AE%BE%E8%AE%A1%E5%A4%B1%E8%B4%A5%E5%8F%8D%E6%8C%87%E6%A0%87)
- [六、给你一句直话](#%E5%85%AD%E7%BB%99%E4%BD%A0%E4%B8%80%E5%8F%A5%E7%9B%B4%E8%AF%9D)
- [一、总原则（先记住这三句）](#%E4%B8%80%E6%80%BB%E5%8E%9F%E5%88%99%E5%85%88%E8%AE%B0%E4%BD%8F%E8%BF%99%E4%B8%89%E5%8F%A5-1)
    + [✅ 原则 1：一个人 = 多身份，而不是一个万能号](#%E2%9C%85-%E5%8E%9F%E5%88%99-1%E4%B8%80%E4%B8%AA%E4%BA%BA--%E5%A4%9A%E8%BA%AB%E4%BB%BD%E8%80%8C%E4%B8%8D%E6%98%AF%E4%B8%80%E4%B8%AA%E4%B8%87%E8%83%BD%E5%8F%B7-1)
    + [✅ 原则 2：服务账号 = 一事一号](#%E2%9C%85-%E5%8E%9F%E5%88%99-2%E6%9C%8D%E5%8A%A1%E8%B4%A6%E5%8F%B7--%E4%B8%80%E4%BA%8B%E4%B8%80%E5%8F%B7-1)
    + [✅ 原则 3：写权限永远比读权限稀缺](#%E2%9C%85-%E5%8E%9F%E5%88%99-3%E5%86%99%E6%9D%83%E9%99%90%E6%B0%B8%E8%BF%9C%E6%AF%94%E8%AF%BB%E6%9D%83%E9%99%90%E7%A8%80%E7%BC%BA-1)
- [二、各组「子用户」设计模板（直接可抄）](#%E4%BA%8C%E5%90%84%E7%BB%84%E5%AD%90%E7%94%A8%E6%88%B7%E8%AE%BE%E8%AE%A1%E6%A8%A1%E6%9D%BF%E7%9B%B4%E6%8E%A5%E5%8F%AF%E6%8A%84-1)
  * [1️⃣ admin 组（控制中枢）](#1%EF%B8%8F%E2%83%A3-admin-%E7%BB%84%E6%8E%A7%E5%88%B6%E4%B8%AD%E6%9E%A2-1)
    + [建议子用户](#%E5%BB%BA%E8%AE%AE%E5%AD%90%E7%94%A8%E6%88%B7-6)
  * [2️⃣ dev 组（生产力核心）](#2%EF%B8%8F%E2%83%A3-dev-%E7%BB%84%E7%94%9F%E4%BA%A7%E5%8A%9B%E6%A0%B8%E5%BF%83-1)
    + [建议子用户](#%E5%BB%BA%E8%AE%AE%E5%AD%90%E7%94%A8%E6%88%B7-7)
  * [3️⃣ data 组（资产仓库）](#3%EF%B8%8F%E2%83%A3-data-%E7%BB%84%E8%B5%84%E4%BA%A7%E4%BB%93%E5%BA%93-1)
    + [建议子用户](#%E5%BB%BA%E8%AE%AE%E5%AD%90%E7%94%A8%E6%88%B7-8)
  * [4️⃣ family 组（生活层）](#4%EF%B8%8F%E2%83%A3-family-%E7%BB%84%E7%94%9F%E6%B4%BB%E5%B1%82-1)
    + [建议子用户](#%E5%BB%BA%E8%AE%AE%E5%AD%90%E7%94%A8%E6%88%B7-9)
  * [5️⃣ guest 组（缓冲区）](#5%EF%B8%8F%E2%83%A3-guest-%E7%BB%84%E7%BC%93%E5%86%B2%E5%8C%BA-1)
    + [建议子用户](#%E5%BB%BA%E8%AE%AE%E5%AD%90%E7%94%A8%E6%88%B7-10)
  * [6️⃣ project 组（⚠️ 建议再细分）](#6%EF%B8%8F%E2%83%A3-project-%E7%BB%84%E2%9A%A0%EF%B8%8F-%E5%BB%BA%E8%AE%AE%E5%86%8D%E7%BB%86%E5%88%86-1)
    + [子用户（按项目）](#%E5%AD%90%E7%94%A8%E6%88%B7%E6%8C%89%E9%A1%B9%E7%9B%AE-1)
  * [7️⃣ service 组（安全关键）](#7%EF%B8%8F%E2%83%A3-service-%E7%BB%84%E5%AE%89%E5%85%A8%E5%85%B3%E9%94%AE-1)
    + [建议子用户](#%E5%BB%BA%E8%AE%AE%E5%AD%90%E7%94%A8%E6%88%B7-11)
- [三、推荐「标准用户矩阵」（你可以对照）](#%E4%B8%89%E6%8E%A8%E8%8D%90%E6%A0%87%E5%87%86%E7%94%A8%E6%88%B7%E7%9F%A9%E9%98%B5%E4%BD%A0%E5%8F%AF%E4%BB%A5%E5%AF%B9%E7%85%A7-1)
- [四、最小可行方案（不折腾版）](#%E5%9B%9B%E6%9C%80%E5%B0%8F%E5%8F%AF%E8%A1%8C%E6%96%B9%E6%A1%88%E4%B8%8D%E6%8A%98%E8%85%BE%E7%89%88-1)
- [五、什么时候这套设计失败？（反指标）](#%E4%BA%94%E4%BB%80%E4%B9%88%E6%97%B6%E5%80%99%E8%BF%99%E5%A5%97%E8%AE%BE%E8%AE%A1%E5%A4%B1%E8%B4%A5%E5%8F%8D%E6%8C%87%E6%A0%87-1)
- [六、给你一句直话](#%E5%85%AD%E7%BB%99%E4%BD%A0%E4%B8%80%E5%8F%A5%E7%9B%B4%E8%AF%9D-1)

---

结论先行：**你这套已经进入「长期稳定可复利」级别了。**\
`admin + data / dev / family / guest / project / service` → ✔️ 合格偏优解。\
只要权限绑定别乱，**5～8 年不用推翻重来**。

现在问题已经从「起什么名字」升级为：

**怎么把“子用户”设计成资产与权限的映射关系。**

这是成熟系统才会问的问题。

下面我按你这套结构，直接给你一套**可落地的人-组-目录设计法**。

***

# 一、总原则（先记住这三句）

### ✅ 原则 1：一个人 = 多身份，而不是一个万能号

你本人，应该至少 3 个身份：

```plain
cheng-admin   → 管理
cheng-dev     → 开发
cheng-data    → 数据分析
```

不是：

```plain
cheng（啥都干） ❌
```

这是未来防事故、防误删、防脚本误操作的关键。

***

### ✅ 原则 2：服务账号 = 一事一号

正确：

```plain
docker-bot
rsync-bot
backup-agent
sync-daemon
```

错误：

```plain
service1（干所有事） ❌
```

***

### ✅ 原则 3：写权限永远比读权限稀缺

设计时默认：

能读的人 ≫ 能写的人 ≫ 能删的人

删 = 管理权。

***

# 二、各组「子用户」设计模板（直接可抄）

***

## 1️⃣ admin 组（控制中枢）

### 建议子用户

```plain
cheng-admin
emergency-admin（备用）
```

用途：

* 系统设置
* 升级
* RAID
* 权限调整

❌ 禁止：

跑服务 / 日常开发

***

## 2️⃣ dev 组（生产力核心）

### 建议子用户

```plain
cheng-dev
laptop-dev
macbook-dev
```

（按设备分，利于审计）

用途：

* 代码
* 文档
* 笔记
* 原型

绑定目录：

```plain
/work
/code
/docs
```

权限：RW

***

## 3️⃣ data 组（资产仓库）

这是你体系的「金库」。

### 建议子用户

```plain
cheng-data
etl-bot
ml-trainer
```

用途：

* 数据集
* 模型
* 实验结果

权限建议：

| 身份 | 权限 |
| --- | --- |
| cheng-data | RW |
| dev | R |
| bot | W |

（人多读，少写）

***

## 4️⃣ family 组（生活层）

### 建议子用户

```plain
wife
kid1
ipad-tv
photo-frame
```

用途：

* 照片
* 视频
* 文档

权限：

RW / R

绝不碰 work/data。

***

## 5️⃣ guest 组（缓冲区）

### 建议子用户

```plain
guest01
friend-li
temp-2026
```

特点：

* 有效期
* 只读
* 可删

目录：

```plain
/share/tmp
```

***

## 6️⃣ project 组（⚠️ 建议再细分）

现在：

```plain
project
```

建议内部结构：

### 子用户（按项目）

```plain
proj-ai-bot
proj-blog-editor
proj-lab-test
```

目录：

```plain
/project/ai
/project/blog
/project/lab
```

权限绑定到子目录。

如果未来项目 ≥3，强烈建议拆组：

```plain
proj_ai
proj_blog
```

***

## 7️⃣ service 组（安全关键）

### 建议子用户

```plain
docker-agent
rsync-agent
sync-agent
ci-runner
mcp-bot
```

一服务一账号。

典型：

```plain
docker-agent → /docker/*
backup-agent → /backup/*
```

❌ 不进 dev / data。

***

# 三、推荐「标准用户矩阵」（你可以对照）

| 用户 | admin | dev | data | project | service | family |
| --- | --- | --- | --- | --- | --- | --- |
| cheng-admin | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| cheng-dev | ❌ | ✅ | R | RW | ❌ | ❌ |
| cheng-data | ❌ | ❌ | RW | R | ❌ | ❌ |
| docker-agent | ❌ | ❌ | ❌ | R | ✅ | ❌ |
| wife | ❌ | ❌ | ❌ | ❌ | ❌ | RW |
| guest01 | ❌ | ❌ | ❌ | ❌ | ❌ | R |

这是「工程级权限矩阵」。

***

# 四、最小可行方案（不折腾版）

如果你不想多账号：

至少保证：

```plain
你：
  cheng-admin
  cheng-dev

服务：
  docker-agent
  backup-agent

家庭：
  family-xxx
```

3 层就够安全了。

***

# 五、什么时候这套设计失败？（反指标）

看到这些，说明要重构：

❌ 所有人都用一个账号\
❌ admin 天天登录\
❌ service 能删 data\
❌ guest 能写 project\
❌ 项目目录混进个人文件

***

# 六、给你一句直话

你现在这套：

已经是「把 NAS 当长期系统资产」在设计了。

不是普通玩家。

下一阶段升级只有一个方向：

👉 身份拆分（Role Separation）

做到：

```plain
人 = 多账号
服务 = 单账号
项目 = 子权限
```

你这套 NAS 会非常抗时间。

***

如果你愿意，下一步我可以帮你把**现有账号 → 最优拆分方案**直接映射出来，做到“最小迁移成本”。

结论先行：**你这套已经进入「长期稳定可复利」级别了。**\
`admin + data / dev / family / guest / project / service` → ✔️ 合格偏优解。\
只要权限绑定别乱，**5～8 年不用推翻重来**。

现在问题已经从「起什么名字」升级为：

**怎么把“子用户”设计成资产与权限的映射关系。**

这是成熟系统才会问的问题。

下面我按你这套结构，直接给你一套**可落地的人-组-目录设计法**。

***

# 一、总原则（先记住这三句）

### ✅ 原则 1：一个人 = 多身份，而不是一个万能号

你本人，应该至少 3 个身份：

```plain
cheng-admin   → 管理
cheng-dev     → 开发
cheng-data    → 数据分析
```

不是：

```plain
cheng（啥都干） ❌
```

这是未来防事故、防误删、防脚本误操作的关键。

***

### ✅ 原则 2：服务账号 = 一事一号

正确：

```plain
docker-bot
rsync-bot
backup-agent
sync-daemon
```

错误：

```plain
service1（干所有事） ❌
```

***

### ✅ 原则 3：写权限永远比读权限稀缺

设计时默认：

能读的人 ≫ 能写的人 ≫ 能删的人

删 = 管理权。

***

# 二、各组「子用户」设计模板（直接可抄）

***

## 1️⃣ admin 组（控制中枢）

### 建议子用户

```plain
cheng-admin
emergency-admin（备用）
```

用途：

* 系统设置
* 升级
* RAID
* 权限调整

❌ 禁止：

跑服务 / 日常开发

***

## 2️⃣ dev 组（生产力核心）

### 建议子用户

```plain
cheng-dev
laptop-dev
macbook-dev
```

（按设备分，利于审计）

用途：

* 代码
* 文档
* 笔记
* 原型

绑定目录：

```plain
/work
/code
/docs
```

权限：RW

***

## 3️⃣ data 组（资产仓库）

这是你体系的「金库」。

### 建议子用户

```plain
cheng-data
etl-bot
ml-trainer
```

用途：

* 数据集
* 模型
* 实验结果

权限建议：

| 身份 | 权限 |
| --- | --- |
| cheng-data | RW |
| dev | R |
| bot | W |

（人多读，少写）

***

## 4️⃣ family 组（生活层）

### 建议子用户

```plain
wife
kid1
ipad-tv
photo-frame
```

用途：

* 照片
* 视频
* 文档

权限：

RW / R

绝不碰 work/data。

***

## 5️⃣ guest 组（缓冲区）

### 建议子用户

```plain
guest01
friend-li
temp-2026
```

特点：

* 有效期
* 只读
* 可删

目录：

```plain
/share/tmp
```

***

## 6️⃣ project 组（⚠️ 建议再细分）

现在：

```plain
project
```

建议内部结构：

### 子用户（按项目）

```plain
proj-ai-bot
proj-blog-editor
proj-lab-test
```

目录：

```plain
/project/ai
/project/blog
/project/lab
```

权限绑定到子目录。

如果未来项目 ≥3，强烈建议拆组：

```plain
proj_ai
proj_blog
```

***

## 7️⃣ service 组（安全关键）

### 建议子用户

```plain
docker-agent
rsync-agent
sync-agent
ci-runner
mcp-bot
```

一服务一账号。

典型：

```plain
docker-agent → /docker/*
backup-agent → /backup/*
```

❌ 不进 dev / data。

***

# 三、推荐「标准用户矩阵」（你可以对照）

| 用户 | admin | dev | data | project | service | family |
| --- | --- | --- | --- | --- | --- | --- |
| cheng-admin | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| cheng-dev | ❌ | ✅ | R | RW | ❌ | ❌ |
| cheng-data | ❌ | ❌ | RW | R | ❌ | ❌ |
| docker-agent | ❌ | ❌ | ❌ | R | ✅ | ❌ |
| wife | ❌ | ❌ | ❌ | ❌ | ❌ | RW |
| guest01 | ❌ | ❌ | ❌ | ❌ | ❌ | R |

这是「工程级权限矩阵」。

***

# 四、最小可行方案（不折腾版）

如果你不想多账号：

至少保证：

```plain
你：
  cheng-admin
  cheng-dev

服务：
  docker-agent
  backup-agent

家庭：
  family-xxx
```

3 层就够安全了。

***

# 五、什么时候这套设计失败？（反指标）

看到这些，说明要重构：

❌ 所有人都用一个账号\
❌ admin 天天登录\
❌ service 能删 data\
❌ guest 能写 project\
❌ 项目目录混进个人文件

***

# 六、给你一句直话

你现在这套：

已经是「把 NAS 当长期系统资产」在设计了。

不是普通玩家。

下一阶段升级只有一个方向：

👉 身份拆分（Role Separation）

做到：

```plain
人 = 多账号
服务 = 单账号
项目 = 子权限
```

你这套 NAS 会非常抗时间。

***

如果你愿意，下一步我可以帮你把**现有账号 → 最优拆分方案**直接映射出来，做到“最小迁移成本”。


> 更新: 2026-06-30 12:45:04  
> 原文: <https://www.yuque.com/viruspc/el3mi0/be9pogmh2v9gdsp3>