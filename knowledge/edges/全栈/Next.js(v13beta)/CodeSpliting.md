# Code Spliting

- [What is code spliting?](#what-is-code-spliting)
- [Why we need code spliting?](#why-we-need-code-spliting)
- [How to use code spliting?](#how-to-use-code-spliting)
- [References](#references)

---

# What is code spliting?
<font style="color:rgb(0, 0, 0);">Developers usually split their applications into </font>**<font style="color:rgb(0, 0, 0);">multiple pages</font>**<font style="color:rgb(0, 0, 0);"> that can be accessed from different URLs. Each of these pages becomes a unique </font>**<font style="color:rgb(0, 0, 0);">entry point</font>**<font style="color:rgb(0, 0, 0);"> into the application.</font>

<font style="color:rgb(0, 0, 0);">Code-splitting is the process of </font>**<font style="color:rgb(0, 0, 0);">splitting the application’s bundle into smaller chunks required by each entry point</font>**<font style="color:rgb(0, 0, 0);">. </font>

![1681959072654-d33690f9-fb11-4f9a-acd0-79baf26a5bc4.png](./img/eLdlvyZMzWkzO5mq/1681959072654-d33690f9-fb11-4f9a-acd0-79baf26a5bc4-936350.png)



# Why we need code spliting?
<font style="color:rgb(0, 0, 0);">The goal is to</font>**<font style="color:rgb(0, 0, 0);"> improve the application's initial load time</font>**<font style="color:rgb(0, 0, 0);"> by only loading the code required to run that page.</font>

# How to use code spliting?
<font style="color:rgb(0, 0, 0);">Next.js has built-in support for code splitting. Each file inside your </font>pages/<font style="color:rgb(0, 0, 0);"> </font><font style="color:rgb(0, 0, 0);">directory will be automatically code split into its own JavaScript bundle during the build step.</font>

<font style="color:rgb(0, 0, 0);">Further:</font>

+ <font style="color:rgb(0, 0, 0);">Any code shared between pages is also split into another bundle to avoid re-downloading the same code on further navigation.</font>
+ <font style="color:rgb(0, 0, 0);">After the initial page load, Next.js can start </font>[pre-loading the code](https://nextjs.org/docs/api-reference/next/link#:~:text=Defaults%20to%20false-,prefetch,-%2D%20Prefetch%20the%20page)<font style="color:rgb(0, 0, 0);"> of other pages users are likely to navigate to. （with </font>[next/link](https://nextjs.org/docs/api-reference/next/link)<font style="color:rgb(0, 0, 0);"> in that page）</font>
+ [Dynamic imports](https://nextjs.org/docs/advanced-features/dynamic-import)<font style="color:rgb(0, 0, 0);"> are another way to manually split what code is initially loaded. (to gain the purpose of </font>**<font style="color:rgb(0, 0, 0);">lazy loading</font>**<font style="color:rgb(0, 0, 0);"> external libraries )</font>

# References
[https://nextjs.org/learn/foundations/how-nextjs-works/code-splitting](https://nextjs.org/learn/foundations/how-nextjs-works/code-splitting)

[https://nextjs.org/docs/api-reference/next/link](https://nextjs.org/docs/api-reference/next/link)

[Advanced Features: Dynamic Import | Next.js](https://nextjs.org/docs/advanced-features/dynamic-import)



> 更新: 2023-05-03 10:17:05  
> 原文: <https://www.yuque.com/viruspc/el3mi0/vxtbn5usstx5c8lm>