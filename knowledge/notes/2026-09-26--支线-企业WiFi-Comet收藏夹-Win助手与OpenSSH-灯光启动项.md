# 2026-09-26--支线-企业WiFi-Comet收藏夹-Win助手与OpenSSH-灯光启动项

> **今晚为何重要**：主线是断电恢复与组网，但支线同样定规则：企业 Wi‑Fi **PEAP+MSCHAPv2** 写法、NAS 禁止上企业网、Windows 设备助手的诞生、「人不在机前如何提权」的管理员通道设计、以及 Comet/1Password 共享库边界。这些决定了以后换公司网、加助手、要密码时不会重踩坑。

【背景】
- 多助手并行：通用-辅助-2（企业 Wi‑Fi / 远控概论）、minigtr设备助手（档案与交接）、4070ts-win11设备助手（Wi‑Fi 驱动、WU、启动项、锁屏）、IT资产管理（Comet、静电、主机清单）。  
- 用户原文选录：「**我有一个Win 11系统，为什么连接有密码的公司WiFi，连接的时候没让我输密码，并且提示无法连接到这个网络？**」「**是企业认证，没有连过这个WiFi。**」「**我之前mini GTR怎么配的来着？**」「**在想我能否用屋里的网线将这些服务器连接成一个局域网？**」（引出交换机篇）「**新建一个 gtx4070ts-win11设备助手吧**」「**我不在电脑前怎么办？**」「**我希望你找我确认下就好了，我确认后你自动以管理员身份处理事情**」「**你看我Chrome浏览器的收藏夹里面有一个VPN相关的网站，是什么？**」「**comet浏览器也行**」「**临时帮我把win11这个主机的风扇灯光关掉**」「**把chatgpt和grok bot都设置为开机启动项**」。

【过程】
### A. 企业 Wi‑Fi（约 20:26–20:34，通用-辅助-2 + minigtr 档案）
- 现象：没弹密码就「无法连接」——企业网不是共享 PSK；直接点 SSID 常立刻失败。  
- minigtr 档案硬规则：WPA2 Enterprise → **PEAP + MSCHAPv2**；必要时不校验 CA；**不要用默认 TTLS**；SSID **`RED-ENGINEER`**；用户名=公司邮箱。  
- **禁止绿联 NAS 连企业网**（802.1X 弱支持 + 合规）。  
- Win11 UI 坑：必须走「手动添加网络 / 高级 Wi‑Fi 网络属性」填 EAP；列表里盲点 SSID 往往不弹账密。可用 `netsh wlan delete profile` 后重加。  
- 用户链路：「其他都配了，但是没让我输入账号密码呀。」→「OK，后面让我输账号密码了，已连接安全，但实际上没有网。」→「哦，可以了，只是网比较慢而已。」

### B. Comet / 收藏夹 / 1Password（约 21:05–21:36，IT资产管理）
- Mac mini Chrome 收藏夹空；Comet 仅见 Moonshot；无机场类书签。  
- Comet **bookmarks 同步关着**，未挂 Google/Perplexity 账号。  
- 助手只能读 1Password **「Shared with Grok Bot」** 库。用户放入 Google 后：自动填只能填「助手自己电脑」的浏览器，**填不进用户 Mac 上的 Comet**；人不在旁无法代过 2FA。  
- 助手侧浏览器曾用共享 Google 登进 Perplexity（完整邮箱不入库）——**不同步到 Mac Comet**。VPN 收藏未找到。用户改去看新 Windows 设备。

