Why TypeBox instead of Zod?
  
- TypeBox outputs real JSON Schema natively — the format LLM providers expect for tool definitions. Zod needs a converter. 
- TypeBox also has zero runtime dependencies. 

Different tradeoffs; Pi picked TypeBox for the LLM use case.