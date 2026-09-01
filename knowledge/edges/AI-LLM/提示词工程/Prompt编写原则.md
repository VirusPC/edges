# Prompt编写原则

- [**赋予角色(Role) **](#%E8%B5%8B%E4%BA%88%E8%A7%92%E8%89%B2role-)
- [**保持清晰、直接和详细**](#%E4%BF%9D%E6%8C%81%E6%B8%85%E6%99%B0%E7%9B%B4%E6%8E%A5%E5%92%8C%E8%AF%A6%E7%BB%86)
- [**使用少量示例(Few-shot)**](#%E4%BD%BF%E7%94%A8%E5%B0%91%E9%87%8F%E7%A4%BA%E4%BE%8Bfew-shot)
- [**约束和规范输出 ICIO**](#%E7%BA%A6%E6%9D%9F%E5%92%8C%E8%A7%84%E8%8C%83%E8%BE%93%E5%87%BA-icio)
- [**使用XML标签或者其他标记分块**](#%E4%BD%BF%E7%94%A8xml%E6%A0%87%E7%AD%BE%E6%88%96%E8%80%85%E5%85%B6%E4%BB%96%E6%A0%87%E8%AE%B0%E5%88%86%E5%9D%97)

---

### **<font style="color:rgba(25, 26, 31, 0.9);">赋予角色(Role) </font>**
<font style="color:rgba(25, 26, 31, 0.9);">通过使用system参数来赋予它一个角色，从而显著提升其表现。这种被称为角色提示的技术，是使用系统提示与大模型交互的最强大方式。</font>

### **<font style="color:rgba(25, 26, 31, 0.9);">保持清晰、直接和详细</font>**
<font style="color:rgba(25, 26, 31, 0.9);">简洁易懂，没有歧义的提示词能让大模型返回的内容更完美。这也是我们人和人沟通中的基本原则。</font>

### **<font style="color:rgba(25, 26, 31, 0.9);">使用少量示例(Few-shot)</font>**
<font style="color:rgba(25, 26, 31, 0.9);">AI非常强大，能快速的从我们给定的例子中学习正确的使用方法。所以在表达一个复杂的内容时，可以更多的使用示例来快速调教AI。</font>

### **<font style="color:rgba(25, 26, 31, 0.9);">约束和规范输出 ICIO</font>**
<font style="color:rgba(25, 26, 31, 0.9);">AI非常容易随心发挥，给出的内容各种各样，所以为了更好的控制AI给出符合我们要求格式的输出，约束和规范必不可少。就和我们开发需要遵守规范一样。</font>

### **<font style="color:rgba(25, 26, 31, 0.9);">使用XML标签或者其他标记分块</font>**
<font style="color:rgba(25, 26, 31, 0.9);">当我们的提示词包含多个不同部分时(如上下文，代码规范，返回规范)，XML结构可以帮助AI更准确地解析你的提示词。核心是为了让提示词更加的结构化，从而产生更高质量的输出。</font>



> 更新: 2025-07-07 17:37:31  
> 原文: <https://www.yuque.com/viruspc/el3mi0/tez5k6b6ebtmgsgw>