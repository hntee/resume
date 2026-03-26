# 高频算法题与答案

这份文档只整理你最值得优先准备的高频题。

原则：
- 先高频，再难度
- 先你最容易被问到的，再刷冷门
- 每道题给出：题意、思路、代码、追问点

---

## 1. 反转链表

题意：
给定链表头节点，反转整个链表。

思路：
- 维护 `prev`、`cur`
- 逐个改指针方向

代码：

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


def reverse_list(head):
    prev = None
    cur = head
    while cur:
        nxt = cur.next
        cur.next = prev
        prev = cur
        cur = nxt
    return prev
```

复杂度：
- 时间 `O(n)`
- 空间 `O(1)`

追问：
- 递归怎么写
- 反转前 `k` 个节点怎么做

---

## 2. 合并两个有序链表

思路：
- 双指针
- dummy node

```python
def merge_two_lists(l1, l2):
    dummy = ListNode()
    cur = dummy
    while l1 and l2:
        if l1.val < l2.val:
            cur.next = l1
            l1 = l1.next
        else:
            cur.next = l2
            l2 = l2.next
        cur = cur.next
    cur.next = l1 if l1 else l2
    return dummy.next
```

---

## 3. 合并 K 个升序链表

思路：
- 最优解：最小堆
- 堆里存每个链表当前节点

```python
import heapq


def merge_k_lists(lists):
    heap = []
    for i, node in enumerate(lists):
        if node:
            heapq.heappush(heap, (node.val, i, node))

    dummy = ListNode()
    cur = dummy

    while heap:
        _, i, node = heapq.heappop(heap)
        cur.next = node
        cur = cur.next
        if node.next:
            heapq.heappush(heap, (node.next.val, i, node.next))

    return dummy.next
```

复杂度：
- 时间 `O(N log k)`
- 空间 `O(k)`

---

## 4. 二叉树中序遍历（非递归）

思路：
- 栈
- 一路向左压栈

```python
def inorder_traversal(root):
    stack = []
    res = []
    cur = root
    while stack or cur:
        while cur:
            stack.append(cur)
            cur = cur.left
        cur = stack.pop()
        res.append(cur.val)
        cur = cur.right
    return res
```

---

## 5. 编辑距离

题意：
把字符串 `word1` 变成 `word2` 的最少操作数。

思路：
- `dp[i][j]` 表示 `word1[:i]` 变成 `word2[:j]` 的最小代价
- 三种操作：插入、删除、替换

```python
def min_distance(word1, word2):
    m, n = len(word1), len(word2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if word1[i - 1] == word2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] + 1
                )
    return dp[m][n]
```

复杂度：
- 时间 `O(mn)`
- 空间 `O(mn)`

---

## 6. 最长公共子序列

思路：
- `dp[i][j]` 表示前缀的 LCS 长度

```python
def lcs(text1, text2):
    m, n = len(text1), len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if text1[i - 1] == text2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[m][n]
```

---

## 7. 零钱兑换

思路：
- 完全背包
- `dp[x]` 表示凑成金额 `x` 的最少硬币数

```python
def coin_change(coins, amount):
    INF = amount + 1
    dp = [INF] * (amount + 1)
    dp[0] = 0
    for coin in coins:
        for x in range(coin, amount + 1):
            dp[x] = min(dp[x], dp[x - coin] + 1)
    return -1 if dp[amount] == INF else dp[amount]
```

---

## 8. 岛屿数量

思路：
- DFS 或 BFS
- 遇到陆地就扩散并标记

```python
def num_islands(grid):
    if not grid:
        return 0
    m, n = len(grid), len(grid[0])

    def dfs(i, j):
        if i < 0 or i >= m or j < 0 or j >= n or grid[i][j] != "1":
            return
        grid[i][j] = "0"
        dfs(i + 1, j)
        dfs(i - 1, j)
        dfs(i, j + 1)
        dfs(i, j - 1)

    ans = 0
    for i in range(m):
        for j in range(n):
            if grid[i][j] == "1":
                ans += 1
                dfs(i, j)
    return ans
```

---

## 9. 排序数组中查找元素

思路：
- 标准二分

```python
def binary_search(nums, target):
    l, r = 0, len(nums) - 1
    while l <= r:
        mid = (l + r) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            l = mid + 1
        else:
            r = mid - 1
    return -1
