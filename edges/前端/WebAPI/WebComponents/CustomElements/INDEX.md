# Custom Elements

- [Introduction](#introduction)
- [两种自定义元素](#%E4%B8%A4%E7%A7%8D%E8%87%AA%E5%AE%9A%E4%B9%89%E5%85%83%E7%B4%A0)
- [定义和使用元素](#%E5%AE%9A%E4%B9%89%E5%92%8C%E4%BD%BF%E7%94%A8%E5%85%83%E7%B4%A0)
  * [定义元素](#%E5%AE%9A%E4%B9%89%E5%85%83%E7%B4%A0)
    + [customized built-in elements](#customized-built-in-elements)
    + [**autonomous custom elements**](#autonomous-custom-elements)
    + [生命周期回调](#%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E5%9B%9E%E8%B0%83)
  * [注册元素](#%E6%B3%A8%E5%86%8C%E5%85%83%E7%B4%A0)
    + [**customized built-in elements**](#customized-built-in-elements)
    + [autonomous custom elements](#autonomous-custom-elements)
  * [使用元素](#%E4%BD%BF%E7%94%A8%E5%85%83%E7%B4%A0)
    + [**customized built-in elements**](#customized-built-in-elements-1)
    + [autonomous custom elements](#autonomous-custom-elements-1)
- [控制元素](#%E6%8E%A7%E5%88%B6%E5%85%83%E7%B4%A0)
  * [attributes](#attributes)
  * [css (autonomous custom elements)](#css-autonomous-custom-elements)
- [代码示例](#%E4%BB%A3%E7%A0%81%E7%A4%BA%E4%BE%8B)
- [参考文档](#%E5%8F%82%E8%80%83%E6%96%87%E6%A1%A3)

---

## Introduction

**Custom elements**: HTML elements whose behavior is defined by the web developer, that **extend the set of elements available in the browser.**

## 两种自定义元素

开发者通过继承标准 HTML 元素来实现自定义元素。根据继承的父类的不同， custom elements 分为两类，**customized built-in elements** 和 **autonomous custom elements**：

* 继承一个浏览器实现的HTML元素：\*\*Customized built-in elements \*\*inherit from standard HTML elements such as `HTMLImageElement` (对应`<img>`)or `HTMLParagraphElement`(对应 `<p>`). Their implementation customizes the behavior of the standard element.
* 直接继承所有HTML元素的基类：\*\*Autonomous custom elements \*\*inherit from the HTML element base class `HTMLElement`. You have to implement their behavior from scratch.

## 定义和使用元素

### 定义元素

#### customized built-in elements

```javascript
class WordCount extends HTMLParagraphElement {
  constructor() {
    super();
  }
  // Element functionality written in here
}
```

#### **autonomous custom elements**

```javascript
class PopupInfo extends HTMLElement {
  constructor() {
    super();
  }
  // Element functionality written in here
}

```

#### 生命周期回调

* `connectedCallback()`: called each time the element is added to the document. The specification recommends that, as far as possible, developers should implement custom element setup in this callback rather than the constructor. 当元素放到document中时触发。
* `disconnectedCallback():` called each time the element is removed from the document. 当元素脱离document时触发。
* `adoptedCallback():` called each time the element is moved to a new document. 当元素放到新document中时触发。
* `attributeChangedCallback():` called when attributes are changed, added, removed, or replaced. See Responding to attribute changes for more details about this callback. 当元素属性发生变化时触发。

```javascript
// Create a class for the element
class MyCustomElement extends HTMLElement {
  static observedAttributes = ["color", "size"];

  constructor() {
    // Always call super first in constructor
    super();
  }

  connectedCallback() {
    console.log("Custom element added to page.");
  }

  disconnectedCallback() {
    console.log("Custom element removed from page.");
  }

  adoptedCallback() {
    console.log("Custom element moved to new page.");
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`Attribute ${name} has changed.`);
  }
}

window.customElements.define("my-custom-element", MyCustomElement);

```

### 注册元素

#### **customized built-in elements**

```javascript
window.customElements.define("word-count", WordCount, { extends: "p" });
```

#### autonomous custom elements

```javascript
window.customElements.define("popup-info", PopupInfo);
```

* `name`: The name of the element. This must start with a lowercase letter, contain a hyphen, and satisfy certain other rules listed in the specification's definition of a valid name.
* `constructor`: The custom element's constructor function.
* `options`: 可选。Only included for customized built-in elements, this is an object containing a single property extends, which is a string naming the built-in element to extend.

### 使用元素

custom elements 分为两类，两种类型的使用方式都不同。

#### **customized built-in elements**

```html
<p is="word-count"></p>
```

#### autonomous custom elements

```html
<popup-info>
  <!-- content of the element -->
</popup-info>
```

## 控制元素

### attributes

我们通过设置 html 元素的 attribute 来控制元素的行为。为了自定义元素能够对attribute的变化做出反应，用户需要在自定义元素的类里添加以下成员变量：

* `observedAttributes`：静态属性，数组。数组中包含自定义元素的所有attributes。
* `attributeChangedCallback(name, oldValue, newValue) `：实现这一生命周期回调。当 `observedAttributes`发生变化时被触发。

```javascript
// Create a class for the element
class MyCustomElement extends HTMLElement {
  static observedAttributes = ["size"];

  constructor() {
    super();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(
      `Attribute ${name} has changed from ${oldValue} to ${newValue}.`,
    );
  }
}

customElements.define("my-custom-element", MyCustomElement);
```

```html
<my-custom-element size="100"></my-custom-element>
```

### css (autonomous custom elements)

Custom states and custom state pseudo-class CSS selectors

Built in HTML elements can have different states, such as "hover", "disabled", and "read only". Some of these states can be set as attributes using HTML or JavaScript, while others are internal, and cannot. Whether external or internal, **commonly these states have corresponding CSS pseudo-classes that can be used to select and style the element when it is in a particular state.**

\*\*Autonomous custom elements \*\*(but not elements based on built-in elements) also allow you to define states and select against them using the :state() pseudo-class function.

The code below shows how this works using the example of an autonomous custom element that has an internal state "`collapsed`".

The collapsed state is represented as a boolean property (with setter and getter methods) that is not visible outside of the element. \*\*To make this state selectable in CSS the custom element first calls \*\*<code>**HTMLElement.attachInternals()**</code> in its constructor in order to attach an `ElementInternals` object, which in turn provides access to a `CustomStateSet` through the `ElementInternals.states` property.

The setter for the (internal) collapsed state adds the identifier `hidden` to the `CustomStateSet` when the state is `true`, and removes it when the state is `false`. The identifier is just a string: in this case we called it hidden, but we could have just as easily called it collapsed.

```html
<style>
  my-custom-element {
    border: dashed red;
  }
  my-custom-element:--hidde {
    border: dashed blue;
  }
</style>
<script>
  class MyCustomElement extends HTMLElement {
    constructor() {
      super();
      this._internals = this.attachInternals();
    }

    get collapsed() {
      return this._internals.states.has("--hidde");
    }

    set collapsed(flag) {
      console.log('collpased - ',flag);
      if (flag) {
        // Existence of identifier corresponds to "true"
        this._internals.states.add("--hidde");
      } else {
        // Absence of identifier corresponds to "false"
        this._internals.states.delete("--hidde");
      }
    }
  }

  // Register the custom element
  customElements.define("my-custom-element", MyCustomElement);
</script>

<!-- <my-custom-element hidde="true"></my-custom-element> -->
<my-custom-element></my-custom-element>
<script>
  const el = document.querySelector('my-custom-element')
  console.log(el);
  el.collapsed = true;
</script>

```

The :state() pseudo-class can also be used within the `:host()` pseudo-class function to match a custom state within a custom element's shadow DOM. Additionally, the `:state()` pseudo-class can be used after the `::part()` pseudo-element to match the shadow parts of a custom element that is in a particular state.

## 代码示例

## 参考文档

* [Using custom elements - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements#responding_to_attribute_changes)
* <https://itnext.io/the-hidden-power-of-custom-states-for-web-components-dcae5b048e20>


> 更新: 2024-02-16 09:22:58  
> 原文: <https://www.yuque.com/viruspc/el3mi0/wgi5np83cdk9ntyy>