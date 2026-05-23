// TinyMind — 最小的 Decoder-Only Transformer 训练 + 推理演示
// 不依赖任何外部库，纯 JavaScript 实现
// 运行方式：node tinymind.js

// ============================================================
//  第一部分：词表与分词
// ============================================================

// 词表：26 个小写字母 + 空格 + 逗号 + 句号 + <eos>，共 30 个 token
var chars = "abcdefghijklmnopqrstuvwxyz ,.";
var EOS_ID = chars.length; // 29
var VOCAB_SIZE = chars.length + 1; // 30

// 文本 -> token id 列表
function tokenize(text) {
    var ids = [];
    for (var i = 0; i < text.length; i++) {
        var idx = chars.indexOf(text[i]);
        ids.push(idx >= 0 ? idx : chars.indexOf(" "));
    }
    return ids;
}

// token id 列表 -> 文本
function detokenize(ids) {
    var text = "";
    for (var i = 0; i < ids.length; i++) {
        if (ids[i] === EOS_ID) break;
        text += chars[ids[i]];
    }
    return text;
}

// ============================================================
//  第二部分：矩阵运算工具
// ============================================================

var EMBED_DIM = 16; // 向量维度
var D_FF = 64;    // Feed Forward 中间层维度

// 固定种子的伪随机数生成器
function createRng(seed) {
    var s = seed;
    return function () {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
    };
}

// 生成一个 rows × cols 的随机矩阵
function randomMatrix(rows, cols, rng, scale) {
    var m = [];
    for (var i = 0; i < rows; i++) {
        var row = [];
        for (var j = 0; j < cols; j++) row.push((rng() - 0.5) * scale);
        m.push(row);
    }
    return m;
}

// 矩阵乘法：a(m×k) × b(k×n) = c(m×n)
function matMul(a, b) {
    var m = a.length, k = a[0].length, n = b[0].length;
    var c = [];
    for (var i = 0; i < m; i++) {
        var row = [];
        for (var j = 0; j < n; j++) {
            var sum = 0;
            for (var p = 0; p < k; p++) sum += a[i][p] * b[p][j];
            row.push(sum);
        }
        c.push(row);
    }
    return c;
}

// 向量点积
function dot(a, b) {
    var sum = 0;
    for (var i = 0; i < a.length; i++) sum += a[i] * b[i];
    return sum;
}

// softmax：把一串数字变成概率分布（加起来等于 1）
function softmax(arr) {
    var max = arr[0];
    for (var i = 1; i < arr.length; i++) {
        if (arr[i] > max) max = arr[i];
    }
    var exps = [], sum = 0;
    for (var i = 0; i < arr.length; i++) {
        exps.push(Math.exp(arr[i] - max));
        sum += exps[i];
    }
    return exps.map(function (e) { return e / sum; });
}

// Layer Norm：让每个位置的向量数值更稳定
function layerNorm(x) {
    var mean = 0;
    for (var i = 0; i < x.length; i++) mean += x[i];
    mean /= x.length;
    var variance = 0;
    for (var i = 0; i < x.length; i++) variance += (x[i] - mean) * (x[i] - mean);
    variance /= x.length;
    var result = [];
    for (var i = 0; i < x.length; i++) {
        result.push((x[i] - mean) / Math.sqrt(variance + 1e-5));
    }
    return result;
}

// 残差连接 + LayerNorm
function addNorm(a, b) {
    var result = [];
    for (var j = 0; j < a.length; j++) result.push(a[j] + b[j]);
    return layerNorm(result);
}

// ============================================================
//  第三部分：模型结构与权重初始化
// ============================================================

var rng = createRng(42);

// Embedding 表：每个 token id 查表得到一个 EMBED_DIM 维向量
var embedding = randomMatrix(VOCAB_SIZE, EMBED_DIM, rng, 0.8);

// Self-Attention 的 Q/K/V/O 投影矩阵
var Wq = randomMatrix(EMBED_DIM, EMBED_DIM, rng, 0.5);
var Wk = randomMatrix(EMBED_DIM, EMBED_DIM, rng, 0.5);
var Wv = randomMatrix(EMBED_DIM, EMBED_DIM, rng, 0.5);
var Wo = randomMatrix(EMBED_DIM, EMBED_DIM, rng, 0.5);

