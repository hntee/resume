<!--
 * @Author: thtan
 * @Date: 2026-04-25
 * @FilePath: /resume/qwen3_omni_training_guide.md
-->
# Qwen3 Omni 架构详解与项目训练全流程

> 本文档结合 Qwen3 Omni 官方架构与 Hunyuan Uni-Captioner 项目实际代码，系统梳理模型架构和训练过程。面试可用。

---

## 一、Qwen3 Omni 架构总览

### 1.1 定位：从纯 VL 到原生 Omni

Qwen3 Omni 是阿里 Qwen 团队推出的**原生全模态大模型**（30B 参数，3B 激活），核心思想是：**不再把音频当外挂补丁，而是把视觉、音频、文本统一放进同一套理解和生成链路**。

| 维度 | InternVL (旧版纯VL) | Qwen3 Omni (现版) |
|:-----|:---------------------|:-------------------|
| 架构本质 | Vision-Language | 统一多模态 (Omni) |
| 视频处理 | 抽帧 → 多图 patch | 完整视频流 |
| 音频处理 | 外部 ASR / 旁路输入 | **主干统一建模** |
| 融合方式 | Late Fusion (Projector) | **Early Fusion (共享 Attention)** |
| 时间对齐 | 无 | **TMRoPE** |
| 输出能力 | 纯文本 | 文本 + 语音 (Thinker-Talker) |
| 模型结构 | ViT → Projector → LLM | MoE + Thinker-Talker |

### 1.2 核心架构：Thinker-Talker

```
输入层
├── 视频帧序列
├── 音频流 (16kHz)
└── 文本 Prompt
      │
      ▼
┌─────────────────────────────────────┐
│         多模态前端编码                │
│                                      │
│  Vision Encoder    Audio Encoder     │
│  (继承 Qwen3-VL)   (AuT, 2000万h    │
│                     音频预训练)       │
└──────────┬──────────────┬────────────┘
           │              │
           ▼              ▼
┌─────────────────────────────────────┐
│     TMRoPE 时间对齐                  │
│   音频时间轴 ←→ 视频时间轴 同步       │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│     共享 Attention 融合层            │
│   视觉/音频/文本 token 统一交互       │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│      Thinker（思考者）               │
│  - MoE 架构 (30B参数, 3B激活)        │
│  - 动态路由: 数学→逻辑专家,          │
│    视听→多模态专家                   │
│  - 统一多模态推理 + 文本生成          │
└───────────┬─────────────┬───────────┘
            │             │
       文本输出       隐状态传递
                          │
                          ▼
┌─────────────────────────────────────┐
│      Talker（表达者）               │
│  - 多码本自回归语音 token 生成        │
│  - 轻量因果 ConvNet (非 Diffusion)   │
│  - 流式合成: 211ms 音频时延          │
│  - ARIA 自适应文本-语音对齐          │
└─────────────────────────────────────┘
```

### 1.3 四个核心技术点

#### 1.3.1 Thinker-Talker 解耦设计

- **Thinker** 是"大脑"：统一理解 + 推理 + 文本生成，MoE 架构动态分配算力
- **Talker** 是"嘴巴"：接 Thinker 隐状态，自回归生成语音 token
- **优势**：文本推理和语音生成解耦，但端到端联动
- **项目应用**：`ENABLE_AUDIO_OUTPUT=0` 关掉 Talker，只要文本输出（caption 场景不需要语音）

#### 1.3.2 TMRoPE（Time-aligned Multimodal RoPE）

- **核心问题**：音频的第 3 秒和视频的第 3 秒怎么对齐？
- **做法**：在 RoPE 位置编码上做多模态时间轴扩展，position ID 同时反映音频和视频的时间对应关系
- **效果**：解决"画面在 3 秒，语音也在 3 秒"的跨模态对位问题
- **项目应用**：`ADD_TIMESTAMP=true` 利用这个时间对齐能力生成带时间标注的 caption

#### 1.3.3 Audio Encoder (AuT)

- 替代 Whisper，用 **2000 万小时**音频数据预训练
- 直接输出音频特征给共享 Attention 层，不经过 ASR 文字中间表示
- 音频不再是"先转文字再拼接"，而是以原始特征参与多模态推理

