# 垃圾回收

[垃圾回收机制 | HZFE - 剑指前端 Offer](http://febook.hzfe.org/awesome-interview/book2/browser-garbage)



为了避免分页机制导致的内存碎片，降低访存性能，垃圾回收时需要对内存做整理。



1. 新生代，用minor GC，Scavenger 算法。该算法使用了 semi-space（半空间） 的设计：将堆一分为二，始终只使用一半的空间：From-Space 为使用空间，To-Space 为空闲空间。
2. 老生代，用major GC，Mark-Compact算法。通过标记、清除、整理，将空闲内存整理到一端



> 更新: 2025-05-25 07:13:55  
> 原文: <https://www.yuque.com/viruspc/el3mi0/lb5g8c>