// Feed Forward 的两层权重（先升维到 D_FF，再降维回 EMBED_DIM）
var W1 = randomMatrix(EMBED_DIM, D_FF, rng, 0.5);
var W2 = randomMatrix(D_FF, EMBED_DIM, rng, 0.2);

// LM Head：把 EMBED_DIM 维向量映射成 VOCAB_SIZE 个分数
var Wlm = randomMatrix(EMBED_DIM, VOCAB_SIZE, rng, 0.5);

// Sinusoidal 位置编码
function positionalEncoding(seqLen) {
    var pe = [];
    for (var pos = 0; pos < seqLen; pos++) {
        var row = [];
        for (var i = 0; i < EMBED_DIM; i++) {
            var angle = pos / Math.pow(10000, (2 * Math.floor(i / 2)) / EMBED_DIM);
            row.push(i % 2 === 0 ? Math.sin(angle) : Math.cos(angle));
        }
        pe.push(row);
    }
    return pe;
}

// 因果 Self-Attention：每个位置只能看自己和前面的位置
function selfAttention(x) {
    var Q = matMul(x, Wq);
    var K = matMul(x, Wk);
    var V = matMul(x, Wv);
    var scale = 1.0 / Math.sqrt(EMBED_DIM);
    var output = [];
    for (var i = 0; i < x.length; i++) {
        var scores = [];
        for (var j = 0; j <= i; j++) scores.push(dot(Q[i], K[j]) * scale);
        var attn = softmax(scores);
        var row = new Array(EMBED_DIM).fill(0);
        for (var j = 0; j <= i; j++) {
            for (var d = 0; d < EMBED_DIM; d++) row[d] += attn[j] * V[j][d];
        }
        output.push(row);
    }
    return matMul(output, Wo);
}

// Feed Forward：对每个位置做升维 -> ReLU -> 降维
function feedForward(x) {
    var hidden = matMul(x, W1);
    for (var i = 0; i < hidden.length; i++)
        for (var j = 0; j < hidden[i].length; j++)
            hidden[i][j] = hidden[i][j] > 0 ? hidden[i][j] : 0;
    return matMul(hidden, W2);
}

// 一层 Decoder Block：Self-Attention -> Add & Norm -> FFN -> Add & Norm
function decoderBlock(x) {
    var attnOut = selfAttention(x);
    var afterAttn = [];
    for (var i = 0; i < x.length; i++) afterAttn.push(addNorm(x[i], attnOut[i]));
    var ffnOut = feedForward(afterAttn);
    var output = [];
    for (var i = 0; i < afterAttn.length; i++) output.push(addNorm(afterAttn[i], ffnOut[i]));
    return output;
}

// ============================================================
//  第四部分：训练代码
// ============================================================

// 训练模式的前向传播：返回所有位置的 logits
function forwardTrain(tokenIds) {
    var x = [];
    for (var i = 0; i < tokenIds.length; i++) x.push(embedding[tokenIds[i]].slice());
    var pe = positionalEncoding(x.length);
    for (var i = 0; i < x.length; i++)
        for (var j = 0; j < EMBED_DIM; j++) x[i][j] += pe[i][j];
    x = decoderBlock(x);
    return matMul(x, Wlm);
}

// 交叉熵损失
function crossEntropyLoss(logits, tokenIds) {
    var totalLoss = 0;
    var count = 0;
    for (var i = 0; i < logits.length - 1; i++) {
        var probs = softmax(logits[i]);
        var target = tokenIds[i + 1];
        var p = Math.max(probs[target], 1e-10);
        totalLoss += -Math.log(p);
        count++;
    }
    return totalLoss / count;
}

function computeLoss(tokenIds) {
    var logits = forwardTrain(tokenIds);
    return crossEntropyLoss(logits, tokenIds);
}