#### 1.3.4 共享 Attention 融合

- **不是** late fusion（先各跑各的，最后拼特征）
- 视觉 token、音频 token、文本 token 在统一 attention 层里直接交互
- 这就是为什么它比"跑 ASR 再拼文本"效果更好 —— 是**原生 Omni**

### 1.4 官方训练流程

```
预训练三阶段:
  S1: Encoder 对齐     → 让视觉/音频编码器和 LLM 对齐
  S2: 全参数训练       → 端到端训练所有参数
  S3: 长上下文训练     → 逐步增加长音频/视频数据比例

后训练:
  Thinker 侧: 轻量 SFT → 蒸馏 (off-policy + on-policy) → GSPO 强化学习
  Talker 侧:  DPO 偏好优化 → 说话人风格调优
```

### 1.5 官方开源版本

| 模型 | 用途 |
|:-----|:-----|
| Qwen3-Omni-30B-A3B-Instruct | 交互任务优化 |
| Qwen3-Omni-30B-A3B-Thinking | 复杂推理增强 |
| Qwen3-Omni-30B-A3B-Captioner | 低幻觉音频描述 |

---

## 二、项目概述：Hunyuan Uni-Captioner

### 2.1 项目定位

为 Hunyuan Video (T2V) 训练数据构造提供 caption 方案。经历三代技术演进：

```
第一代: InternVL 纯 VL         → 只看画面，不听声音
第二代: VLM + 多专家融合        → 画面+ASR+音频多模型拼接
第三代: Qwen3 Omni 统一多模态  → 原生端到端音画 caption  ← 当前
```

### 2.2 项目架构

```
hunyuan_uni_captioner-swift/
├── qwen_omni_utils/           # 核心: 多模态输入处理 (音频/视频/图像)
│   └── v2_5/
│       ├── audio_process.py   # 音频抽取 (librosa 16kHz)
│       ├── vision_process.py  # 视频帧提取 (多后端)
│       └── __init__.py        # 统一入口: process_mm_info()
├── swift/                     # ML 训练框架 (Deepspeed + Megatron)
├── training_scripts/          # 训练脚本
│   └── qwen3_omni_scripts/
│       ├── sft_train/         # Stage 1: 监督微调
│       ├── offlineRL_train/   # Stage 2: DPO 离线强化
│       └── onlineRL_train/    # Stage 3: GRPO 在线强化
├── inference_scripts/         # vLLM 批量推理
├── eval/                      # 评测框架
├── reward_functions/          # GRPO 奖励函数
├── llm-api/                   # Gemini API 评测
├── vllm_server/               # 推理服务部署
└── gradio/                    # Web UI
```

### 2.3 核心工程创新：Audio-in-Video 显式接入

```python
# qwen_omni_utils/v2_5/audio_process.py
# 关键改造：遇到 type=video 时，显式从视频抽取音轨

elif use_audio_in_video and ele["type"] == "video":
    path = ele.get("video", ele.get("video_url"))
    assert _check_if_video_has_audio(path)   # av.open 检查音轨
    audios.append(
        librosa.load(data, sr=16000)[0]      # 16kHz 单声道加载
    )
```

**意义**：模型拿到的是真实音轨，而不是从画面"猜"音频。这让音画联合 caption 更准确。

---

## 三、训练全流程详解

### 3.0 数据准备

#### 数据处理管线

```
原始视频 → process_mm_info(conversations, use_audio_in_video=True)
               │
               ├── 视频处理 (vision_process.py)
               │   ├── 多后端: torchcodec > decord > torchvision
               │   ├── FPS=4, 最多 400 个视觉 token
               │   ├── 智能缩放: 最大像素 1,003,520
               │   └── 输出: TCHW tensor (uint8)
               │
               └── 音频处理 (audio_process.py)
                   ├── av.open 检查视频是否有音轨
                   ├── librosa 16kHz 单声道加载
                   ├── 支持时间裁剪 (audio_start, audio_end)
                   └── 输出: numpy array (16kHz mono)
```

#### 结构化 Caption Schema

