const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  ✓ ${name}`);
    } catch (err) {
        failed++;
        console.log(`  ✗ ${name}`);
        console.log(`    ${err.message}`);
    }
}

function suite(name, fn) {
    console.log(`\n${name}`);
    fn();
}

function approx(actual, expected, tolerance = 1e-10) {
    assert.ok(
        Math.abs(actual - expected) < tolerance,
        `${actual} 与期望值 ${expected} 的误差超过 ${tolerance}`,
    );
}

function loadEngine() {
    const htmlPath = path.join(__dirname, "..", "docs", "public", "neural-network.html");
    const html = fs.readFileSync(htmlPath, "utf8");
    const match = html.match(/<script id="neural-network-engine">([\s\S]*?)<\/script>/);
    assert.ok(match, "HTML 中必须包含 id=\"neural-network-engine\" 的引擎脚本");

    const context = {
        console,
        Math,
        structuredClone,
        window: {},
    };
    vm.createContext(context);
    vm.runInContext(match[1], context);
    assert.ok(context.window.NeuralNetwork, "引擎脚本必须暴露 window.NeuralNetwork");
    return context.window.NeuralNetwork;
}

const NeuralNetwork = loadEngine();

suite("sigmoid 激活函数", () => {
    test("sigmoid(0) = 0.5", () => {
        assert.strictEqual(NeuralNetwork.sigmoid(0), 0.5);
    });

    test("大正数接近 1，大负数接近 0", () => {
        assert.ok(NeuralNetwork.sigmoid(100) > 0.99);
        assert.ok(NeuralNetwork.sigmoid(-100) < 0.01);
    });

    test("输出始终在 0 到 1 之间", () => {
        for (let x = -10; x <= 10; x += 0.5) {
            const val = NeuralNetwork.sigmoid(x);
            assert.ok(val > 0 && val < 1, `sigmoid(${x}) = ${val} 不在 (0, 1)`);
        }
    });
});

suite("网络初始化", () => {
    test("正确创建权重矩阵和偏置向量", () => {
        const net = NeuralNetwork.init([2, 2, 3, 1]);
        assert.deepStrictEqual(net.sizes, [2, 2, 3, 1]);
        assert.strictEqual(net.weights.length, 3);
        assert.strictEqual(net.weights[0].length, 2);
        assert.strictEqual(net.weights[0][0].length, 2);
        assert.strictEqual(net.weights[1].length, 3);
        assert.strictEqual(net.weights[1][0].length, 2);
        assert.strictEqual(net.weights[2].length, 1);
        assert.strictEqual(net.weights[2][0].length, 3);
        assert.strictEqual(net.biases.length, 3);
        assert.strictEqual(net.biases[0].length, 2);
        assert.strictEqual(net.biases[1].length, 3);
        assert.strictEqual(net.biases[2].length, 1);
    });

    test("权重在合理随机范围内初始化", () => {
        const net = NeuralNetwork.init([2, 2, 3, 1]);
        for (const layer of net.weights) {
            for (const neuron of layer) {
                for (const weight of neuron) {
                    assert.ok(weight > -2 && weight < 2, `权重 ${weight} 超出范围`);
                }
            }
        }
    });
});

suite("前向传播", () => {
    test("单层网络正确计算输出", () => {
        const net = {
            sizes: [2, 1],
            weights: [[[0.5, 0.3]]],
            biases: [[0.1]],
        };
        const result = NeuralNetwork.forward(net, [1, 2]);
        const expected = NeuralNetwork.sigmoid(0.5 * 1 + 0.3 * 2 + 0.1);
        assert.strictEqual(result.activations[0].length, 2);
        assert.strictEqual(result.activations[1].length, 1);
        approx(result.activations[1][0], expected);
        approx(result.preActivations[1][0], 1.2);
    });

    test("多层网络返回完整激活值", () => {
        const net = {
            sizes: [2, 2, 1],
            weights: [
                [[0.5, -0.3], [0.2, 0.4]],
                [[0.6, 0.1]],
            ],
            biases: [[0.1, -0.2], [0]],
        };
        const result = NeuralNetwork.forward(net, [1, 1]);
        const h0 = NeuralNetwork.sigmoid(0.3);
        const h1 = NeuralNetwork.sigmoid(0.4);
        const expected = NeuralNetwork.sigmoid(0.6 * h0 + 0.1 * h1);
        assert.strictEqual(result.activations.length, 3);
        assert.deepStrictEqual(result.activations[0], [1, 1]);
        approx(result.activations[2][0], expected);
    });
});

suite("损失函数", () => {
    test("完美预测损失为 0", () => {
        assert.strictEqual(NeuralNetwork.computeLoss([[0.8]], [[0.8]]), 0);
    });

    test("多样本均方误差取平均", () => {
        const loss = NeuralNetwork.computeLoss([[0.9], [0.1]], [[0.1], [0.9]]);
        approx(loss, 0.64);
    });
});

suite("反向传播", () => {
    test("梯度形状与参数形状一致", () => {
        const net = NeuralNetwork.init([2, 2, 3, 1]);
        const grads = NeuralNetwork.backward(net, [0.5, 0.5], [1]);
        assert.strictEqual(grads.weightGradients.length, net.weights.length);
        assert.strictEqual(grads.biasGradients.length, net.biases.length);
        for (let l = 0; l < net.weights.length; l++) {
            assert.strictEqual(grads.weightGradients[l].length, net.weights[l].length);
            assert.strictEqual(grads.biasGradients[l].length, net.biases[l].length);
            for (let j = 0; j < net.weights[l].length; j++) {
                assert.strictEqual(grads.weightGradients[l][j].length, net.weights[l][j].length);
            }
        }
    });

    test("单层网络权重梯度通过数值梯度验证", () => {
        const net = {
            sizes: [2, 1],
            weights: [[[0.5, 0.3]]],
            biases: [[0.1]],
        };
        const input = [1, 2];
        const target = [1];
        const grads = NeuralNetwork.backward(net, input, target);
        const eps = 1e-5;
        const base = NeuralNetwork.forward(net, input).activations.at(-1);
        const loss0 = NeuralNetwork.computeLoss([base], [target]);

        net.weights[0][0][0] += eps;
        const moved = NeuralNetwork.forward(net, input).activations.at(-1);
        const loss1 = NeuralNetwork.computeLoss([moved], [target]);
        net.weights[0][0][0] -= eps;

        approx(grads.weightGradients[0][0][0], (loss1 - loss0) / eps, 1e-4);
    });

    test("多层网络隐藏层梯度通过数值梯度验证", () => {
        const net = {
            sizes: [2, 2, 1],
            weights: [
                [[0.5, -0.3], [0.2, 0.4]],
                [[0.6, 0.1]],
            ],
            biases: [[0.1, -0.2], [0]],
        };
        const input = [1, 1];
        const target = [0];
        const grads = NeuralNetwork.backward(net, input, target);
        const eps = 1e-5;
        const base = NeuralNetwork.forward(net, input).activations.at(-1);
        const loss0 = NeuralNetwork.computeLoss([base], [target]);

        net.weights[0][0][0] += eps;
        const moved = NeuralNetwork.forward(net, input).activations.at(-1);
        const loss1 = NeuralNetwork.computeLoss([moved], [target]);
        net.weights[0][0][0] -= eps;

        approx(grads.weightGradients[0][0][0], (loss1 - loss0) / eps, 1e-3);
    });
});

suite("参数更新与训练", () => {
    test("权重和偏置按梯度下降方向更新", () => {
        const net = {
            sizes: [2, 1],
            weights: [[[0.5, 0.3]]],
            biases: [[0.1]],
        };
        NeuralNetwork.updateParameters(net, {
            weightGradients: [[[0.1, 0.2]]],
            biasGradients: [[0.05]],
        }, 0.1);
        approx(net.weights[0][0][0], 0.49);
        approx(net.weights[0][0][1], 0.28);
        approx(net.biases[0][0], 0.095);
    });

    test("一步训练后在固定网络上降低损失", () => {
        const net = {
            sizes: [2, 2, 1],
            weights: [
                [[0.4, -0.2], [0.1, 0.3]],
                [[0.2, 0.5]],
            ],
            biases: [[0, 0.1], [0]],
        };
        const samples = [
            { input: [0, 0], target: [0] },
            { input: [1, 1], target: [1] },
        ];
        const beforePreds = samples.map((sample) => NeuralNetwork.forward(net, sample.input).activations.at(-1));
        const beforeLoss = NeuralNetwork.computeLoss(beforePreds, samples.map((sample) => sample.target));
        const result = NeuralNetwork.trainStep(net, samples, 0.5);
        const afterPreds = samples.map((sample) => NeuralNetwork.forward(net, sample.input).activations.at(-1));
        const afterLoss = NeuralNetwork.computeLoss(afterPreds, samples.map((sample) => sample.target));
        assert.ok(afterLoss < beforeLoss, `训练后损失 ${afterLoss} 应小于训练前损失 ${beforeLoss}`);
        assert.strictEqual(typeof result.loss, "number");
        assert.strictEqual(result.predictions.length, 2);
    });
});

suite("状态快照与预设数据", () => {
    test("getState 返回深拷贝", () => {
        const net = NeuralNetwork.init([2, 2, 3, 1]);
        const state = NeuralNetwork.getState(net);
        state.weights[0][0][0] = 999;
        assert.notStrictEqual(net.weights[0][0][0], 999);
        assert.strictEqual(state.biases.length, 3);
    });

    test("预设数据每个样本都有 input 和 target", () => {
        for (const generator of [
            NeuralNetwork.generateCircleData,
            NeuralNetwork.generateMoonData,
            NeuralNetwork.generateXORData,
        ]) {
            const data = generator(50);
            assert.strictEqual(data.length, 50);
            for (const sample of data) {
                assert.strictEqual(sample.input.length, 2);
                assert.strictEqual(sample.target.length, 1);
                assert.ok(sample.target[0] === 0 || sample.target[0] === 1);
            }
        }
    });

    test("XOR 数据对角区域类别一致", () => {
        const data = NeuralNetwork.generateXORData(100);
        for (const sample of data) {
            const quadrant = (sample.input[0] > 0.5 ? 1 : 0) + (sample.input[1] > 0.5 ? 2 : 0);
            if (quadrant === 0 || quadrant === 3) {
                assert.strictEqual(sample.target[0], 0);
            } else {
                assert.strictEqual(sample.target[0], 1);
            }
        }
    });
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
