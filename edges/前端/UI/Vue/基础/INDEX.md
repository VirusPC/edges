# 基础

```javascript
var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!'，
		seen: true,
		todos: [
			{ text: "学习 JavaScript" },
			{ text: "学习 Vue" }
		]
  },
	methods: {
    reverseMessage: function () {
      this.message = this.message.split('').reverse().join('')
    }
	}
})
```

1. 数据绑定
   1. 子元素： `<div>{{message}}</div>`
   2. 元素属性：`<div v-bind:title="message"></div>` ，缩写`<div :title="message"></div>` 。（<font style="color:rgb(48, 68, 85);">Mustache 语法不能作用在 HTML attribute 上，遇到这种情况应该使用 </font>[v-bind指令](https://cn.vuejs.org/v2/api/#v-bind)<font style="color:rgb(48, 68, 85);">：</font>）
2. 条件与循环：
   1. 条件：`<div v-if"seen">现在你看到我了</div>` v-show
   2. 循环：`<li v-for="todo in todos">{{todo.text}}</li>`
3. 用户输入：
   1. 用户click=>修改data：`<button v-on:click="reverseMessage">reverse message</button>` 缩写：`<button @click="reverseMessage">reverse message</button>`
   2. 用户input=>修改data(v-bind+v-on)：`<input v-model="message">` 等价于 <font style="color:rgb(41, 115, 183);background-color:rgb(248, 248, 248);">\<inputv-bind:value=</font><font style="color:rgb(66, 185, 131);background-color:rgb(248, 248, 248);">"searchText"</font><font style="color:rgb(41, 115, 183);background-color:rgb(248, 248, 248);">v-on:input=</font><font style="color:rgb(66, 185, 131);background-color:rgb(248, 248, 248);">"searchText = $event.target.value"</font><font style="color:rgb(41, 115, 183);background-color:rgb(248, 248, 248);"> > </font><font style="color:rgb(41, 115, 183);">\<custom-inputv-bind:value=</font><font style="color:rgb(66, 185, 131);">"searchText"</font><font style="color:rgb(41, 115, 183);">v-on:input=</font><font style="color:rgb(66, 185, 131);">"searchText = $event"</font><font style="color:rgb(41, 115, 183);"> ></custom-input></font>
4. 组件：

```html
<ol>
	<todo-item
		v-for="todo in todos"
    v-bind:todo="todo"
	></todo-item>
</ol>

<javascript>
  Vue.component('todo-item', {
    props: ['todo'],
    template: '<li>{todo.text}</li>'
  })
</javascript>

```

指令的职责是，当表达式的值改变时，将其产生的连带影响，响应式地作用于 DOM。

一些指令能够接收一个“参数”，在指令名称之后以冒号表示。从 2.6.0 开始，可以用方括号括起来的 JavaScript 表达式作为一个指令的参数。

修饰符 (modifier) 是以半角句号 . 指明的特殊后缀，用于指出一个指令应该以特殊方式绑定。例如，.prevent 修饰符告诉 v-on 指令对于触发的事件调用 event.preventDefault()：

当在一个自定义组件上使用 class property 时，这些 class 将被添加到该组件的根元素上面。这个元素上已经存在的 class 不会被覆盖。

vue 不指定key时，默认相同。react默认不同。


> 更新: 2021-10-13 14:29:13  
> 原文: <https://www.yuque.com/viruspc/el3mi0/mrwazf>