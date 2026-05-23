# 位置编码是什么

在 Transformer 里，token embedding 负责表示“这个 token 是什么”，位置编码负责表示“这个 token 在哪里”。

如果没有位置信息，模型很难区分：

```text
猫 追 狗
狗 追 猫
```

这两句话包含的 token 很像，但顺序不同，意思也完全不同。

因此，进入模型的向量通常会同时包含两部分：

```math
x_{pos} = e_{token} + p_{pos}
```

其中：

```text
e_token：token embedding，表示 token 本身
p_pos：position encoding，表示当前位置
x_pos：最终送入模型的输入向量
```

## 最经典的做法：sinusoidal positional encoding

在《Attention Is All You Need》中，作者使用了一种固定的正弦/余弦位置编码，也叫 sinusoidal positional encoding。

它不是训练出来的一张表，而是通过公式直接生成。

对于位置 $pos$ 和向量维度 $i$，位置编码定义为：

```math
PE(pos, 2i) = \sin\left(\frac{pos}{10000^{2i / d_{model}}}\right)
```

```math
PE(pos, 2i + 1) = \cos\left(\frac{pos}{10000^{2i / d_{model}}}\right)
```

其中：

```text
pos：token 在序列中的位置，例如 0、1、2、3
i：维度索引
d_model：模型向量维度
```

也就是说：

```text
偶数维使用 sin
奇数维使用 cos
```

## 为什么要分成 sin 和 cos

sin 和 cos 都是周期函数。它们会随着位置变化而规律变化。

一个位置向量可以粗略想象成这样：

```text
位置 pos 的向量 =
[
  sin(pos / 某个尺度),
  cos(pos / 某个尺度),
  sin(pos / 另一个尺度),
  cos(pos / 另一个尺度),
  ...
]
```

不同维度使用不同尺度。有些维度变化快，有些维度变化慢。

这样做有两个直观好处：

1. 每个位置会得到不同的位置向量。
2. 位置之间的相对距离会形成有规律的模式。

## 一个简化例子

假设位置向量只有 4 维，那么它可能长得像：

```text
pos = 0 -> [sin(0/a), cos(0/a), sin(0/b), cos(0/b)]
pos = 1 -> [sin(1/a), cos(1/a), sin(1/b), cos(1/b)]
pos = 2 -> [sin(2/a), cos(2/a), sin(2/b), cos(2/b)]
```

其中 $a$、$b$ 是不同的尺度。

因为每个位置的数值组合不同，模型就能区分第 0 位、第 1 位、第 2 位。

## 为什么能表达相对位置

正弦/余弦函数有一个重要性质：位置移动固定距离时，编码之间的关系也会呈现稳定规律。

比如位置 $pos$ 和位置 $pos + k$ 之间的关系，不是完全随机的。它们由同一组 sin/cos 函数生成，因此模型有机会学到类似：

```text
当前位置前一个 token
当前位置后两个 token
相隔 5 个位置的 token
```

这样的相对距离关系。

这也是论文作者选择 sinusoidal positional encoding 的一个重要原因：它不仅能标识绝对位置，也有助于模型学习相对位置模式。

## 和可学习位置 embedding 的区别

除了固定公式生成的位置编码，还有一种常见做法是可学习位置 embedding。

可学习位置 embedding 和 token embedding 很像，也是一张表：

```text
位置 0 -> 一个可训练向量
位置 1 -> 一个可训练向量
位置 2 -> 一个可训练向量
...
```

训练开始时，这些位置向量通常是随机初始化的；训练过程中，它们会和模型其他参数一起更新。

两者可以简单对比：

```text
固定位置编码：用公式生成，不需要训练。
可学习位置 embedding：用参数表表示，需要训练。
```

固定位置编码的好处是规则明确，也可能更容易泛化到比训练时更长的位置；可学习位置 embedding 的好处是更灵活，可以让模型自己学习位置表示。

## RoPE 和现代模型

很多现代大语言模型不再使用最原始的“直接相加”的位置编码，而是使用 RoPE 等方法。

RoPE 的全称是 Rotary Position Embedding，也就是旋转位置编码。

它的核心思想不是简单把位置向量加到 token embedding 上，而是根据 token 所在的位置，对向量做一次“旋转”。

可以先用二维向量来直观理解。假设某个 token 的一小段向量是：

```text
[x, y]
```

RoPE 会根据当前位置 $pos$，把它旋转一个角度：

```text
位置越靠后，旋转角度越大。
```

二维旋转可以写成：

```math
\begin{bmatrix}
x' \\
y'
\end{bmatrix}
=
\begin{bmatrix}
\cos\theta & -\sin\theta \\
\sin\theta & \cos\theta
\end{bmatrix}
\begin{bmatrix}
x \\
y
\end{bmatrix}
```