```

---

## 10. 第 k 个缺失的数字

题意：
给定严格递增数组，找相对于自然连续序列缺失的第 k 个数。

核心思路：
- 某位置前缺失了多少个数是可二分的
- `missing(i) = nums[i] - nums[0] - i`

```python
def missing_element(nums, k):
    def missing(i):
        return nums[i] - nums[0] - i

    n = len(nums)
    if k > missing(n - 1):
        return nums[-1] + k - missing(n - 1)

    l, r = 0, n - 1
    while l < r:
        mid = (l + r) // 2
        if missing(mid) < k:
            l = mid + 1
        else:
            r = mid
    return nums[l - 1] + k - missing(l - 1)
```

---

## 11. 接雨水

思路：
- 双指针
- 维护左右最大值

```python
def trap(height):
    l, r = 0, len(height) - 1
    left_max = right_max = 0
    ans = 0
    while l < r:
        if height[l] < height[r]:
            left_max = max(left_max, height[l])
            ans += left_max - height[l]
            l += 1
        else:
            right_max = max(right_max, height[r])
            ans += right_max - height[r]
            r -= 1
    return ans
```

---

## 12. rand7 实现 rand10

思路：
- 用 rejection sampling
- 先构造 `1..49`
- 只取前 `40`

```python
def rand7():
    pass


def rand10():
    while True:
        num = (rand7() - 1) * 7 + rand7()  # 1..49
        if num <= 40:
            return (num - 1) % 10 + 1
```

---

## 13. self attention / scaled dot-product attention

思路：
- `QK^T / sqrt(d)`
- 加 mask
- softmax
- 乘 V

```python
import math
import torch


def scaled_dot_product_attention(q, k, v, mask=None):
    scores = torch.matmul(q, k.transpose(-2, -1)) / math.sqrt(q.size(-1))
    if mask is not None:
        scores = scores.masked_fill(mask == 0, float("-inf"))
    weights = torch.softmax(scores, dim=-1)
    return torch.matmul(weights, v)
```

必须会讲：
- 为什么除 `sqrt(d)`
- mask 放在哪
- 输出 shape

---

## 14. Top K 高频元素

```python
from collections import Counter


def top_k(nums, k):
    return [x for x, _ in Counter(nums).most_common(k)]
```

---

## 15. LRU Cache

```python
from collections import OrderedDict


class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key):
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)
```

---

## 16. threshold 子集计数（回溯思路）

题意：
输入一个列表和 threshold，找满足 `max + min <= threshold` 的子列表个数。

思路：
- 如果规模小，可以回溯枚举
- 维护当前路径的最小值和最大值
- 超过阈值及时剪枝

这种题面试更重要的是讲思路，不一定非要写最优解。

---

## 17. 字符串去重

题意：
`ABBCC => A`, `ACCD => AD`

思路：
- 相邻相同字符消掉
- 常见做法：栈

```python
def remove_adjacent_duplicates(s):
    stack = []
    for ch in s:
        if stack and stack[-1] == ch:
            while stack and stack[-1] == ch:
                stack.pop()
        else:
            stack.append(ch)
    return "".join(stack)
```

如果面试官要求严格按题意，有可能要进一步细化规则，你要先确认题目到底是“保留一份”还是“全部删除”。

---

## 18. Python 基础高频问法

这不是 LeetCode，但在 AIGC / 多模态岗位里也会直接问。

### 1. 生成器是什么？

简答：
- 惰性生成数据
- 用 `yield`
- 节省内存

### 2. 迭代器是什么？

简答：
- 实现了 `__iter__` 和 `__next__`
- 可以被 `for` 循环消费

### 3. 装饰器是什么？

简答：
- 本质是函数包装函数
- 常用来做日志、权限、缓存

---

## 19. 开放题模板

### 1. 妆容迁移怎么做？

回答模板：
1. 定义输入输出
2. 数据准备
3. 关键特征建模
4. 生成或编辑模型
5. 评测指标

### 2. 汽车智能对话机器人怎么做？

回答模板：
1. 场景拆分
2. ASR / NLU / 检索 / 对话管理 / TTS
3. 安全策略
4. 数据闭环
5. 线上评估

---

## 20. 最后建议

对你来说，最值得优先写熟的是：
- 反转链表
- 合并 K 个升序链表
- 编辑距离
- LCS
- 零钱兑换
- 岛屿数量
- 排序数组查找
- 第 k 个缺失数字
- 接雨水
- self attention

如果这 10 道题你都能稳定口述 + 手写，你已经覆盖掉大部分高频风险点了。