```json
{
  "entities": [
    {"id": "<ID:1>", "type": "subject", "description": "一名穿蓝衣的男子"}
  ],
  "short_caption": "男子在厨房做饭",
  "long_caption": "一名穿蓝色围裙的男子站在灶台前...",
  "visual_events": [
    {
      "time_range": ["0.0", "5.0"],
      "short_description": "男子点火",
      "long_description": "男子(<ID:1>)打开燃气灶，蓝色火焰亮起..."
    }
  ],
  "audio_summary": "厨房环境音，偶有说话声",
  "audio_events": [
    {
      "time_range": ["1.0", "3.0"],
      "type": "dialogue",
      "description": "{今天做红烧肉} (成年男性, 普通话)"
    },
    {
      "time_range": ["2.0", "4.0"],
      "type": "sound_effect",
      "description": "<油锅滋滋作响>"
    }
  ],
  "overlay_events": [
    {
      "type": "subtitle",
      "time_range": ["1.0", "3.0"],
      "description": "\"今天做红烧肉\""
    }
  ],
  "environment": "室内厨房，暖色灯光",
  "style": "写实风格，手持拍摄",
  "atmosphere": "温馨家常"
}
```

音频标注规范：
- 对话: `{台词内容} (说话人特征)`
- 音效: `<声音描述>`
- 音乐: `(音乐风格描述)`
- 字幕/OCR: `"引用原文"`

---

### 3.1 Stage 1: SFT 监督微调

#### 训练配置

| 参数 | 值 |
|:-----|:---|
| 基座模型 | Qwen3-Omni-30B-A3B-Instruct |
| 训练框架 | Megatron-LM r0.15.0 + Swift |
| 数据集 | sft_v1_merged (中英双语 JSONL) |
| 最大序列长度 | 40,000 tokens |
| 学习率 | 1e-5, warmup 5%, min_lr 1e-7 |
| Batch Size | micro_bs=1, global_bs=128 |
| Epochs | 2 (或 10,000 iters) |
| 精度 | bf16 |
| Attention | Flash Attention |

#### 并行策略

```
tensor_parallel_size   = 4    # 张量并行
expert_parallel_size   = 4    # MoE 专家并行
pipeline_parallel_size = 1    # 流水线并行
sequence_parallel      = True # 序列并行
```

#### 冻结策略

```
freeze_llm     = False  # LLM 全参数微调
freeze_vit     = True   # 视觉编码器冻结（已充分预训练）
freeze_aligner = True   # 对齐层冻结
```

#### MoE 优化

```
moe_grouped_gemm         = True   # 分组矩阵乘加速
moe_shared_expert_overlap = True   # 共享专家计算重叠
moe_permute_fusion       = True   # 排列融合优化
moe_aux_loss_coeff       = 0.001  # 负载均衡辅助 loss
```

#### 多机启动流程

```
launch_megatron.sh
  │
  ├── 解析 NODE_IP_LIST，确定 Master / Workers
  ├── 设置 UNIFIED_TIMESTAMP 统一实验标识
  │
  ├── Master 节点 (Rank 0):
  │   nohup bash train_core.sh > master.log 2>&1 &
  │
  └── Worker 节点 (Rank 1...N):
      ssh -n -f $WORKER_IP "bash train_core.sh > worker_rankN.log 2>&1 &"

train_core.sh 内部:
  ├── Conda 环境激活
  ├── JIT 防死锁 (TORCH_EXTENSIONS_DIR=/tmp/...)
  ├── NCCL InfiniBand 配置 (bond1, mlx5 HCA)
  ├── 显存优化 (expandable_segments)
  └── megatron sft --model ... --dataset ...
```

---

### 3.2 Stage 2: Offline RL — DPO 离线偏好优化

#### 训练配置

| 参数 | 值 |
|:-----|:---|
| 基座模型 | SFT checkpoint-4140 |
| 训练框架 | DeepSpeed ZeRO-3 + Swift RLHF |
| 方法 | DPO (Direct Preference Optimization) |
| 数据集 | dpo_v6 (正负样本对, 中英双语) |
| Epochs | 10 |
| 学习率 | 1e-5 |
| 最大长度 | 20,480 tokens |

#### Loss 设计 (三合一)

```python
loss_type    = "sigmoid" + "bco_pair" + "sft"
loss_weights = [1.0, 1.0, 1.0]

# sigmoid: 标准 DPO loss (正样本概率 > 负样本概率)
# bco_pair: Binary Classifier Optimization (二分类辅助)
# sft:      SFT 正则化 (防止偏离太远)
```

