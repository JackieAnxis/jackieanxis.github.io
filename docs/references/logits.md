# Logits 是什么

在大语言模型里，logits 是模型在预测下一个 token 时输出的原始分数。

如果词表里一共有 $V$ 个 token，那么模型每生成一步，都会输出一个长度为 $V$ 的向量：

```text
logits = [z_1, z_2, z_3, ..., z_V]
```

其中 $z_i$ 表示模型给第 $i$ 个 token 打的分。分数越高，说明模型越倾向于选择这个 token。

## logits 不是概率

logits 本身不是概率，原因有两个：

1. 它们可以是任意实数，例如 `8.2`、`-1.5`、`0.0`。
2. 它们加起来不需要等于 1。

比如模型可能输出：

```text
token     logit
---------------
这是       8.2
因为       7.9
天空       6.4
我们       4.1
蓝色       3.7
```

这些数字只能表示相对倾向，还不能直接当作概率使用。

## 从 logits 到概率：softmax

为了从候选 token 里采样，需要先把 logits 转换成概率。常用方法是 softmax。

给定 logits：

```text
z = [z_1, z_2, ..., z_V]
```

第 $i$ 个 token 的概率为：

```math
p_i = \frac{e^{z_i}}{\sum_{j=1}^{V} e^{z_j}}
```

这个公式做了两件事：

1. 用指数函数 $e^{z_i}$ 把分数变成正数。
2. 用所有候选的指数和做归一化，让所有概率加起来等于 1。

因此 softmax 之后会得到：

```text
probabilities = [p_1, p_2, p_3, ..., p_V]
```

并且：

```math
\sum_{i=1}^{V} p_i = 1
```

## 一个简单例子

假设词表里暂时只有三个候选 token：

```text
token     logit
---------------
这是       3.0
因为       2.0
天空       1.0
```

softmax 会计算：

```math
p(\text{这是}) = \frac{e^3}{e^3 + e^2 + e^1}
```

```math
p(\text{因为}) = \frac{e^2}{e^3 + e^2 + e^1}
```

```math
p(\text{天空}) = \frac{e^1}{e^3 + e^2 + e^1}
```

大致结果是：

```text
token     probability
---------------------
这是       66.5%
因为       24.5%
天空        9.0%
```

可以看到，logit 只差 1，转换成概率后差距会被明显拉开。

## temperature 如何影响 logits

采样时经常会看到 temperature 参数。它通常作用在 softmax 之前：

```math
p_i = \frac{e^{z_i / T}}{\sum_{j=1}^{V} e^{z_j / T}}
```

这里 $T$ 就是 temperature。

当 $T < 1$ 时，logits 之间的差距会被放大，概率分布会更尖锐。高分 token 更容易被选中。

当 $T > 1$ 时，logits 之间的差距会被压平，概率分布会更平缓。低分 token 也会更有机会被选中。

直观理解：

```text
低温：更确定，更保守
高温：更随机，更发散
```

## logits、概率和采样的关系

在一次 token 生成中，可以把流程理解成：

```text
模型读取上下文
-> 输出 logits
-> 用 softmax 转成概率
-> 根据 temperature / top-k / top-p 调整候选范围
-> 采样一个 token
-> 把 token 拼回上下文
```

所以，logits 是模型“还没变成概率之前”的原始判断。概率是为了采样而做的转换，最终被选出来的 token 才会成为模型真正输出的一部分。

## 为什么不直接输出概率

从训练和计算角度看，模型输出 logits 更方便。

训练时，模型通常会把 logits 和正确答案一起交给交叉熵损失函数。很多深度学习框架会把 softmax 和交叉熵合在一起计算，这样更稳定，也更高效。

推理时，保留 logits 也更灵活。temperature、top-k、top-p、重复惩罚等采样策略，通常都可以在 logits 或由 logits 得到的概率上进行调整。

因此可以简单记住：

```text
logits：模型给每个 token 的原始分数
softmax：把原始分数转成概率
采样：根据概率选出下一个 token
```
