# Feed Forward 是什么

在 Transformer / LLM 中，Feed Forward 通常指 Decoder Block 里的前馈网络，也常写成 FFN 或 MLP。

它的作用可以先用一句话理解：

```text
Attention 负责读上下文，Feed Forward 负责加工每个位置读到的信息。
```

## Feed Forward 在哪里

一个简化的 Decoder Block 可以看成：

```text
输入
-> Self-Attention
-> Add & Norm
-> Feed Forward
-> Add & Norm
-> 输出
```

Self-Attention 让不同位置之间交换信息。

Feed Forward 则对每个位置的向量单独做进一步加工。

## 输入输出形状

假设输入有 10 个 token，每个 token 是 128 维向量。

进入 Feed Forward 前，形状是：

```text
10×128
```

Feed Forward 会逐行处理每个 token 向量：

```text
第 1 行：128 维 -> 128 维
第 2 行：128 维 -> 128 维
...
第 10 行：128 维 -> 128 维
```

整体看：

```text
Feed Forward：10×128 -> 10×128
```

它不改变 token 数量，也通常不改变最终 hidden size。变的是每一行向量的内容。

## 典型结构：升维再降维

Feed Forward 通常不是一个单独的线性层，而是两层线性变换，中间加一个激活函数。

简化形式：

```text
128 维
-> 升维到更大的空间
-> 激活函数
-> 降回 128 维
```

比如：

```text
128 -> 512 -> 128
```

用公式可以写成：

```math
FFN(x) = W_2 \, \phi(W_1 x + b_1) + b_2
```

其中：

```text
x：某个位置的输入向量
W_1：第一层线性变换，把向量升维
phi：激活函数
W_2：第二层线性变换，把向量降回原维度
```

如果输入矩阵是 $X \in \mathbb{R}^{10 \times 128}$，那么可以理解为同一个 FFN 被应用到每一行：

```math
Y_i = FFN(X_i)
```

最终输出仍然是：

```math
Y \in \mathbb{R}^{10 \times 128}
```

## 为什么要先升维再降维

先升维再降维可以理解成给模型一个更大的“加工空间”。

比如原始向量是 128 维：

```text
128 维：信息比较压缩
512 维：临时展开，方便组合和变换
128 维：加工后再压回模型需要的尺寸
```

这有点像：

```text
先把一小张纸摊开，
在更大的桌面上重新整理，
最后再折回原来的大小。
```

输出尺寸不变，但中间加工能力增强了。

## 为什么需要激活函数

如果 Feed Forward 只有线性变换：

```text
线性层 -> 线性层
```

那么两个线性层合起来，本质上仍然可以看成一个线性层。

激活函数会引入非线性，使模型能表达更复杂的关系。

常见激活函数包括：

```text
ReLU
GELU
SiLU
SwiGLU
```

现代 LLM 中经常会使用 SiLU、GELU 或 SwiGLU 一类结构。

## SwiGLU：现代 LLM 常见结构

很多现代语言模型的 Feed Forward 不再使用最简单的：

```text
Linear -> Activation -> Linear
```

而是使用门控结构，例如 SwiGLU。

它的大致形式可以理解成：

```text
一条分支负责生成候选信息
另一条分支负责控制哪些信息通过
两者相乘后再降维
```

简化公式：

```math
FFN(x) = W_{down} \left( \text{SiLU}(W_{gate}x) \odot W_{up}x \right)
```

其中：

```text
W_gate：生成“门控”信号
W_up：生成候选信息
SiLU：激活函数
odot：逐元素相乘
W_down：降回原维度
```

直观理解：

```text
W_up 提供要加工的信息。
W_gate 决定哪些信息更应该通过。
```

MiniMind 的 Feed Forward 就采用了类似 SwiGLU 的结构。

## 和 Attention 的分工

Attention 和 Feed Forward 的分工可以这样理解：

```text
Attention：负责信息从哪里来。
Feed Forward：负责拿到信息后怎么加工。
```

继续用“蓝色怪兽”的例子：

```text
蓝色 / 怪 / 兽
```

Self-Attention 会让“兽”这个位置看到前面的“蓝色”和“怪”。

Feed Forward 则会进一步加工“兽”这个位置的向量，让它更像一个适合继续预测的状态：

```text
不是孤立的“兽”
而是“蓝色怪兽”这个短语末尾的状态
```

## 为什么 Feed Forward 是逐位置处理

Feed Forward 不负责 token 之间互相看。

它对每一行使用同一套网络：

```text
第 1 个位置 -> FFN -> 第 1 个位置的新向量
第 2 个位置 -> FFN -> 第 2 个位置的新向量
...
第 10 个位置 -> FFN -> 第 10 个位置的新向量
```

也就是说，位置之间的信息交换主要由 Attention 完成；Feed Forward 负责在每个位置内部做非线性加工。

## 小结

Feed Forward 的作用可以概括为：

```text
输入每个位置的向量
-> 升维
-> 非线性加工
-> 降维
-> 输出更新后的向量
```

它的核心好处是：

```text
让模型在读完上下文之后，
还能对每个位置的信息进行更强的非线性加工。
```

在 Decoder Block 中：

```text
Self-Attention 负责读上下文。
Feed Forward 负责加工上下文。
Residual 和 Norm 负责保留信息并稳定数值。
```
