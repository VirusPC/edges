# Error Boundaries

- [Why and What](#why-and-what)
- [How to use](#how-to-use)
- [References](#references)

---

# Why and What
By default, if your application throws an error during rendering, React will remove its UI from the screen. To prevent this, you can wrap a part of your UI into an _error boundary_. An error boundary is a special component that lets you display some fallback UI instead of the part that crashed—for example, an error message.

# How to use
There is currently **no way** to write an error boundary as a function component. However, you don’t have to write the error boundary class yourself. For example, you can use [react-error-boundary](https://github.com/bvaughn/react-error-boundary) instead.

For write an error boundary as a component component, S



# References
+ [Component – React](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)



> 更新: 2023-04-20 07:41:16  
> 原文: <https://www.yuque.com/viruspc/el3mi0/imcq1dp0zzwwhn0k>