其中 $\theta$ 和位置有关。

真实模型里的向量维度很高，RoPE 会把高维向量两两分组，对每一组做类似的旋转。不同维度组使用不同的旋转速度。

可以粗略理解成：

```text
第 0 个位置：几乎不旋转
第 1 个位置：旋转一点
第 2 个位置：再多旋转一点
第 10 个位置：旋转更多
```

这样一来，同一个 token 出现在不同位置时，它参与 attention 计算的向量方向就不同。

### RoPE 作用在哪里

在 Transformer 的 attention 里，模型会把 hidden state 变成几类向量，其中最重要的是 Query 和 Key。

RoPE 通常作用在 Query 和 Key 上：

```text
原始 Query / Key
-> 根据位置做旋转
-> 再参与 attention 计算
```

也就是说，RoPE 不是直接改变 token embedding 本身，而是在模型计算 token 之间关系时，把位置信息注入进去。

### 为什么 RoPE 更适合表达相对位置

RoPE 的一个重要特点是：两个位置之间的 attention 关系，会自然包含它们的相对距离。

比如有两个 token：

```text
位置 m 的 token A
位置 n 的 token B
```

它们分别按照自己的位置做旋转。随后在 attention 里计算 Query 和 Key 的相似度时，结果会和 $m - n$ 这样的相对距离有关。

直观理解：

```text
每个位置都让向量旋转不同角度。
两个 token 的角度差，就携带了它们相隔多远的信息。
```

这比“给每个位置加一个向量”更自然地融入 attention 计算。

### RoPE 和原始位置编码的区别

可以这样对比：

```text
原始 sinusoidal 位置编码：
把位置向量加到 token embedding 上。

RoPE：
在 attention 计算前，根据位置旋转 Query 和 Key。
```

前者更像是：

```text
这个 token 的输入向量 = token 信息 + 位置向量
```

后者更像是：

```text
当 token 彼此比较时，把位置信息带进比较过程。
```

### RoPE 的优点

RoPE 的主要优点可以概括为以下几点。

第一，它更自然地表达相对位置。

普通位置编码更像是在告诉模型：

```text
这个 token 在第 10 位
这个 token 在第 15 位
```

RoPE 更擅长让模型感知：

```text
这两个 token 相隔 5 个位置
```

而 attention 里很多判断其实更依赖相对距离，比如“前一个词”“附近几个词”“很远处的某个词”。

第二，它直接融入 attention 计算。

RoPE 不是简单把位置向量加到 token embedding 上，而是在 Query 和 Key 上做旋转。也就是说，模型在比较两个 token 是否相关时，位置信息已经自然参与进去了。

可以粗略理解成：

```text
普通位置编码：先把位置信息塞进输入里。
RoPE：在 token 彼此比较时加入位置信息。
```

第三，它对长文本更友好。

RoPE 的位置变化是有规律的，不是单纯记住“第 1 位、第 2 位、第 3 位”这些固定位置。因此在处理比训练时更长的文本时，RoPE 通常比简单的可学习位置 embedding 更容易外推。

当然，RoPE 也不是无限长都稳定，所以后来又出现了 NTK scaling、YaRN 等长上下文扩展方法。

第四，它不需要额外学习一张位置表。

RoPE 的位置变化由公式决定，不像可学习位置 embedding 那样需要训练一张：

```text
位置 0 -> 向量
位置 1 -> 向量
位置 2 -> 向量
...
```

这让它在结构上更规整，也减少了对固定最大位置表的依赖。

第五，它很适合 Decoder-only 大语言模型。

现代 LLM 推理时是不断生成下一个 token，模型需要频繁判断当前 token 和前文 token 的关系。RoPE 对这种“基于上下文比较 token”的场景很合适，所以 LLaMA、Qwen、MiniMind 这类 Decoder-only 模型都常用它或它的变体。

可以一句话总结：

```text
RoPE 的优势是：把位置信息自然融入 attention，
让模型更容易理解 token 之间的相对距离，
并且对长上下文更友好。
```

MiniMind 这类 Decoder-only 模型通常会采用 RoPE 位置编码。它在现代大语言模型中非常常见，例如 LLaMA、Qwen 等模型也使用了类似思路。

不过，无论具体方法如何变化，位置编码要解决的问题是一致的：

```text
让模型知道 token 的顺序和位置关系。
```

## 小结

位置编码的作用可以概括为：

```text
token embedding：表示 token 是什么
position encoding：表示 token 在哪里
最终输入：token 信息 + 位置信息
```

在原始 Transformer 中，这个过程可以写成：

```math
x_{pos} = e_{token} + p_{pos}
```

其中 $p_{pos}$ 由 sin/cos 公式生成。

后来的模型可能使用不同的位置编码方法，但核心目标仍然是让模型能够理解顺序。
