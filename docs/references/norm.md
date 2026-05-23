# Norm 是什么

Norm 是 normalization 的简称，通常翻译为归一化或标准化。

在神经网络里，Norm 的作用是把一组数字整理到更稳定的范围里，让训练和推理更稳定。

可以先用一句话理解：

```text
Norm 不是让模型“理解更多语义”，而是让中间向量的数值更好控制。
```

## 为什么需要 Norm

模型每一层都会对向量做计算。如果不加控制，向量里的数字可能一层层变得过大、过小，或者分布很不稳定。

这会带来几个问题：

```text
训练不稳定
梯度容易异常
不同层之间数值尺度不一致
模型更难收敛
```

Norm 的目的就是缓解这些问题。

在 Transformer / LLM 中，Norm 通常会出现在 Attention、Feed Forward 和残差连接附近，用来稳定每一层的输入或输出。

## LayerNorm

LayerNorm 是 Transformer 里非常经典的归一化方法。

假设某个 token 的 hidden state 是一个 $d$ 维向量：

```math
x = [x_1, x_2, ..., x_d]
```

LayerNorm 会先计算这个向量内部的均值：

```math
\mu = \frac{1}{d}\sum_{i=1}^{d} x_i
```

再计算方差：

```math
\sigma^2 = \frac{1}{d}\sum_{i=1}^{d}(x_i - \mu)^2
```

然后对每个维度做标准化：

```math
\hat{x}_i = \frac{x_i - \mu}{\sqrt{\sigma^2 + \epsilon}}
```

其中 $\epsilon$ 是一个很小的数，用来避免除以 0。

最后，LayerNorm 通常还会带两个可学习参数：

```math
y_i = \gamma_i \hat{x}_i + \beta_i
```

其中：

```text
gamma：缩放参数
beta：平移参数
```

所以 LayerNorm 的完整直觉是：

```text
先把一个 token 向量内部的数值标准化，
再允许模型用 gamma 和 beta 调整回合适的范围。
```

## RMSNorm

RMSNorm 是很多现代大语言模型常用的归一化方法。MiniMind 里也使用了 RMSNorm。

RMSNorm 和 LayerNorm 很像，但它不减去均值，只根据均方根来缩放。

给定向量：

```math
x = [x_1, x_2, ..., x_d]
```

先计算均方根：

```math
RMS(x) = \sqrt{\frac{1}{d}\sum_{i=1}^{d}x_i^2 + \epsilon}
```

然后归一化：

```math
\hat{x}_i = \frac{x_i}{RMS(x)}
```

最后通常乘上可学习缩放参数：

```math
y_i = \gamma_i \hat{x}_i
```

RMSNorm 没有 LayerNorm 里的减均值步骤，也通常没有 beta 平移项。

可以简单对比：

```text
LayerNorm：减均值，再除以标准差。
RMSNorm：不减均值，只除以均方根。
```

RMSNorm 的好处是计算更简单，速度更快，在大语言模型里表现也很稳定。

## BatchNorm

BatchNorm 是较早常见的归一化方法，尤其常见于 CNN。

它的特点是：沿着 batch 维度统计均值和方差。

简化理解：

```text
LayerNorm / RMSNorm：主要在单个样本、单个 token 的向量维度上做归一化。
BatchNorm：会利用一个 batch 里多个样本的统计信息。
```

在语言模型里，序列长度、padding、batch 变化都比较复杂，所以 Transformer 通常更偏好 LayerNorm 或 RMSNorm，而不是 BatchNorm。

## Pre-Norm 和 Post-Norm

在 Transformer Block 里，Norm 可以放在不同位置。

Post-Norm 是早期 Transformer 的常见写法：

```text
输入
-> Attention
-> Add
-> Norm
```

Pre-Norm 是现代 LLM 更常见的写法：

```text
输入
-> Norm
-> Attention
-> Add
```

Feed Forward 部分也类似。

Pre-Norm 通常更利于深层模型训练稳定，因此很多现代大语言模型都采用 Pre-Norm 结构。

MiniMind 的 Decoder Block 也更接近 Pre-Norm 风格：先对输入做 RMSNorm，再进入 Attention 或 MLP。

## Norm 在 Decoder Block 里的作用

在 Decoder Block 中，Norm 通常配合残差连接一起出现。

可以粗略理解成：

```text
残差连接：保留原来的信息。
Norm：整理数值范围，让后续计算更稳定。
```

比如：

```text
输入向量
-> Norm
-> Attention
-> 和原输入相加
```

这样模型既能加入 Attention 读到的新信息，又不容易让数值变得太不稳定。

## 常见 Norm 方法对比

```text
LayerNorm
- 对单个 token 向量内部做均值和方差归一化
- Transformer 经典方法

RMSNorm
- 不减均值，只按均方根缩放
- 计算更简单，现代 LLM 常用

BatchNorm
- 依赖 batch 统计信息
- CNN 中常见，LLM 中相对少用
```

## 小结

Norm 的核心作用是：

```text
让中间向量的数值范围更稳定。
```

在 Transformer / LLM 中，它通常不是单独负责“理解语义”的模块，而是帮助 Attention、Feed Forward 和残差连接更稳定地工作。

可以简单记住：

```text
Attention / Feed Forward：加工信息。
Residual：保留信息。
Norm：稳定数值。
```
