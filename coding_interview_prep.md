# Coding 面试准备

这份文档单独整理面试里可能会遇到的 coding 题。

目标不是刷竞赛题，而是准备更贴近你背景的几类题：
- 工程实用题
- 数据处理题
- 区间 / 时间戳题
- 并发 / 批处理题
- 少量大模型基础手写题

建议优先级：
1. 区间类 + JSONL 处理类
2. 并发任务池 + 失败重试
3. Top K / LRU 这类基础题
4. attention / mask / KV cache 这类模型基础题

---

## 一、面试官大概率会怎么出题

如果岗位偏大模型算法工程，而不是纯算法岗，coding 题通常有三种风格：

### 1. 工程实用题
- 处理 JSONL
- 合并字段
- 断点续跑
- 并发任务池
- 失败重试

### 2. 基础算法题
- 区间合并
- Top K 高频元素
- LRU Cache
- 二叉树 / 链表 / 滑窗这种 LeetCode 基础题

### 3. 模型基础题
- 手写 attention
- causal mask
- shape 推导
- KV cache 原理

对你来说，最值得优先准备的是前两类，因为它们和你真实经历最贴近，也最容易讲出工程感。

---

## 二、必须准备的 12 道题

### 1. 合并重叠区间

题目：
给定一组区间，合并所有重叠区间。

为什么高频：
- 和时间戳、镜头、字幕片段、ASR 对齐都很像

标准思路：
- 先按左端点排序
- 维护结果数组
- 如果当前区间和最后一个结果区间重叠，就合并
- 否则直接加入

Python 示例：

```python
def merge_intervals(intervals):
    if not intervals:
        return []
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        last_start, last_end = merged[-1]
        if start <= last_end:
            merged[-1][1] = max(last_end, end)
        else:
            merged.append([start, end])
    return merged
```

复杂度：
- 时间 `O(n log n)`
- 空间 `O(n)`

面试延伸：
- 怎么合并字幕时间段
- 怎么保留原始 index
- 如果区间是半开区间怎么处理

---

### 2. 计算区间 IoU

题目：
给定两个时间区间，计算它们的 IoU。

标准思路：
- 交集长度 = `max(0, min(r1, r2) - max(l1, l2))`
- 并集长度 = 总长度 - 交集
- `IoU = inter / union`

Python 示例：

```python
def interval_iou(a, b):
    l1, r1 = a
    l2, r2 = b
    inter = max(0, min(r1, r2) - max(l1, l2))
    union = (r1 - l1) + (r2 - l2) - inter
    return 0.0 if union == 0 else inter / union
```

为什么要会：
- 和你的 timestamp eval 非常贴近

---

### 3. 解析 JSONL，过滤后重写输出

题目：
读取一个 JSONL 文件，只保留满足条件的记录，并写入新文件。

标准思路：
- 逐行读，避免一次性加载大文件
- `json.loads`
- 判断条件
- 满足条件就 `json.dumps` 写出

Python 示例：

```python
import json


def filter_jsonl(input_path, output_path):
    with open(input_path, "r", encoding="utf-8") as fin, open(output_path, "w", encoding="utf-8") as fout:
        for line in fin:
            item = json.loads(line)
            if item.get("score", 0) >= 0.8:
                fout.write(json.dumps(item, ensure_ascii=False) + "\n")
```

延伸点：
- 如何做断点续跑
- 如何做异常行容错
- 如何记录处理进度

---

### 4. 超大 JSONL 去重

题目：
对超大 JSONL 文件按 `video_id` 去重。

标准思路：
- 如果数据量可承受：用 `set`
- 如果太大：分桶、外排或数据库

简单版：

```python
import json


def dedup_jsonl(input_path, output_path, key="video_id"):
    seen = set()
    with open(input_path, "r", encoding="utf-8") as fin, open(output_path, "w", encoding="utf-8") as fout:
        for line in fin:
            item = json.loads(line)
            value = item.get(key)
            if value in seen:
                continue
            seen.add(value)
            fout.write(json.dumps(item, ensure_ascii=False) + "\n")
```

面试里更好的补充：
- 如果内存不够，就按 hash 分桶
- 每个桶单独去重，再合并

---

### 5. 多源字段 join

题目：
有两个 JSONL，一个是 caption 结果，一个是 meta 信息，按 `video_id` 合并。

标准思路：
- 先把小表读成 dict
- 再扫大表做 merge

```python
import json


def join_jsonl(meta_path, pred_path, output_path):
    meta_map = {}
    with open(meta_path, "r", encoding="utf-8") as f:
        for line in f:
            item = json.loads(line)
            meta_map[item["video_id"]] = item

    with open(pred_path, "r", encoding="utf-8") as fin, open(output_path, "w", encoding="utf-8") as fout:
        for line in fin:
            item = json.loads(line)
            merged = {**meta_map.get(item["video_id"], {}), **item}
            fout.write(json.dumps(merged, ensure_ascii=False) + "\n")
```

延伸点：
- key 不存在怎么处理
- 冲突字段保留谁
- 大表和大表 join 怎么做

---

### 6. 支持重试的批处理器

题目：
实现一个批处理器，失败后可重试，成功结果落盘。

核心点：
- 幂等
- 失败重试
- 进度落盘
- 支持恢复

参考实现：

