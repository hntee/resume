# Nathan

- Phone: (+86) 13145859636
- Email: thatsaid@hotmail.com
- Headline: Multimodal LLM / Video Understanding Engineer

## Work Experience

### Tencent Technology (Shenzhen) Co., Ltd.
Algorithm Engineer (T10) | Shenzhen  
2022.03 - Present

**Project: Video and Multimodal Caption Solution Development**

- Led the continuous iteration of Hunyuan Video training data caption solutions, evolving from pure video without audio caption to audio-enhanced multi-shot caption, and then to unified caption / omni caption solutions, supporting T2V training data construction requirements.
- Developed single-video and multi-shot audio-visual consistency caption solutions, conducting technical validation and solution selection across VLM + Omni and Omni direct output approaches, driving the system upgrade from multi-expert model fusion to independent multimodal model end-to-end generation.
- Designed multi-shot caption schema and participated in unified caption format iteration; led multi-stage pipeline development, standardizing structured fields for visual, audio, subtitle/OCR, and temporal information. Addressed audio hallucination issues caused by subtitle interference by designing language detection + ASR prior injection audio pipeline, improving audio event description accuracy and audio-visual consistency.
- Responsible for training data construction, evaluation set building, and effect iteration, participated in SFT and GRPO training, and promoted the coordination of data production, model training, automated evaluation, and manual correction processes to form a continuous optimization loop; later versions produced hundreds of millions of video caption data, with accuracy reaching 80%+ across all metrics.

**Project: Multimodal Large Model Training**

- Participated in multimodal large model pre-training data preparation and second-stage training, responsible for partial image-text data acquisition, cleaning, and filtering, constructed and introduced 1 billion+ image-text pairs and mixed data, used CLIP to filter low-correlation samples.
- Participated in SFT data construction and training for VQA, Caption, Grounding, OCR tasks, supporting model capability improvement on multimodal downstream tasks.
- Results: After pre-training, zeroshot VQA accuracy reached 56.7%; after second-stage training, OCR pass rate 71%, Grounding accuracy 65%.

**Project: WeChat Ads Feature Optimization**

- Extracted user interest data related to official accounts as new features to improve advertising metrics. Generated official account ID and keyword features, where ID features used KL score for ranking, and keywords comprehensively weighed various weights from accounts to words, measuring whether official accounts reflect their users' interest in certain ad categories.
- Results: Completed multiple experiments with metric improvements across several scenarios; official account coarse ranking recall +0.88%, official account recall +1.41%.

### Shopee Singapore Private Limited
Recommendation Algorithm Engineer | Singapore  
2020.07 - 2022.03

**Project: Shopee "You May Also Like" Ranking Optimization**

- Responsible for product ranking optimization in the You May Also Like module on Shopee product pages, introduced multi-objective modeling around CTR * CR goals, and upgraded the model from MLP to MMOE, improving joint modeling capability for clicks and conversions.
- Results: Multi-objective per capita clicks +9.99%, per capita orders +4.80%; MMOE improved CTR * CR by 2.7% compared to multi-objective MLP.

**Project: Product and User Interest Clustering**

- Built product latent categories and interest clustering based on user click and search behavior, used Word2Vec + KMeans to generate user interest tags, ultimately covering 55% of total users.

### Xiaomi Technology Co., Ltd.
Algorithm Engineer | Beijing  
2018.06 - 2020.07

- Responsible for information feed push, audience recommendation, and tag mining algorithm work, using LightGBM, ESMM, fastText and other models to support delivery optimization and cold start scenarios, achieving stable performance improvements across multiple businesses.

## Education

**Wuhan University** | School of Computer Science | Master's Degree  
2015.09 - 2018.06

**Wuhan University** | School of Mathematics and Statistics | Bachelor's Degree  
2011.09 - 2015.06

## Skills

- **Multimodal LLM**: Experienced in video caption, omni caption, multi-shot caption data construction, SFT, GRPO training and effect optimization, familiar with the complete process from data production, model training to evaluation loop.
- **Training & Inference**: Familiar with multimodal model training and inference processes based on Deepspeed, Megatron, vLLM, understanding common optimization methods for long-sequence training, distributed parallelism, and reinforcement learning training.
- **Data & Evaluation**: Familiar with multimodal training data cleaning, structured schema design, evaluation set construction, and automated evaluation processes, experienced in evaluation design for content understanding, temporal localization, and audio-visual consistency.
- **Programming Languages**: Python, Scala, Java, Golang.
