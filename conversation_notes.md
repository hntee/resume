# 对话记录

## 2026-03-21

### 主题
- 评估当前简历和项目对多模态 LLM 岗位的匹配度。
- 查看 `hunyuan_uni_captioner-swift` 仓库中的 branch。
- 重点分析 `origin/dev_th` 和 `origin/dev_xguai`。

### 结论摘要
- 当前简历对多模态 LLM 工业界算法/训练/数据方向岗位有较强匹配度，尤其是视频 caption、数据闭环、评测和多模态训练相关经历。
- `hunyuan_uni_captioner-swift` 当前本地分支为 `master`，远端存在多个分支，包括 `dev_th`、`dev_xguai` 等。
- `origin/dev_th` 更像基于 `ms-swift` 的训练/推理主线分支，包含较完整的训练框架和底层能力。
- `origin/dev_xguai` 更像围绕 caption / omni / multishot 的评测、推理、prompt、工具链和服务封装分支。
- `origin/dev_th` 和 `origin/dev_xguai` 不是前后继承关系，它们都直接从 `master` 的同一个基点 `517c367d9f61a484b7d21b4dd0e1d6ba7cbefa0b` 分出。

### 已确认信息
- `hunyuan_uni_captioner-swift` 是独立 git 仓库。
- 远端 `origin`:
  `https://git.woa.com/text2video/hunyuan_uni_captioner-swift.git`

### 分支信息
- 本地分支：
  `master`
- 远端分支：
  `origin/master`
  `origin/dev`
  `origin/dev_aiden`
  `origin/dev_aiden_cr`
  `origin/dev_aiden_cr1`
  `origin/dev_th`
  `origin/dev_th_data`
  `origin/dev_xguai`
  `origin/wyc`

### 分支职责判断
- `origin/dev_th`
  主要目录包括：
  `.dev_scripts`、`asset`、`dependence_package`、`docs`、`examples`、`qwen_omni_utils`、`qwen_vl_utils`、`requirements`、`scripts`、`scripts_for_caption`、`swift`、`tests`
- `origin/dev_xguai`
  主要目录包括：
  `eval`、`gradio`、`inference_scripts`、`llm-api`、`plugins`、`reward_functions`、`training_scripts`、`vllm_server`

### 关键观察
- `origin/dev_th` 的 README 基本是 `ms-swift` 官方/主仓风格，说明这条线偏框架底座和训练基础设施。
- `origin/dev_xguai` 中的 `llm-api/README.md` 和 `eval/eval_image_bench/README.md` 显示这条线偏 Gemini API 调用、多镜头 caption、图像/视频/omni benchmark 评测、推理脚本与 prompt 管理。

### 待继续
- 继续细看 `origin/dev_th` 的 `scripts_for_caption`、`qwen_omni_utils`、`qwen_vl_utils` 等目录。
- 继续细看 `origin/dev_xguai` 的 `training_scripts`、`reward_functions`、`plugins`、`inference_scripts` 的具体实现差异。

### 可写入简历的候选亮点
- 基于 Qwen3-Omni / ms-swift / Megatron 搭建视频 caption 训练与推理流程，覆盖 SFT、RLHF、单机/多机推理与评测。
- 设计多模态长序列训练方案，支持 18k+ sequence length，并结合预处理缓存降低视频抽帧、音频重采样带来的训练瓶颈。
- 构建多镜头视频 caption SFT 数据集，形成从 360w 视频池采样、Gemini 生成、多阶段过滤、OCR/ASR/overlay 注入到本地路径落盘的完整数据生产链路。
- 训练数据规模可写的硬数字：
  多镜头训练集约 20w；来源于两批各 10w 样本，从 360w 视频池按类目配额采样而来。
- 建设多维评测体系：
  QA 准确率评测覆盖 401 个视频、1349 道题；
  时间戳 IoU 评测覆盖字幕 80 条、音频 75 条；
  图像 / 视频 / multishot / audio / OCR-ASR / hallucination bench 均有脚本支持。
- 设计基于外部 vLLM server 的 QA reward 与 timestamp reward，用于 GRPO/RL 训练，支持多机 server 故障切换与容错评估。
- 统一 omni / vl / 3.5 系列推理入口，并补充 offline vLLM 方案、Gradio 页面、Gemini API 封装和 prompt 管理，提升实验与评测效率。

### `hunyuan_caption_pe` / `origin/leo2.0.general`
- 当前本地分支：
  `master`
- 远端分支：
  `origin/master`
  `origin/leo2.0.general`
- `origin/leo2.0.general` 是从 `master` 直接分出的独立主线，内容不是零散脚本，而是完整的视频 caption Prompt Engineering / pipeline 工具链。

### `hunyuan_caption_pe` 可写简历的点
- 负责视频 caption Prompt Engineering 工具链建设，搭建多阶段 pipeline，串联 preprocess、prescan、audio caption、主 caption、QA 修订与自动评测。
- 设计 caption 的多路信息融合方案，将 scene cuts、ASR、audio caption、Qwen keyframe、OCR 等信号统一注入主 caption 阶段，产出结构化 JSON 结果。
- 设计并落地 QA-driven 自修正流程（qa_generate → qa_answer → revise），让模型围绕已生成 caption 自动找错、核验并修订，提升 caption 的事实性和一致性。
- 参与音频链路优化：通过 qwen3-omni 语种检测 + Seed-ASR 指定语言重跑 + ASR prior 注入 audio caption，修复多语言场景下的语音转写与音频理解问题。
- 建设自动化评测与可视化分析流程，支持 GT-50 等评测集上的 QA 指标对比、HTML 报告生成和 tricky case 回归验证。

### 对简历的建议
- 这条线和现有 `Hunyuan Uni Captioner（视频 Caption / Omni Caption / 多镜头 Caption）` 是同一主线，建议作为该项目的补充亮点，而不是单独新增一个项目名。
- 原因：
  1. 它非常强，但主题仍然是视频 / omni caption 的 pipeline、prompt、QA 修订和评测闭环。
  2. 单独拆项目会让腾讯这段再次变碎。
  3. 合并后更能体现“从 caption schema、数据构造到 QA 修订、评测闭环”的端到端 ownership。

### 后续简历调整
- 删除了独立的 `Recaption` 项目名，因为它本质上属于早期视频 caption 阶段，对外名称不够清晰，且与后续 caption 主线重叠。
- 将腾讯主项目收敛为更外部化的项目名：
  `视频 Caption / Omni Caption / 多镜头 Caption 方案研发`
- 当前主线叙事：
  1. 早期做纯视频、无音频 caption
  2. 后续做带音频的多镜头 caption
  3. 最终收敛到统一的 caption / omni caption 方案
- 当前项目表述更偏“方案研发 + 数据/训练/评测闭环 + 规模化生产”，更适合偏落地的多模态 LLM 岗位。

### 面试追问高频点
- 为什么先做纯视频 caption，再做带音频的多镜头，再演进到统一的 omni caption？
- 你个人的 ownership 是什么：方案、schema、数据、训练、评测各占多少？
- 为什么要做统一 caption schema？它解决了什么问题？
- SFT 和 GRPO 分别解决什么问题？reward 大致怎么设计？
- 如何定义“音画一致”？如何评测？`80%+` 对应什么指标口径？
- VLM + Omni 与 Omni 直出如何取舍？依据是什么？
