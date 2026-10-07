# HTML templates

- [Introduction](#introduction)
- [定义](#%E5%AE%9A%E4%B9%89)
- [使用](#%E4%BD%BF%E7%94%A8)
- [高级使用](#%E9%AB%98%E7%BA%A7%E4%BD%BF%E7%94%A8)
- [slots](#slots)
- [高级代码示例](#%E9%AB%98%E7%BA%A7%E4%BB%A3%E7%A0%81%E7%A4%BA%E4%BE%8B)

---

## Introduction

When you have to reuse the same markup structures repeatedly on a web page, it makes sense to use some kind of a template rather than repeating the same structure over and over again. This was possible before, but it is made a lot easier by the HTML `<template>` element. This element and its contents are not rendered in the DOM, but it can still be referenced using JavaScript.

## 定义

```html
<template id="my-paragraph">
  <p>My paragraph</p>
</template>
```

## 使用

需要通过 `content`属性来获取dom树

```javascript
let template = document.getElementById("my-paragraph");
let templateContent = template.content;
document.body.appendChild(templateContent);

```

## 高级使用

Using templates with web components

```javascript
customElements.define(
  "my-paragraph",
  class extends HTMLElement {
    constructor() {
      super();
      let template = document.getElementById("my-paragraph");
      let templateContent = template.content;

      const shadowRoot = this.attachShadow({ mode: "open" });
      shadowRoot.appendChild(templateContent.cloneNode(true));
    }
  },
);

```

## slots

Slots are identified by their name attribute, and allow you to define placeholders in your template that can be filled with any markup fragment you want when the element is used in the markup.

```html
<template id="my-paragraph">
  <style>
    p {
      color: white;
      background-color: #666;
      padding: 5px;
    }
  </style>
  <p>
    <!-- slot内的text被认为是缺省值 -->
    <slot name="my-text">My default text</slot>
  </p>
</template>
```

```html
<my-paragraph>
  <!-- 用这个 span 替换 template 中的 my-text slot -->
   <span slot="my-text">Let's have some different text!</span>
</my-paragraph>

<my-paragraph>
  <!-- 用这个 ul 替换 template 中的 my-text slot-->
  <ul slot="my-text">
    <li>Let's have some different text!</li>
    <li>In a list!</li>
  </ul>
</my-paragraph>
```

## 高级代码示例

通过 custom element 间接使用 template

```html
<template id="element-details-template">
  <style>
    details {
      font-family: "Open Sans Light", Helvetica, Arial;
    }
    .name {
      font-weight: bold;
      color: #217ac0;
      font-size: 120%;
    }
    h4 {
      margin: 10px 0 -8px 0;
    }
    h4 span {
      background: #217ac0;
      padding: 2px 6px 2px 6px;
    }
    h4 span {
      border: 1px solid #cee9f9;
      border-radius: 4px;
    }
    h4 span {
      color: white;
    }
    .attributes {
      margin-left: 22px;
      font-size: 90%;
    }
    .attributes p {
      margin-left: 16px;
      font-style: italic;
    }
  </style>
  <details>
    <summary>
      <span>
        <code class="name"
          >&lt;<slot name="element-name">NEED NAME</slot>&gt;</code
        >
        <span class="desc"
          ><slot name="description">NEED DESCRIPTION</slot></span
        >
      </span>
    </summary>
    <div class="attributes">
      <h4><span>Attributes</span></h4>
      <slot name="attributes"><p>None</p></slot>
    </div>
  </details>
  <hr />
</template>

```

```javascript
customElements.define(
  "element-details",
  class extends HTMLElement {
    constructor() {
      super();
      const template = document.getElementById(
        "element-details-template",
      ).content;
      const shadowRoot = this.attachShadow({ mode: "open" });
      shadowRoot.appendChild(template.cloneNode(true));
    }
  },
);
```

```html
<element-details>
  <span slot="element-name">slot</span>
  <span slot="description"
    >A placeholder inside a web component that users can fill with their own
    markup, with the effect of composing different DOM trees together.</span
  >
  <dl slot="attributes">
    <dt>name</dt>
    <dd>The name of the slot.</dd>
  </dl>
</element-details>

<element-details>
  <span slot="element-name">template</span>
  <span slot="description"
    >A mechanism for holding client- side content that is not to be rendered
    when a page is loaded but may subsequently be instantiated during runtime
    using JavaScript.</span
  >
</element-details>

```


> 更新: 2024-02-16 09:01:46  
> 原文: <https://www.yuque.com/viruspc/el3mi0/xt2icdkda8163kiq>