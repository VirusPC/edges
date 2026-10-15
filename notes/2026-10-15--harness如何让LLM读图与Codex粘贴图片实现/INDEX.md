# harness 如何让 LLM 读图与 Codex 粘贴图片实现

> 2026-10-15 与 Grok Bot 的问答。通用部分是常识性梳理；Codex 部分对照 openai/codex 当日 main 源码核实过，行号会随版本漂移。

## 背景

用户在对照生产级 harness 的各层（感知、工具、上下文）是怎么接的，想知道 LLM 在 harness 里怎样“看到”图片，以及 Codex CLI 对粘贴进来的截图具体怎么处理、为什么不用 `file_id`。

## 通用做法

模型不会自己去打开图片，而是由 harness 读进来，再放进发给模型的消息里：

1. **工具返回图片块**：模型调用 `Read` / `view_image` 等工具，harness 读出字节，转成 base64，作为 image 内容块放进工具结果。
2. **用户直接附图**：客户端把图片拼进 user message 的多模态数组，多数情况下也是 base64（data URL）。
3. **截图类工具**：computer use / 浏览器 agent 每步截屏，同样作为图片块回传。

base64 只是最常见的传输方式。另外两种：传公网 URL（如 OpenAI `image_url`，由服务端下载）；先走 Files API 上传拿 `file_id`，消息里只引用 id。服务端会把 base64 解码回图片再交给视觉编码器，模型读到的不是那串字符；base64 体积约为原图的 4/3。

## Codex CLI 的实现（已核对源码）

结论：粘贴或 `-i` 传入的本地图片走 **base64 内联**，不走 `file_id`。

1. **输入类型**（`codex-rs/protocol/src/user_input.rs`）：`UserInput::Image` 是已引用好的图片（data URL 或 `file_id`），原样转给 API；`UserInput::LocalImage { path, detail }` 只存本地路径，序列化请求时才转成 data URL。粘贴的截图先存成临时文件，走 `LocalImage`。`detail` 可取 `auto` / `low` / `high` / `original`。
2. **分发**（`codex-rs/protocol/src/models.rs` 的 `from_user_input`）：遍历输入，每张图编号；对 `LocalImage` 用 `std::fs::read` 读字节。
3. **缩放与编码**（`local_image_content_items_with_label_number`；`codex-rs/utils/image/src/lib.rs` 中 `MAX_DIMENSION = 2048`）：长边超过 2048px 会缩小，`detail = original` 时不缩；之后编码成 `data:{mime};base64,...`。
4. **组装**（`local_image_content_items`）：生成 `ContentItem::InputImage { image: ImageReference::Inline { image_url } }`，图片前后各加一段文本标签，标出第几张图和路径，方便模型引用。
5. 协议里的 `ImageReference` 枚举同时定义了 `Inline` 和 `File { file_id }`，但本地粘贴这条路径用的是 `Inline`。

## 取舍

base64 内联省掉上传和文件生命周期管理，也不用额外调 Files API；代价是图片随历史每轮重复发送，直到上下文被压缩或截断，费带宽和 token。

## 对 edges 的意义

若 edges connector / 服务端 agent 需要处理图片，可以先照 Codex 做法：本地落临时文件，发送前限制长边、内联 base64，并给每张图加编号标签；图片多或会话长时再考虑 `file_id` 以避免重复传输。
