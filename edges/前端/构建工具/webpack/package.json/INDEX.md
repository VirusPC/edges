# package.json

- [config.exports](#configexports)
- [module resolution](#module-resolution)

---

## config.exports

When the `exports` field is specified, only these module requests are available. Any other requests will lead to a ModuleNotFound Error.

## module resolution

* absolute pathes
  * no further resolution
* Relative paths
  * 结合当前context path，生成absolute path
* Module paths
  1. 解析路径
     1. 根据 `resolve.alias` 找
     2. `resolve.modules`指定了模块可能放在哪些目录里，去这些目录下找(动态解析路径)
     3. 如果某一级目录有package.json，会先检查package.json里是否有`resolve.exportsFields`指定的字段（一般有"exports"）。如果有的话，查找哪些文件被该模块导出。
  2. 路径解析成功后，判断是否指向一个文件或路径
     1. 如果指向文件
        1. 如果路径有文件后缀名，则直接打包该文件。
        2. 否则，根据`resovle.extensions`进行解析. 默认为\[".wasm",".mjs",".js",".json"]
     2. 如果指向文件夹
        1. 如果文件夹包含 package.json 文件，那么将按顺序查找在 `Resolve.mainFields` 配置选项中指定的字段，package.json 中的第一个这样的字段将确定文件路径。不同打包target默认值不同, 常用的有 main, browser, module，对应cmd,amd和es6。
        2. 如果没有 package.json 或者 `Resolve.mainFields` 没有返回一个有效的路径，那么将按顺序查找在 `Resolve.mainFiles` 配置选项中指定的文件名，以查看导入/所需目录中是否存在匹配的文件名。默认为（\["index"]）
        3. 然后以类似的方式使用 `Resolve.extions` 选项解析文件扩展名

<https://webpack.js.org/guides/package-exports/>

<https://webpack.js.org/concepts/module-resolution/>

<https://blog.csdn.net/qzw752890913/article/details/107093989>


> 更新: 2022-06-08 18:34:59  
> 原文: <https://www.yuque.com/viruspc/el3mi0/hzq0hh>