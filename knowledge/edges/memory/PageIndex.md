传统 RAG 的核心假设是：**相似的片段更可能有答案**。  
PageIndex 的核心假设是：**文档的结构路径本身就携带答案线索**，先找正确章节，再找正确页面，再找正确段落 。

The retrieval policy is an LLM that, at each node, asks a single question: _given the user's query, the conversation so far, and where I am in the document, should I look inside this subtree?_ No fixed top-_K_, no embedding bottleneck, no information dropped silently because it ranked K+1K+1.

Claude Code Grep的问题：
1. 不对knowlege做任何处理，这意味着检索质量完全依赖 LLM 对grep关键词的猜测准不准。

Vector-based RAG 面临的问题：
1.   **Similarity is not the same as relevance.**
	1. (Query&Knowledge, Relevant but not similar, **low recall**) **Query and knowledge space mismatch**. Vector retrieval assumes that the _most semantically similar_ text to the query is also the _most relevant_. But this isn’t always true: queries often express _intent_, not _content_.
	2. (Knowledge, Similar but not relevant, **low accuracy**) **Semantic similarity is not equivalent to relevance**. This is especially problematic in domain-specific documents (e.g., financial filings, legal documents, and technical manuals), where many passages share near-identical semantics but differ critically in relevance.

![[Pasted image 20260513212240.png]]
    
2. **. Embeddings have limited representation power**
	1. (Knowledge, embeding limitation) **Hard chunking breaks semantic and contextual integrity**. Documents are split into fixed-size chunks (e.g., 512 or 1000 tokens) for embedding. This “hard chunking” often cuts through sentences, paragraphs, or sections, fragmenting meaning and context.
	2. (Query, embedding limitation) **Cannot integrate chat history**. Each query is treated independently. The retriever doesn’t know what’s been asked or answered before.
    
3. (Knowledge Reference) **Hard to deal with in-document reference**. Documents often contain references such as “see Appendix G” or “refer to Table 5.3”. Since these references don’t share semantic similarity with the referenced content, traditional RAG misses them unless additional preprocessing (like a knowledge graph) is performed.

Three properties fall out of this design, and each one is exactly what classic vector RAG cannot offer:

- **Relevance classification, not semantic similarity.** The LLM doesn't compute a cosine score; it makes a yes/no judgment at every node (_is this subtree worth opening for this query?_) using full-document understanding, not a 768-dimensional proxy. The two failure modes of similarity search (similar-but-irrelevant, relevant-but-dissimilar) simply don't apply.
- **Retrieval depends on context.** The decision at each node is conditioned on the query, the conversation history, the user's role, and the path the LLM has already walked. There's no fixed-length cap forcing context to be discarded. Context shapes every navigation step.
- **Transparent retrieval process.** The search trace is a readable path through the tree: which sections were opened, which were skipped, which yielded the evidence. You can audit _why_ an answer came back, replay the same path for a different model, and surface the citation chain to the end user. Vector search returns a list of chunks with no story; PageIndex returns a route.

https://x.com/akshay_pachaar/status/2058976178908885210

## References

- https://pageindex.ai/blog/pageindex-intro
- https://pageindex.ai/blog/pageindex-filesystem
- https://pageindex.ai/blog/claude-code-agentic-rag