#### DPO 数据构造

```
对每条视频:
  ├── chosen (正样本):  高质量 caption (人工审核 or 高分)
  └── rejected (负样本): 低质量 caption (含幻觉 / 时间错误 / 音画不一致)
```

---

### 3.3 Stage 3: Online RL — GRPO 在线强化学习

这是训练流程中最精彩的部分。

#### 训练配置

| 参数 | 值 |
|:-----|:---|
| 基座模型 | SFT checkpoint-4140 |
| 训练框架 | Megatron + vLLM (colocate 模式) |
| 方法 | GRPO (Generative Reward-driven Policy Optimization) |
| 数据集 | rl_v1 (9,600 条, 排除纯对话) |
| Epochs | 3 |
| 学习率 | 1e-6 |
| 推理引擎 | vLLM (TP=4, GPU利用率 50%) |

#### GRPO 核心参数

```
num_generations        = 8        # 每条数据采样 8 个回复
steps_per_generation   = 2        # 每次采样训练 2 步
global_batch_size      = 8
temperature            = 1.0      # 采样温度
max_completion_length  = 3,000    # 最大生成长度
epsilon                = 3e-4     # clip 下界
epsilon_high           = 4e-4     # clip 上界
beta                   = 0.0      # 无 KL 惩罚
```

#### 双信号奖励函数

```
reward = 1.0 * qa_reward + 1.0 * timestamp_reward
```

**QA Reward (`qa_rewards.py`)**:
```
模型生成 caption
    ↓
构造 QA 选择题 (视觉/音频相关)
    ↓
发给外部 Qwen3-32B vLLM 服务
    ↓
Qwen3-32B 基于 caption 内容回答选择题
    ↓
对比标准答案:
  答对 → 1.0
  不确定(E) → 0.0 (可配置)
  答错 → 0.0

支持的 QA 类型:
  - visual_dynamic:   动态视觉事件理解
  - visual_static:    静态视觉属性理解
  - acoustic_event:   音频事件理解
  - acoustic_property: 音频属性理解
```

**Timestamp Reward (`timestamp_rewards_new.py`)**:
```
模型生成 caption (含时间标注)
    ↓
解析 JSON 中的 visual_events / audio_events / overlay_events
    ↓
发给外部 Qwen3-32B vLLM 服务
    ↓
Qwen3-32B 做语义匹配，定位目标内容的时间段
    ↓
计算 IoU (交并比) 作为奖励:
  IoU = 交集时长 / 并集时长

支持的时间定位类型:
  - subtitle:  字幕时间定位
  - behavior:  行为动作时间定位
  - dialogue:  对话时间定位 (含 ASR 容错)
```

#### GRPO 训练循环

```
┌──────────────────────────────────────────────┐
│               GRPO 训练循环                    │
│                                               │
│  ① 采样                                       │
│     vLLM 对每条数据生成 8 个 caption            │
│                                               │
│  ② 打分                                       │
│     QA Reward:        评估内容准确性            │
│     Timestamp Reward: 评估时间标注准确性        │
│     → 每个 caption 得到综合 reward              │
│                                               │
│  ③ 对比                                       │
│     8 个回复按 reward 排序                     │
│     高分回复被强化，低分回复被抑制              │
│                                               │
│  ④ 更新                                       │
│     用 GRPO loss 更新模型参数                  │
│     beta=0.0, 无 KL 惩罚 → 大胆探索           │
│                                               │
│  ⑤ 重复 → 逐步提升 caption 质量               │
└──────────────────────────────────────────────┘
```

---

### 3.4 Stage 4: 推理与评测闭环

#### 推理配置 (vLLM)

```python
# inference_scripts/vl_infer/auto_infer_omni.py

llm = LLM(
    model=model_path,
    max_model_len=20480,
    limit_mm_per_prompt={"audio": 1, "video": 1},
    tensor_parallel_size=4,
)

# 核心: 视频 + 音频一起送进 vLLM
audios, images, videos = process_mm_info(messages, use_audio_in_video=True)

inputs = {
    'prompt': text,
    'multi_modal_data': {
        'video': videos,
        'audio': audios,     # 真实音轨，不是推断的
        'image': images,
    },
    'mm_processor_kwargs': {
        'use_audio_in_video': True,
    }
}

# 推理参数
sampling_params = SamplingParams(
    temperature=0.6, top_p=0.95, top_k=20,
    max_tokens=16384, seed=50,
)
# batch_size=64, 并行预处理 64 workers
```

