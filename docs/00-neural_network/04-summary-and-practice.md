# 本章小结与练习

这一章建立了理解神经网络的第一条主线：神经网络不是一组手写规则，而是一种可以通过训练调整参数的预测函数。

在“小测是否通过”的例子里，输入可以是学习时长和复习次数，输出是模型对通过或不通过的预测。模型一开始未必可靠，因为内部的权重、偏置等参数还不合适。训练要做的，就是让模型反复经历预测、比较真实答案、调整参数的过程，逐渐形成更合适的判断方式。

如果你想把这个闭环”跑起来”看看，可以打开<a href="../neural-network.html" target="_blank">神经网络训练实验室</a>。它用一个二维分类问题展示前向传播、损失、反向传播和参数更新如何共同改变决策边界。

## 两个视角：推理和训练

理解神经网络时，可以先分成两个视角。

第一个视角是推理：

```text
输入 -> 前向传播 -> 输出预测
```

推理关心的是：模型拿到输入后，如何一步步算出输出。这里的核心是前向传播。

第二个视角是训练：

```text
预测 -> 计算损失 -> 反向传播 -> 梯度下降 -> 再预测
```

训练关心的是：模型预测得不够好时，如何知道错在哪里，并调整内部参数。这里会用到损失函数、反向传播、梯度下降和训练循环。

这两个视角联系很紧：训练开始时也要先做前向传播，因为没有预测，就无法计算损失；没有损失，就无法知道模型应该怎样改。

## 神经网络是一种可训练的预测函数

可以先把神经网络看成一个函数：

```text
输入 -> 模型 -> 预测
```

它和普通手写函数的关键区别在于：模型内部有会被训练改变的参数。权重表示不同输入有多重要，偏置表示模型整体上的基础倾向。

如果手写规则，我们要提前规定“学习多久算够”“复习几次算够”。神经网络则通过样本调整参数。比如很多样本都显示学习时长更重要，相关权重就可能在训练中变得更合适。这样，具体判断方式不是完全由人写死，而是在数据反馈中逐渐形成。

## 神经元、层和激活函数负责组织计算

神经元是神经网络里的小计算单元。它接收输入，用权重表示不同输入的重要性，再加上偏置这个基础倾向，得到中间分数。

多个神经元并排组成一层。层和层接起来，就形成了神经网络。前面的层更接近原始输入，后面的层更接近最终预测。

激活函数放在神经元的中间分数之后，让网络能够表达不只是直线关系的变化。初学阶段不需要记住很多激活函数名字，只要知道它让网络有能力表达更丰富的关系。

## 前向传播负责预测

前向传播负责把输入一步步变成输出。

在小测预测中，模型拿到：

```text
学习时长 = 2
复习次数 = 1
```

这些数字会进入网络，被一层层处理。神经元用权重、偏置和激活函数计算，中间层继续加工上一层的结果，输出层最后给出预测。

前向传播只回答“模型现在会预测什么”。它可能预测通过，也可能预测不通过；但它本身不知道这个预测对不对。训练必须先有预测，后面才谈得上比较和修正。

## 损失函数负责衡量好坏

预测出来以后，需要和真实答案比较。损失函数负责把这个差距变成一个数字。

如果真实结果是通过，而模型给出的通过分数很低，损失就会比较大；如果预测接近真实答案，损失就会比较小。损失不是只说“对”或“错”，还表达错得轻还是错得重。

因此，损失函数在训练里的职责是：衡量这次预测离真实答案有多远。它让“模型表现好不好”不再只是感觉，而是变成训练过程可以使用的反馈。

## 反向传播和梯度下降负责更新参数

知道错了以后，还要知道哪些参数更该调整。神经网络里有很多权重和偏置，最后的预测是它们共同作用的结果，不能把错误平均分给所有参数。

反向传播从输出层开始，把错误信号沿着前向传播留下的计算关系往前传。它会帮助判断：哪些参数对这次错误影响更大，哪些影响较小，以及它们大致应该往哪个方向改。

反向传播给出调整线索之后，梯度下降负责真正更新参数。梯度提供方向信息，学习率决定每次改动多大。参数通常不是一次调好的，每次更新只是小幅修正。

## 训练循环让模型逐步变好

把本章内容连起来，训练闭环可以记成：

```text
预测 -> 计算损失 -> 回溯错误 -> 更新参数 -> 再预测
```

展开来看，就是：

```text
准备样本和真实答案
-> 前向传播得到预测
-> 损失函数衡量错误程度
-> 反向传播分配参数责任
-> 梯度下降更新参数
-> 进入下一轮
```

