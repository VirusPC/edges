传统 RAG 的核心假设是：**相似的片段更可能有答案**。  
PageIndex 的核心假设是：**文档的结构路径本身就携带答案线索**，先找正确章节，再找正确页面，再找正确段落 。

Vector-based RAG 面临的问题：
1.  (Query - Knowledge) **Query and knowledge space mismatch**. Vector retrieval assumes that the _most semantically similar_ text to the query is also the _most relevant_. But this isn’t always true: queries often express _intent_, not _content_.
    
2. (Knowledge) **Semantic similarity is not equivalent to relevance**. This is especially problematic in domain-specific documents (e.g., financial filings, legal documents, and technical manuals), where many passages share near-identical semantics but differ critically in relevance.
![[Pasted image 20260513212240.png]]
    
3. (Knowledge) **Hard chunking breaks semantic and contextual integrity**. Documents are split into fixed-size chunks (e.g., 512 or 1000 tokens) for embedding. This “hard chunking” often cuts through sentences, paragraphs, or sections, fragmenting meaning and context.
    
4. (Query) **Cannot integrate chat history**. Each query is treated independently. The retriever doesn’t know what’s been asked or answered before.
    
5. (Knowledge Reference) **Hard to deal with in-document reference**. Documents often contain references such as “see Appendix G” or “refer to Table 5.3”. Since these references don’t share semantic similarity with the referenced content, traditional RAG misses them unless additional preprocessing (like a knowledge graph) is performed.