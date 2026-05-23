const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(
    path.join(__dirname, "..", "docs", "public", "neural-network.html"),
    "utf8",
);

function includes(text) {
    assert.ok(html.includes(text), `页面缺少参考设计元素：${text}`);
}

includes("INTERACTIVE LEARNING SYSTEM");
includes("ISSUE 01");
includes("01 / 08");
includes("Neural Network Training Visualizer");
includes("class=\"dashboard-grid\"");
includes("class=\"panel dataset-panel\"");
includes("class=\"panel network-panel\"");
includes("training-strip");
includes("loss-panel");
includes("class=\"source-columns\"");
includes("当前执行位置");
includes("const maxTrainingEpochs = 5000;");
includes("epoch >= maxTrainingEpochs");
includes("lossHistory.push({ epoch, loss: latestLoss });");
includes("lossHistory.length > maxTrainingEpochs");
includes("全部 epoch，自适应坐标");
includes("Epoch");
includes("Loss");
includes("forwardConnection");
includes("backwardConnection");
includes("function offsetConnectionPoints");
includes("parallelOffset");
includes("createFlowParticle");
includes("forward-particle");
includes("backward-particle");
includes("animateMotion");
includes("Math.max(3,");
includes("stroke-dasharray: none");

console.log("page structure matches reference design markers");
