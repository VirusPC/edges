---
name: conversation-to-notes
description: Use this skill when you need to summarize a raw conversation transcript into a structured Chinese note for the Edges system. It generates a standardized filename (YYYY-MM-DD--topic.md) and extracts key conclusions and logical processes.
---

# Conversation to Notes Skill

This skill provides a procedural guide for transforming raw chat logs into high-quality, structured Chinese summaries following the Edges system standards.

## When to Use
- When the user provides a transcript of a discussion or brainstorm.
- When a session ends and needs to be archived as a reusable knowledge asset.

## Core Instructions

1. **Identify the Theme**: Determine the central topic of the discussion.
2. **Standardized Filename**:
   - Format: `YYYY-MM-DD--ShortDescription.md`
   - Use the date mentioned in the chat, or today's date if none.
   - Use concise Chinese for the description.
3. **Extract Content**:
   - **Discussion Theme**: What was this about?
   - **Key Conclusions**: What are the final decisions or insights?
   - **Logical Process**: How did the conversation get there?
   - **Additional Notes**: Any caveats or future follow-ups.
4. **Language**: All output must be in **Chinese**.

## Output Structure

**Filename:** `YYYY-MM-DD--主题简述.md`

---

### 【讨论主题】
...

### 【主要结论】
...

### 【关键过程】
...

### 【补充说明】
...

## Constraints
- **Strictly Chinese**: Never output summary in other languages.
- **No Hallucinations**: Do not add insights not present in the original text.
- **No Metadata**: Do not output explanation text outside the specified structure.
- **Standard Header**: The summary must start with the standardized sections.
