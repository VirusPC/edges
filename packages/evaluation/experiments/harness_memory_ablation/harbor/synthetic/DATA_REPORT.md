# 公开合成数据离线诊断

这是可重复构造的数据质量与词法诊断，不是真实用户数据，也不是模型运行结果。

参数：`--seed 20261109 --distractor-scopes 48`。

计数：`{"memories": 682, "cases": 40, "domains": 96, "memory_scopes": 193, "test_nonroot_cases": 30, "max_gold": 3, "future_memories": 96}`。

| split / family | 题数 | 场景 oracle recall@5 | 无 scope 词法 recall@5 | 差距 |
| --- | ---: | ---: | ---: | ---: |
| dev/local | 3 | 1.000 | 1.000 | 0.000 |
| dev/override | 1 | 1.000 | 1.000 | 0.000 |
| dev/cross_scope | 2 | 1.000 | 0.667 | 0.333 |
| dev/global | 1 | 1.000 | 0.500 | 0.500 |
| dev/negative | 1 | N/A | N/A | N/A |
| test/local | 12 | 1.000 | 1.000 | 0.000 |
| test/override | 6 | 1.000 | 0.944 | 0.056 |
| test/cross_scope | 6 | 1.000 | 0.556 | 0.444 |
| test/global | 4 | 1.000 | 0.500 | 0.500 |
| test/negative | 4 | N/A | N/A | N/A |

词法基线：BM25-style title/body character-bigram ranking over time-visible documents only, including document-frequency statistics; explicit directory strings and scope metadata omitted; business names and dates retained; top 5, no abstention; no semantic ancestry/version reasoning. This is not an LLM and does not compare placement arms.

区分度判读：Before model runs, report oracle-minus-lexical by family, duplicate-title rate and scope/version conflicts. A positive gap means lexical confounding exists, not that scoped will beat root. No effect-size threshold is used to select seeds or revise test cases.

负例的词法基线固定选 5 条，不能用于证明其会合理弃答。祖先覆盖和跨域组合以结构事实重新求解；任何单纯按当前 scope 截断的检索都会漏掉跨域需求。

独立场景、gold 必要理由与非 gold 排除类别在 data-v1.json；逐题 oracle 答案和词法前五在 DATA_REPORT.json。

- Templates are shared across dev/test; entities, sessions, facts and IDs are disjoint.
- Synthetic difficulty and arbitrary policy values do not establish real-world memory effectiveness.
- Oracle and lexical diagnostic outcomes are constructed/offline, not model experiment results.
- Generator validation is not an independent semantic review; freeze only after a separate reviewer checks scene/renderer/question agreement.
- Root keeps full scope/time metadata and identical bodies; scope is never used to hide memories from root.
- No model output was used to design cases, select seeds, or tune test difficulty.

数据 SHA256：`2e4f02df87127881a3bfe240c322ae1c84db372d18f231bc5e8b4ed962ea97b7`。