// 数值梯度
function numericalGradient(weightMatrix, lossFn, eps) {
    var grad = [];
    for (var i = 0; i < weightMatrix.length; i++) {
        var gradRow = [];
        for (var j = 0; j < weightMatrix[i].length; j++) {
            var orig = weightMatrix[i][j];
            weightMatrix[i][j] = orig + eps;
            var lossPlus = lossFn();
            weightMatrix[i][j] = orig - eps;
            var lossMinus = lossFn();
            weightMatrix[i][j] = orig;
            gradRow.push((lossPlus - lossMinus) / (2 * eps));
        }
        grad.push(gradRow);
    }
    return grad;
}

// 梯度裁剪
function clipGradients(allGrads, maxNorm) {
    var totalNormSq = 0;
    for (var g = 0; g < allGrads.length; g++)
        for (var i = 0; i < allGrads[g].length; i++)
            for (var j = 0; j < allGrads[g][i].length; j++)
                totalNormSq += allGrads[g][i][j] * allGrads[g][i][j];
    var totalNorm = Math.sqrt(totalNormSq);
    if (totalNorm > maxNorm) {
        var scale = maxNorm / totalNorm;
        for (var g = 0; g < allGrads.length; g++)
            for (var i = 0; i < allGrads[g].length; i++)
                for (var j = 0; j < allGrads[g][i].length; j++)
                    allGrads[g][i][j] *= scale;
    }
    return totalNorm;
}

// 创建零矩阵
function zerosLike(m) {
    var result = [];
    for (var i = 0; i < m.length; i++) {
        var row = [];
        for (var j = 0; j < m[i].length; j++) row.push(0);
        result.push(row);
    }
    return result;
}

// AdamW 优化器
var adamState = {};
function adamWUpdate(name, weights, grads, lr, beta1, beta2, eps, weightDecay, t) {
    if (!adamState[name]) {
        adamState[name] = { m: zerosLike(weights), v: zerosLike(weights) };
    }
    var s = adamState[name];
    for (var i = 0; i < weights.length; i++) {
        for (var j = 0; j < weights[i].length; j++) {
            s.m[i][j] = beta1 * s.m[i][j] + (1 - beta1) * grads[i][j];
            s.v[i][j] = beta2 * s.v[i][j] + (1 - beta2) * grads[i][j] * grads[i][j];
            var mHat = s.m[i][j] / (1 - Math.pow(beta1, t));
            var vHat = s.v[i][j] / (1 - Math.pow(beta2, t));
            weights[i][j] -= lr * (mHat / (Math.sqrt(vHat) + eps) + weightDecay * weights[i][j]);
        }
    }
}

// 梯度累加
function addGradients(accGrad, newGrad) {
    for (var i = 0; i < accGrad.length; i++)
        for (var j = 0; j < accGrad[i].length; j++)
            accGrad[i][j] += newGrad[i][j];
}

// ============================================================
//  第五部分：推理代码
// ============================================================

// 采样策略：logits -> temperature -> top-k -> top-p -> multinomial -> token id
function sampleToken(logits, temperature, topKVal, topPVal) {
    var scaled = [];
    for (var i = 0; i < logits.length; i++) scaled.push(logits[i] / temperature);
    var sorted = scaled.slice().sort(function (a, b) { return b - a; });
    var threshold = sorted[topKVal - 1];
    var filtered = [];
    for (var i = 0; i < scaled.length; i++) {
        filtered.push(scaled[i] >= threshold ? scaled[i] : -Infinity);
    }
    var probs = softmax(filtered);
    var indexed = [];
    for (var i = 0; i < probs.length; i++) indexed.push({ id: i, prob: probs[i] });
    indexed.sort(function (a, b) { return b.prob - a.prob; });
    var cumulative = 0;
    var keep = {};
    for (var i = 0; i < indexed.length; i++) {
        cumulative += indexed[i].prob;
        keep[indexed[i].id] = true;
        if (cumulative >= topPVal) break;
    }
    var final = [];
    for (var i = 0; i < filtered.length; i++) {
        final.push(keep[i] ? filtered[i] : -Infinity);
    }
    var finalProbs = softmax(final);
    var r = Math.random();
    var cumSum = 0;
    for (var i = 0; i < finalProbs.length; i++) {
        cumSum += finalProbs[i];
        if (r < cumSum) return i;
    }
    return finalProbs.length - 1;
}

