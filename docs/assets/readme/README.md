# README 配图

配图服务于同一条阅读路径：先看到经验如何成为下一次工作的起点，再理解十个模块怎样围绕当前工作按需组合。

| 文件 | 用途 | 制作方式 |
| --- | --- | --- |
| [hero.png](hero.png) | 首屏概念插画；纸张与目录表达经验的积累和延续 | Codex 内置 image generation，2026-10-26 生成；未使用 CLI / API fallback |
| [modules.svg](modules.svg) | 十个模块的用途与共同基础 | 手工编写的原生 SVG，文字可编辑，无外部资源 |

模块图中的连线表示可选组合，没有规定执行顺序。模块说明以[根 README](../../../README.md#模块的设计与用例)及其引用的能力文档为准。更新模块职责时同步检查图中文字；图片的替代文字保留在根 README 中。

## 首屏插画的最终提示词

以下是提交给内置图像生成工具的完整提示词。生成时使用不透明背景，直接保留生成的 PNG。

```text
Use case: stylized-concept
Asset type: editorial hero illustration for the GitHub README of Edges, an open-source system for directory-based work memory and reusable collaboration methods.
Primary request: A beautiful, thoughtful wide illustration expressing “experience becomes the starting point of the next piece of work.”
Scene/backdrop: warm off-white paper background, calm and spacious.
Subject: a finely composed miniature landscape of open folder forms and layered paper cards. On the left, a few loose pages represent captured experience; in the middle, stacked folder-like architectural forms organize that experience; toward the right, a clear new path unfolds from the accumulated layers into a fresh open sheet. A restrained teal curved thread quietly links these forms and loops back, suggesting continuity and learning.
Style/medium: premium contemporary editorial illustration, precise geometric construction with subtle tactile paper depth, beautiful restrained soft shadows, sophisticated rather than playful.
Composition/framing: panoramic 3:1 banner; visual story spans the width with generous whitespace around every edge; medium scale objects with a clear visual hierarchy; no crowded detail.
Lighting/mood: soft natural light, quietly optimistic, lucid and welcoming.
Color palette: warm ivory #F7F6F2, deep ink navy #18333F, muted teal #438D85, with one or two small amber #D9A358 accents.
Materials/textures: matte paper, very subtle fine grain, no glossy plastic.
Text: none.
Constraints: no words, letters, numbers, labels, logos or watermark; no brain illustration, robots, neon glow, network-node wallpaper, fake UI screenshots, or decorative arrows. This is a conceptual illustration, not a literal diagram. Crisp silhouettes, professional visual polish, balanced asymmetry.
```