```python
import json
import time


def process_one(item):
    if item["id"] % 5 == 0:
        raise RuntimeError("temporary error")
    return {"id": item["id"], "result": item["id"] * 2}


def run_batch(items, output_path, max_retry=3):
    with open(output_path, "a", encoding="utf-8") as fout:
        for item in items:
            for attempt in range(max_retry):
                try:
                    result = process_one(item)
                    fout.write(json.dumps(result, ensure_ascii=False) + "\n")
                    break
                except Exception:
                    if attempt == max_retry - 1:
                        err = {"id": item["id"], "error": "failed"}
                        fout.write(json.dumps(err, ensure_ascii=False) + "\n")
                    else:
                        time.sleep(1)
```

面试里一定要主动补充：
- 成功结果立即落盘
- 失败不要阻塞整批
- 最好区分结果文件和错误文件

---

### 7. 任务池并发控制

题目：
如何并发处理很多视频任务，但避免把下游 API 打挂？

核心回答：
- 用线程池或进程池
- 控制最大并发
- 每个任务独立重试
- 结果及时写盘
- 必要时加 rate limit

示例：

```python
from concurrent.futures import ThreadPoolExecutor, as_completed


def process_task(x):
    return x * x


def run_parallel(tasks, max_workers=5):
    results = []
    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        futures = [ex.submit(process_task, t) for t in tasks]
        for f in as_completed(futures):
            results.append(f.result())
    return results
```

面试延伸：
- IO 密集为什么线程池可以
- CPU 密集为什么可能要进程池
- 如何限流

---

### 8. Top K 高频元素

题目：
返回数组中出现频率最高的 K 个元素。

标准思路：
- `Counter`
- 堆或排序

```python
from collections import Counter


def top_k(nums, k):
    counter = Counter(nums)
    return [x for x, _ in counter.most_common(k)]
```

这是保底题，必须会。

---

### 9. LRU Cache

题目：
设计一个支持 `get` 和 `put` 的 LRU Cache。

面试里你至少要知道：
- 哈希表 + 双向链表
- `get/put` 都要 `O(1)`

如果现场要求写 Python，可以用 `OrderedDict` 快速写：

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

### 10. 手写 causal mask

题目：
写一个自回归 attention 用的下三角 mask。

```python
import torch


def causal_mask(seq_len):
    return torch.tril(torch.ones(seq_len, seq_len))
```

延伸点：
- shape 怎么 broadcast 到 `(B, H, T, T)`
- 为什么 decode 时必须用 causal mask

---

### 11. 手写 scaled dot-product attention

题目：
写 attention 核心计算。

```python
import math
import torch


def attention(q, k, v, mask=None):
    scores = torch.matmul(q, k.transpose(-2, -1)) / math.sqrt(q.size(-1))
    if mask is not None:
        scores = scores.masked_fill(mask == 0, float("-inf"))
    weights = torch.softmax(scores, dim=-1)
    return torch.matmul(weights, v)
```

必须知道：
- 为什么除 `sqrt(d)`
- score shape 是什么
- mask 加在哪里

---

### 12. 给结构化 caption 提取所有带时间信息的事件

题目：
给一段 JSON 结构，提取 `visual_events / audio_events / overlay_events` 中所有有 `time_range` 的条目。

```python
def collect_events(data):
    out = []
    for key in ["visual_events", "audio_events", "overlay_events"]:
        for event in data.get(key, []):
            if "time_range" in event:
                out.append({
                    "type": key,
                    "time_range": event["time_range"],
                    "event": event,
                })
    return out
```

这类题和你的项目背景非常贴近，值得优先准备。

---

## 三、最值得额外准备的 5 个追问

### 1. 为什么你这个题目会这么设计？

不要只给代码。要主动说：
- 数据规模多大
- 时间复杂度
- 空间复杂度
- 如果数据更大怎么办

### 2. 如果线上会失败怎么办？

要主动补：
- 重试
- 超时
- 限流
- 落盘
- 幂等

### 3. 如果内存不够怎么办？

要主动补：
- 流式读取
- 分桶
- 外排序
- 数据库 / KV

### 4. 如果结果不稳定怎么办？

要主动补：
- 固定随机种子
- 保留日志
- 结果回放
- 样本级 debug

### 5. 如果让我现场写 attention，我该重点说什么？

要主动补：
- shape
- mask
- 缩放
- softmax
- 输出维度

---

## 四、面试时的答题策略

### 1. 工程题优先讲完整链路

比如：
- 输入是什么
- 输出是什么
- 核心数据结构是什么
- 异常怎么处理

### 2. 算法题优先讲复杂度

至少要补一句：
- 时间复杂度是多少
- 空间复杂度是多少

### 3. 模型题优先讲 shape 和动机

比如 attention，不要只写代码，要讲：
- 为什么这样算
- 每一步 shape 是什么
- 为什么要 mask

### 4. 不会最优解时先给可行解

不要卡住。先写：
- 正确版本
- 再补优化版本

---

## 五、推荐你重点刷的顺序

第一梯队：
- 合并区间
- 区间 IoU
- JSONL 过滤 / join / 去重
- 支持重试的批处理器
- 并发任务池

第二梯队：
- Top K 高频元素
- LRU Cache
- causal mask
- scaled dot-product attention

第三梯队：
- 多头注意力完整实现
- 复杂并发系统设计
- 外排序 / 大文件处理

---

## 六、最后提醒

对你来说，coding 面试最重要的不是“卷最难题”，而是：
- 工程题要稳
- 区间题要快
- attention 基础题要能讲清楚

只要这三类稳住，已经比很多偏大模型岗位候选人更有竞争力。
