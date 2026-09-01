# normalize

- [What's normalizeFlag for in vertexAttribPointer?](#whats-normalizeflag-for-in-vertexattribpointer)

---

# What's normalizeFlag for in vertexAttribPointer?
不是根据传入数据本身的最大最小值做normalize，而是根据数据类型的最大最小值做normalize

The normalize flag is for all the non floating point types. If you pass in false then values will be interpreted as the type they are. BYTE goes from -128 to 127, UNSIGNED_BYTE goes from 0 to 255, SHORT goes from -32768 to 32767 etc...

If you set the normalize flag to true then the values of a BYTE (-128 to 127) represent the values -1.0 to +1.0, UNSIGNED_BYTE (0 to 255) become 0.0 to +1.0. A normalized SHORT also goes from -1.0 to +1.0 it just has more resolution than a BYTE.

The most common use for normalized data is for colors. Most of the time colors only go from 0.0 to 1.0. Using a full float each for red, green, blue and alpha would use 16 bytes per vertex per color. If you have complicated geometry that can add up to a lot of bytes. Instead you could convert your colors to UNSIGNED_BYTEs where 0 represents 0.0 and 255 represents 1.0. Now you'd only need 4 bytes per color per vertex, a 75% savings.

<font style="color:rgb(204, 204, 204);"></font>

[https://webgl2fundamentals.org/webgl/lessons/webgl-how-it-works.html](https://webgl2fundamentals.org/webgl/lessons/webgl-how-it-works.html)



> 更新: 2023-05-01 06:48:45  
> 原文: <https://www.yuque.com/viruspc/el3mi0/ibbxykvoeoko3i7a>