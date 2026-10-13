1. 用 `ord()` 获取 Unicode 码点，用 `chr()` 反向转换。
```py
   ord("a")   # 97  ← 不是 67，67 是 'C'
ord("C")   # 67
ord("中")  # 20013

chr(97)    # 'a'
chr(20013) # '中'
```
2. 快速创建数组

```python
count = [0] * 26

# 路径和/最长公共子序列：0
dp = [[0] * (m+1) for _ in range(n+1)]

# 编辑距离/最短路径：inf
dp = [[float('inf')] * m for _ in range(n)]
dp[0][0] = 0
```

```python
    for s in strs:
        # 用 26 长度数组统计频次，转成 tuple 当 key
        count = [0] * 26
        for c in s:
            count[ord(c) - ord('a')] += 1
        groups[tuple(count)].append(s)
```

3. join
```py
'#'.join(map(str, count))
# ↑ 分隔符  ↑ 可迭代对象（列表、元组、生成器等）
```

4. defaultdict
```py

from collections import defaultdict

class Solution:
    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:
        str_dict = defaultdict(list)
        ord_a = ord('a')
        for s in strs:
            counts = [0] * 26
            for c in s:
                counts[ord(c) - ord_a] += 1
            str_dict[tuple(counts)].append(s)
        return list(str_dict.values())
        
`defaultdict` 需要传入一个**工厂函数**（callable）作为参数，用来生成默认值。

例如：
- `defaultdict(list)`：当 key 不存在时，自动调用 `list()` 生成空列表 `[]`
- `defaultdict(int)`：调用 `int()` 生成 `0`
- `defaultdict(set)`：调用 `set()` 生成空集合 `set()`
- `defaultdict(lambda: "默认值")`：自定义默认值

工厂函数会在访问不存在的 key 时被调用，生成的值会被存入字典，然后返回。
```