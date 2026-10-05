# Framebuffers

- [Why?](#why)
- [What?](#what)
- [How?](#how)
  * [Main Procedure](#main-procedure)
  * [How to Complet a Framebuffer?](#how-to-complet-a-framebuffer)
  * [Attachments](#attachments)
    + [Texture Attachments](#texture-attachments)
    + [Renderbuffer Object Attachments](#renderbuffer-object-attachments)
      - [Why use?](#why-use)
      - [How to use?](#how-to-use)
    + [Texture VS Renderbuffer object](#texture-vs-renderbuffer-object)
  * [Example](#example)
- [References](#references)

---

# Why?

* offscreen rendering
* shadow mapping
* ....

# What?

framebuffer = color buffer + depth buffer + stencil buffer

**<font style="color:rgb(17, 17, 17);">Default framebuffer</font>**<font style="color:rgb(17, 17, 17);">: The rendering operations we've done so far were all done on top of the render buffers attached to the </font><font style="color:green;">default framebuffer</font><font style="color:rgb(17, 17, 17);">. The default framebuffer is created and configured when you create your window (GLFW does this for us). By creating our own framebuffer we can get an additional target to render to.</font>

\*\*FBO: \*\*<font style="color:rgb(17, 17, 17);">framebuffer object. </font>OpenGL gives us the flexibility to define our own framebuffers and thus define our own color (and optionally a depth and stencil) buffer.

# How?

## Main Procedure

1. `glGenFramebuffers(1, &fbo);`
2. `glBindFramebuffer(GL_FRAMEBUFFER, fbo); `
3. **complete the framebuffer with attachments**
4. use framebuffer
5. `glDeleteFramebuffers(1, &fbo); `

## How to Complet a Framebuffer?

For a framebuffer to be complete the following requirements have to be satisfied:

* We have to attach **at least one buffer** (color, depth or stencil buffer).
* There should be **at least one color attachment**.
* **All attachments should be complete** as well (reserved memory).
* Each buffer should have the **same number of samples**.

```javascript
class Framebuffer {
  constructor() {
    this.attachments = new Map();  // attachments by attachment point
    this.drawBuffers = [gl.BACK, gl.NONE, gl.NONE, gl.NONE, ...];
    this.readBuffer = gl.BACK,
  }
}
```

## Attachments

There are two type of attachements:

1. texture attachments
2. renderbuffer object attachments

### Texture Attachments

When attaching a texture to a framebuffer, all rendering commands will write to the texture as if it was a normal color/depth or stencil buffer.

The advantage of using textures is that the render output is stored inside the texture image that we can then easily use in our shaders.

1. create texture
   1. The main differences here is that we set the dimensions equal to the screen size (although this is not required) and we pass NULL as the texture's data parameter
   2. make the texutre have the same height and width with the viewport.
   3. Note
      1. 对于depth attachment，需要将texture的format设为depth buffer的存储格式：`GL_DEPTH_COMPONENT`
      2. 对于stencil attachment，需要将texture的format设为`GL_STENCIL_ATTACHMENT`，将internalformat设为`GL_STENCIL_INDEX`
      3. 还可以把depth buffer和stencil buffer作为一个texture来attach。32bit中，24bit用来存储深度信息，8比特用来存储模版信息。需要将texture的format设为`GL_DEPTH_STENCIL`, internalformat设为`GL_DEPTH24_STENCIL8`。
2. attach it to frame buffer
   1. `glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, texture, 0);`
   2. 第二个参数为attachment，用来选择将texture作为什么类型的attachment。
      1. 对于color attachment，一个framebuffer可以attach多个color attachment

### Renderbuffer Object Attachments

Just like a texture image, a renderbuffer object is an actual buffer e.g. an array of bytes, integers, pixels or whatever.

#### Why use?

Advantages: This gives it the added advantage that OpenGL can do a few **memory optimizations** that can give it a **performance** edge over textures for off-screen rendering to a framebuffer. 此外，无需指定各种format。

Disadvantages: However, a renderbuffer object **can not be directly read from**. You cannot read from them directly, but it is possible to read from them via the slow `glReadPixels`.

Since renderbuffer objects are write-only they are often used as depth and stencil attachments, since most of the time we don't really need to read values from them, but we do care about depth and stencil testing. We **need** the depth and stencil values for testing, but don't need to *sample* these values so a renderbuffer object suits this perfectly. When we're not sampling from these buffers, a renderbuffer object is generally preferred.

#### How to use?

```cpp
unsigned int rbo;
glGenRenderbuffers(1, &rbo);
//bind the renderbuffer object so all subsequent renderbuffer 
// operations affect the current rbo
glBindRenderbuffer(GL_RENDERBUFFER, rbo);

glRenderbufferStorage(GL_RENDERBUFFER, GL_DEPTH24_STENCIL8, 800, 600);

// attach the renderbuffer object:
glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_DEPTH_STENCIL_ATTACHMENT, GL_RENDERBUFFER, rbo);
```

### Texture VS Renderbuffer object

## Example

# References

* [LearnOpenGL - Framebuffers](https://learnopengl.com/Advanced-OpenGL/Framebuffers)


> 更新: 2023-05-12 16:42:14  
> 原文: <https://www.yuque.com/viruspc/el3mi0/lh98w6k8dbh3l20r>