// 单步推理
function predictNextToken(tokenIds, temperature, topKVal, topPVal) {
    var x = [];
    for (var i = 0; i < tokenIds.length; i++) x.push(embedding[tokenIds[i]].slice());
    var pe = positionalEncoding(x.length);
    for (var i = 0; i < x.length; i++)
        for (var j = 0; j < EMBED_DIM; j++) x[i][j] += pe[i][j];
    x = decoderBlock(x);
    var last = x[x.length - 1];
    var logits = [];
    for (var j = 0; j < VOCAB_SIZE; j++) {
        var s = 0;
        for (var i = 0; i < EMBED_DIM; i++) s += last[i] * Wlm[i][j];
        logits.push(s);
    }
    return sampleToken(logits, temperature, topKVal, topPVal);
}

// 完整推理
function generate(prompt, maxLen, temperature, topKVal, topPVal) {
    var ids = tokenize(prompt);
    for (var step = 0; step < maxLen; step++) {
        var nextId = predictNextToken(ids, temperature, topKVal, topPVal);
        ids.push(nextId);
        if (nextId === EOS_ID) break;
    }
    return detokenize(ids);
}

// ============================================================
//  第六部分：运行训练 + 推理
// ============================================================

// 所有需要训练的权重
var allWeights = [embedding, Wq, Wk, Wv, Wo, W1, W2, Wlm];
var weightNames = ["embedding", "Wq", "Wk", "Wv", "Wo", "W1", "W2", "Wlm"];

// 训练超参数
var LR = 0.01;
var ACCUMULATION_STEPS = 3;
var GRAD_CLIP = 1.0;
var NUM_EPS = 0.001;

// 训练数据
var trainData = [
    "hello world",
    "this is a test",
    "training is fun",
    "hello this is fun",
    "world of testing",
    "a test of training"
];

var trainIds = [];
for (var d = 0; d < trainData.length; d++) {
    trainIds.push(tokenize(trainData[d]));
}

// 训练前的推理
console.log("=== 训练前（随机权重）===");
console.log("输入: hello");
console.log("输出:", generate("hello", 20, 0.8, 10, 0.9));

// 训练循环
console.log("\n=== 开始训练 ===");
var t = 0;
var STEPS = 30;
for (var step = 0; step < STEPS; step++) {
    var accGrads = [];
    for (var w = 0; w < allWeights.length; w++) {
        accGrads.push(zerosLike(allWeights[w]));
    }

    for (var acc = 0; acc < ACCUMULATION_STEPS; acc++) {
        var idx = Math.floor(Math.random() * trainIds.length);
        var ids = trainIds[idx];
        var lossFn = function() { return computeLoss(ids); };
        for (var w = 0; w < allWeights.length; w++) {
            var grad = numericalGradient(allWeights[w], lossFn, NUM_EPS);
            for (var i = 0; i < grad.length; i++)
                for (var j = 0; j < grad[i].length; j++)
                    grad[i][j] /= ACCUMULATION_STEPS;
            addGradients(accGrads[w], grad);
        }
    }

    clipGradients(accGrads, GRAD_CLIP);

    t++;
    for (var w = 0; w < allWeights.length; w++) {
        adamWUpdate(weightNames[w], allWeights[w], accGrads[w],
                    LR, 0.9, 0.999, 1e-8, 0.01, t);
    }

    if (step % 3 === 0) {
        var totalLoss = 0;
        for (var d = 0; d < trainIds.length; d++) totalLoss += computeLoss(trainIds[d]);
        console.log("step " + step + "/" + STEPS + ", avg loss: " + (totalLoss / trainIds.length).toFixed(4));
    }
}

// 训练后的推理
console.log("\n=== 训练后 ===");
console.log("输入: hello");
console.log("输出:", generate("hello", 20, 0.8, 10, 0.9));