每个概念在闭环里都有自己的职责：神经网络是可训练的预测函数；前向传播负责预测；损失函数负责衡量好坏；反向传播负责分配责任；梯度下降负责更新参数；训练循环把这些步骤连起来，让模型反复修正自己。

## 练习一：判断属于推理还是训练

下面这些动作分别属于推理，还是训练？

```text
1. 输入学习时长和复习次数，模型给出通过概率。
2. 把预测通过概率和真实标签进行比较。
3. 从输出层开始，把错误信号往前传。
4. 根据学习率修改权重和偏置。
5. 使用训练后的模型预测一个新学生是否能通过小测。
```

可以先自己判断，再看参考答案。

```text
1. 推理
2. 训练
3. 训练
4. 训练
5. 推理
```

推理只需要模型从输入算到输出。训练则需要在预测之后继续比较真实答案，并根据错误调整参数。

## 练习二：补全训练闭环

试着补全下面的流程：

```text
输入样本
-> 前向传播得到预测
-> ________
-> 反向传播传回错误信号
-> ________
-> 下一轮预测
```

参考答案：

```text
输入样本
-> 前向传播得到预测
-> 损失函数计算损失
-> 反向传播传回错误信号
-> 梯度下降更新参数
-> 下一轮预测
```

这个流程就是神经网络训练的基本骨架。

## 练习三：用一句话解释本章

试着用自己的话解释：

```text
为什么说神经网络不是手写规则，而是可训练的预测函数？
```

一个参考回答是：

```text
手写规则需要人提前规定判断条件；神经网络则通过样本和真实答案调整内部参数，让输入到输出的映射在训练中逐渐形成。
```

不必和参考答案一字不差。只要能说清楚“输入、输出、参数、训练”这几个关键词，就说明本章主线已经抓住了。

## 代码练习：把本章闭环串起来

最后用一个小练习把本章概念串起来。代码里故意保留了清晰的步骤名，可以对照前面的文字看。

```javascript
function forward(sample, parameters) {
    return (
        sample["studyHours"] * parameters["studyWeight"]
        + sample["reviewTimes"] * parameters["reviewWeight"]
        + parameters["bias"]
    );
}

function loss(prediction, target) {
    var error = prediction - target;
    return error * error;
}

function trainOneStep(sample, parameters, learningRate) {
    var prediction = forward(sample, parameters);
    var error = prediction - sample["target"];

    // 反向传播在这里被简化成三个参数各自的梯度
    var gradients = {
        "studyWeight": 2 * error * sample["studyHours"],
        "reviewWeight": 2 * error * sample["reviewTimes"],
        "bias": 2 * error,
    };

    parameters["studyWeight"] = parameters["studyWeight"] - learningRate * gradients["studyWeight"];
    parameters["reviewWeight"] = parameters["reviewWeight"] - learningRate * gradients["reviewWeight"];
    parameters["bias"] = parameters["bias"] - learningRate * gradients["bias"];

    return {
        "prediction": prediction,
        "loss": loss(prediction, sample["target"]),
    };
}

function roundedParameters(parameters) {
    return {
        "studyWeight": Number(parameters["studyWeight"].toFixed(4)),
        "reviewWeight": Number(parameters["reviewWeight"].toFixed(4)),
        "bias": Number(parameters["bias"].toFixed(4)),
    };
}

var sample = {
    "studyHours": 2,
    "reviewTimes": 1,
    "target": 1,
};

var parameters = {
    "studyWeight": 0.1,
    "reviewWeight": 0.1,
    "bias": 0.0,
};

for (var step = 0; step < 5; step = step + 1) {
    var result = trainOneStep(sample, parameters, 0.1);
    console.log(
        "预测:", result["prediction"].toFixed(4),
        "损失:", result["loss"].toFixed(6),
        "参数:", roundedParameters(parameters)
    );
}
```

读这段代码时，可以按本章主线对应：

```text
forward() -> 前向传播
loss() -> 损失函数
gradients -> 反向传播得到的调整线索
parameters["studyWeight"] = parameters["studyWeight"] - ... -> 梯度下降更新参数
for 循环 -> 训练循环
```

可以试着修改 `studyHours`、`reviewTimes`、`target` 或训练轮数，观察预测、损失和参数如何变化。


## 更多学习资料

本书到目前为止只是带你简单了解了神经网络的入门概念，更多深入概念可以访问：

- [3Blue1Brown 大神的介绍视频](https://www.bilibili.com/video/BV1bx411M7Zx/)

- [从头开始写一个神经网络](https://github.com/dennybritz/nn-from-scratch)

- [Neural Networks and Deep Learning](http://neuralnetworksanddeeplearning.com/)