### C. Windows 设备助手 + OpenSSH / WU（22:07–23:25）
- 新机入网；用户要装 OpenSSH；`Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0` 极慢。  
- winget **失败链**：用户曾试错误包名 `Microsoft.OpenSSH.Beta` →「找不到与输入条件匹配的程序包」；正确 id 为 **`Microsoft.OpenSSH.Preview`**。  
- 22:44：「新建一个 gtx4070ts-win11设备助手吧」→ 专管该 Win，与 minigtr Ubuntu 分开。  
- 23:08+ 用户：「你自己跑不行吗」「我不在电脑前怎么办？」→ 方案：回机前一次性管理员脚本（OpenSSH + `C:\ProgramData\GrokBot` 任务运行器 `GrokBot-Admin`）；聊天确认后触发最高权限任务。  
- 23:14 WU：**Windows 11 25H2 下载错误 0x80248007**；桌面 `fix-wu-0x80248007.ps1`；UAC 后清 SoftwareDistribution / catroot2；写 `wu-fix-result.txt`；需重启再试。大包曾卡 0%，Delivery Optimization 限速。  
- 23:16 正式交接给 Windows 助手，勿再绕回 minigtr。会话末 OpenSSH **仍未出现 sshd**（待 WU/机前管理员通道收尾）。

### D. Wi‑Fi 断连与驱动（22:52–23:59，4070 助手）
- 「RED-ENGINEER 和 RED-GUEST 老是突然断联并招不到」；个人热点正常。  
- 网卡：Qualcomm FastConnect 7800，驱动曾偏旧（2023-12）；信号弱；一周断线与重连失败偏多，原因常记「无可见接入点」。  
- 已做：个人热点配置改手动，免与办公网抢连。Wake on Magic Packet 需管理员，人未在机前未改完。  
- 主板一键更新**未**带上 WLAN 驱动。改用微软更新目录 WHQL：升到较新正式驱动（包在 `Downloads\WiFiDriverUpdate\`）。之后改走**家庭有线同网段**（见交换机篇），少依赖办公 Wi‑Fi。

### E. 灯光 / 启动项 / 其它
- 风扇灯：MSI Center → **Mystic Light**；服务 `Mystic_Light_Service` / `MSI_Case_Service`。停服务不一定灭灯；应用内亮度 0/Off。Grok 掉线时改口头指导。用户：「MSI center 看起来更新失败」「看错了」。**会话末是否已关灭未确认。**  
- 开机启动（23:45）：`Grok Bot` → `C:\Program Files\Grok Bot\Grok Bot.exe`；`ChatGPT` → 商店 `OpenAI.Codex`（shell:AppsFolder）。  
- 测试同学：窗口内仅少量助手消息、无用户设备正文，与主线无关。

【所学】
- 企业 Wi‑Fi 与家里有线局域网必须分层；NAS 永不绑 802.1X。  
- 「共享密码库」有物理边界：填得进哪台浏览器要事先说清。  
- 人不在机前 ≠ 不能运维，但**第一次**提权/装 sshd 必须当面；之后用计划任务/SSH 管理员会话。  
- 设备助手按机器拆分，避免 minigtr Ubuntu 助手兼管 Win 更新。  
- OpenSSH 包名要精确（Preview ≠ Beta）；Capability 卡住应换通道或先修 WU。

【行动指南】
- 若再连 `RED-ENGINEER`：PEAP+MSCHAPv2，手动配置文件，勿列表盲点。  
- 若要助手用密码：条目放进「Shared with Grok Bot」；2FA 仍可能要你点。  
- 若回 Win 机前一次：跑完管理员通道脚本（关 Wake + OpenSSH + GrokBot-Admin 任务）。  
- 若灭机箱灯：Mystic Light 拉亮度，不单靠停服务。  
- 若 25H2 仍失败：看重启后新错误码与 `wu-fix-result.txt`。

【补充说明】
- 硬件快照（约 22:45）：Win11 10.0.22631；i7-14700KF；约 64GB RAM；RTX 4070 Ti SUPER；大容量 C:；当日傍晚开机。主板 MPG Z790 CARBON WIFI II。  
- 交叉：局域网出口 → 交换机篇；改名与助手名 → SSH 篇；RDP/锁屏 → RDP 篇。