#### 评测体系

```
自动评测 (Gemini API + 自定义指标)
├── 音画一致性:    音频描述是否匹配视觉内容
├── VQA 准确率:    基于 caption 的问答正确率
├── 时间定位 IoU:  行为/字幕/对话 时间标注精度
├── 幻觉检测:      是否生成了视频中不存在的内容
├── OCR 准确率:    视频内文字检测率
└── Grounding:     物体定位准确率
```

#### 持续优化闭环

```
模型推理 → 自动评测 → 指标分析
                        │
                  ┌─────┴─────┐
                  ↓           ↓
             发现问题     达标通过
                  │           │
                  ↓           ↓
             人工修正    产出数据
                  │           │
                  ↓           ↓
           数据回灌训练   数亿级 caption
                  │       (80%+ 准确率)
                  ↓
              下一轮迭代
```

---

## 四、关键技术栈

| 层面 | 技术 |
|:-----|:-----|
| 训练框架 | Megatron-LM r0.15.0 + Swift + DeepSpeed |
| 推理引擎 | vLLM (KV Cache, Paging, TP) |
| 音频处理 | librosa (16kHz), PyAV (音轨检测) |
| 视频处理 | torchcodec / decord / torchvision |
| 评测 | Gemini API, Qwen3-32B (外部 Judge) |
| 实验追踪 | WandB |
| 部署 | vLLM Server (OpenAI 兼容 API), Gradio |

---

## 五、面试口语版

> 之前我们纯 VL 版本主要是用 InternVL 来训练，本质上是视觉编码器加语言模型，视频更多还是通过抽帧的方式去理解，音频并不是主干统一建模的一部分。
>
> 后来切到 Qwen Omni 后，结构上最大的变化是它本身就是统一多模态架构，视频、音频和文本可以在同一套理解链路里融合。官方这套里比较关键的是 Thinker-Talker 设计，以及用 TMRoPE 去对齐音频和视频时间轴。
>
> 我们本地又做了一层接入改造，在 `qwen_omni_utils` 里把视频里的音轨显式抽出来，并和视频一起送进推理链路，所以它对有声视频 caption 更自然，也更适合后面的音频理解和 revise。
>
> 训练方面，我们先做 SFT 用 Megatron 多机多卡全参数微调，冻住 ViT 和 Aligner 只训 LLM。然后做 DPO 偏好优化，最后用 GRPO 在线强化学习——奖励函数是 QA accuracy 加 Timestamp IoU 双信号，用外部 Qwen3-32B 当 judge。
>
> 最终累计产出数亿级 caption 数据，各项指标准确率 80% 以上。

---

## 六、参考来源

- 官方论文: [Qwen3-Omni Technical Report](https://arxiv.org/html/2509.17765v1)
- GitHub: [github.com/QwenLM/Qwen3-Omni](https://github.com/QwenLM/Qwen3-Omni)
- HuggingFace: [Transformers Qwen3-Omni](https://huggingface.co/docs/transformers/model_doc/qwen3_omni_moe)
- 项目代码: `hunyuan_uni_captioner-swift/`
  - 音频抽取: `qwen_omni_utils/v2_5/audio_process.py`
  - 视频处理: `qwen_omni_utils/v2_5/vision_process.py`
  - SFT 训练: `training_scripts/qwen3_omni_scripts/sft_train/train_core.sh`
  - DPO 训练: `training_scripts/qwen3_omni_scripts/offlineRL_train/deepspeed_mpo_full.sh`
  - GRPO 训练: `training_scripts/qwen3_omni_scripts/onlineRL_train/train_core.sh`
  - 推理代码: `inference_scripts/vl_infer/auto_infer_omni.py`
  - QA 奖励: `reward_functions/qa_rewards.py`
  - 时间奖励: `reward_functions/timestamp_rewards_new.py`
