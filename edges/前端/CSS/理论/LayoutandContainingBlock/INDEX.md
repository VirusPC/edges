# Layout and Containing Block

- [Effects of the containing block](#effects-of-the-containing-block)
- [Identifying the containing block](#identifying-the-containing-block)

---

The size and position of an element are often impacted by its containing block. Most often, the containing block is the content area of an element's nearest block-level ancestor, but this is not always the case.



## Effects of the containing block
The size and position of an element are often impacted by its containing block. e.g.Percentage values.



## Identifying the containing block
1. If the position property is static, relative, or sticky, the containing block is formed by the edge of the content box of the nearest ancestor element that is either a block container (such as an inline-block, block, or list-item element) or establishes a formatting context (such as a table container, flex container, grid container, or the block container itself).
2. If the position property is absolute, the containing block is formed by the edge of the padding box of the nearest ancestor element that has a position value other than static (fixed, absolute, relative, or sticky).
3. If the position property is fixed, the containing block is established by the viewport (in the case of continuous media) or the page area (in the case of paged media).
4. If the position property is absolute or fixed, the containing block may also be formed by the edge of the padding box of the nearest ancestor element that has the following:
5. 

[Layout and the containing block - CSS: Cascading Style Sheets | MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block)



> 更新: 2025-06-08 06:41:17  
> 原文: <https://www.yuque.com/viruspc/el3mi0/mqdxp2>