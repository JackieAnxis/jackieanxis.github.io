const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const componentPath = path.join(
    __dirname,
    "..",
    "docs",
    ".vitepress",
    "components",
    "HomePage.vue",
);
const themeCssPath = path.join(
    __dirname,
    "..",
    "docs",
    ".vitepress",
    "theme",
    "custom.css",
);
const component = fs.readFileSync(componentPath, "utf8");
const themeCss = fs.readFileSync(themeCssPath, "utf8");
const dynamicNavTitlePath = path.join(
    __dirname,
    "..",
    "docs",
    ".vitepress",
    "components",
    "DynamicNavTitle.vue",
);
const dynamicNavTitle = fs.readFileSync(dynamicNavTitlePath, "utf8");
const spineUrl = "/assets/agent-revelations-spine.png";
const llmSpineUrl = "/assets/llm-for-everyone-spine.png";

assert.ok(!component.includes("intro-panel"), "首页主体不应再保留左侧介绍结构");
assert.ok(!component.includes("bookshelf-heading"), "首页主体不应再保留书架标题结构");
assert.ok(component.includes("grid-template-columns: minmax(0, 1fr);"), "删除左侧介绍后首页应使用单列布局");
assert.ok(!component.includes("grid-template-columns: minmax(0, 0.72fr) minmax(620px, 1.28fr);"), "首页不应继续使用旧双栏布局");
assert.ok(component.includes("place-items: center;"), "单列首页应将书架主体居中");
assert.ok(component.includes("Agent 启示录"), "首页应展示电子书标题");
assert.ok(component.includes("大模型通识课"), "首页应展示《LLM for Everyone》书籍标题");
assert.ok(
    component.includes("/agent-revelations/01-concept-and-evolution/00-overview"),
    "首页应链接到《Agent 启示录》正文",
);
assert.ok(
    component.includes("/llm-for-everyone/00-neural_network/00-overview"),
    "首页应链接到《LLM for Everyone》正文",
);
assert.ok(!component.includes("writing-stats"), "首页左侧不应展示写作统计");
assert.ok(!component.includes("primary-link"), "首页左侧不应展示开始阅读按钮");
assert.ok(!component.includes("本连载中"), "首页不应展示连载统计文案");
assert.ok(!component.includes("个写作方向"), "首页不应展示写作方向统计文案");
assert.ok(!component.includes("开始阅读 Agent 启示录"), "首页不应展示开始阅读按钮文案");
assert.ok(
    component.includes(spineUrl),
    "首页应使用《Agent 启示录》书脊资源",
);
assert.ok(
    component.includes(llmSpineUrl),
    "首页应使用《LLM for Everyone》书脊资源",
);
assert.ok(component.includes("/assets/llm-for-everyone-cover.png"), "画廊应使用《LLM for Everyone》封面资源");
assert.ok(component.includes("book-card spine"), "《Agent 启示录》应使用书脊卡片样式");
assert.ok(!component.includes("leaning-spine"), "第一本书不应再使用倾斜样式");
assert.ok(!component.includes("rotate("), "书脊不应倾斜");
assert.ok(component.includes("《Agent 启示录》书脊"), "书脊图片应有清晰的替代文本");
assert.ok(component.includes("book-card placeholder"), "首页应展示虚线占位书卡");
assert.ok(component.includes("v-for=\"placeholder in visiblePlaceholders\""), "待定书数量应由可见占位书列表动态渲染");
assert.ok(component.includes("ResizeObserver"), "首页应根据书架容器宽度自动计算可放书本数量");
assert.ok(component.includes("visiblePlaceholderCount"), "首页应维护当前可见待定书数量");
assert.ok(component.includes("activeBookId"), "横屏画廊应根据鼠标悬浮的书本维护当前选中书籍");
assert.ok(component.includes("ref(featuredBooks[0]?.id ?? \"\")"), "横屏无悬浮时右侧应默认展示第一本书");
assert.ok(component.includes("featuredBooks"), "首页应把已撰写书籍作为画廊数据渲染");
assert.ok(component.includes("@mouseenter=\"activeBookId = book.id\""), "横屏时鼠标悬浮书本应切换右侧书籍详情");
assert.ok(component.includes("'--featured-book-count': featuredBooks.length"), "书架网格应按已完成书籍数量生成书脊列");
assert.ok(component.includes("--visible-placeholder-count"), "书架列数应通过 CSS 变量响应动态书本数量");
assert.ok(component.includes("shelf-stage"), "书架应有立体展示舞台");
assert.ok(component.includes("shelf-statue"), "书架最左侧应展示雕像背景图");
assert.ok(component.includes('src="/assets/statue.png"'), "雕像应使用站内 statue.png 资源");
assert.ok(component.includes("shelf-object statue-object"), "雕像应作为书架里的第一个物件参与排列");
assert.ok(component.includes("grid-template-columns: minmax(84px, 107px) repeat(var(--featured-book-count), max-content) repeat(var(--visible-placeholder-count), minmax(64px, 96px));"), "书架应根据已完成书和待定书数量生成单行列");
assert.ok(!component.includes("minmax(84px, 107px) max-content repeat(var(--visible-placeholder-count)"), "书架不应只为一本已完成书预留列导致新增书脊换行");
assert.ok(component.includes("grid-auto-flow: column;"), "书架自动布局应只追加列，避免书本数量变化时换行");
assert.ok(component.includes("width: min(107px, 100%);"), "雕像桌面宽度应在当前基础上再缩成约 2/3");
assert.ok(component.includes("justify-content: flex-start;"), "雕像应在第一列左对齐");
assert.ok(!component.includes("translateX("), "雕像不应通过位移靠近书脊");
assert.ok(component.includes("display: block;"), "书脊图片应使用块级布局撑开自身宽度");
assert.ok(!component.includes("grid-template-columns: minmax(150px, 0.42fr) minmax(0, 1fr);"), "雕像不应再使用独立舞台左栏");
assert.ok(component.includes(".bookshelf::before"), "书架底座应跟随书架内容宽度对齐");
assert.ok(!component.includes(".bookshelf::after"), "书架底座不应再使用额外梯形支架");
assert.ok(!component.includes("clip-path: polygon("), "书架底座不应再使用梯形裁切");
assert.ok(!component.includes("--shelf-overhang"), "书架底座不应再使用梯形外扩变量");
assert.ok(component.includes("height: 24px;"), "书架底座应回到简洁矩形台面");
assert.ok(component.includes("background: #f8f6f1;"), "书架台面应使用干净的偏白纯色");
assert.ok(component.includes("inset 0 -6px 10px rgba(124, 111, 91, 0.16)"), "书架台面应有类似参考图的底部前沿阴影");
assert.ok(component.includes("0 14px 24px rgba(62, 52, 38, 0.16)"), "书架台面下方应有柔和投影");
assert.ok(!component.includes("linear-gradient(112deg"), "书架台面不应再使用大理石纹理渐变");
assert.ok(!component.includes("linear-gradient(88deg"), "书架台面不应再使用斜向纹理渐变");
assert.ok(!component.includes("linear-gradient(90deg, rgba(255, 255, 255, 0.82)"), "书架台面不应再使用横向渐变");
assert.ok(component.includes("border: 0;"), "书架台面边缘不应有明显描边");
assert.ok(component.includes(".shelf-stage::after"), "书架应有投影层");
assert.ok(component.includes("width: max-content;"), "书架内容应按实际宽度收缩，避免底座和雕像错位");
assert.ok(component.includes("margin: 0 auto;"), "书架应在单列布局中居中");
assert.ok(!component.includes("margin-left: auto;"), "删除左侧介绍后书架不应继续单侧靠右");
assert.ok(!component.includes("margin: 0;\n    gap: 0;"), "移动端书架不应左贴齐导致数量变化后偏心");
assert.ok(!component.includes("justify-content: start;\n    margin: 0;"), "移动端书架应随可见书本数量居中");
assert.ok(component.includes("overflow: visible;"), "书架展示舞台应允许阴影自然溢出");
assert.ok(!component.includes("overflow-x: auto;"), "动态计算书本数量后不应再用横向滚动裁剪低分辨率阴影");
assert.ok(component.includes("gap: 1px;"), "书和书之间应保留 1px 空隙");
assert.ok(!component.includes("gap: 0;"), "书架不应继续让书本完全紧贴");
assert.ok(!component.includes("gap: clamp(10px, 1vw, 16px);"), "桌面书架不应保留书本间距");
assert.ok(!component.includes("gap: 10px;\n  }\n\n  .shelf-statue"), "窄屏书架不应保留书本间距");
assert.ok(!component.includes("gap: 12px;\n    overflow-x: auto;"), "移动端书架不应保留书本间距");
assert.ok(component.includes("grid-template-columns: 69px repeat(var(--featured-book-count), max-content) repeat(var(--visible-placeholder-count), 88px);"), "移动端应按已完成书籍数量生成书脊列，并动态展示待定书");
assert.ok(component.includes("white-space: nowrap;"), "占位书文字不应换行");
assert.ok(component.includes("word-break: keep-all;"), "占位书中文标题应保持完整不断字");
assert.ok(component.includes("#f8f6f1"), "书架台面应更接近白色");
assert.ok(component.includes("maxPlaceholderCount = 9"), "首页待定书最多应保留 9 本");
assert.ok(!component.includes("min-height: calc(100vh - 64px);"), "首页不应强制撑满首屏高度");
assert.ok(!component.includes("100dvh"), "首页不应再用视口高度限制书架");
assert.ok(component.includes("object-fit: contain;"), "书脊图片应完整展示，不能被裁切");
assert.ok(!component.includes("aspect-ratio:"), "书脊不应写死固定宽高比");
assert.ok(component.includes("width: auto;"), "书脊图片应根据原始宽高自适应宽度");
assert.ok(!component.includes("background: #111;"), "书脊不应额外设置背景色");
assert.ok(component.includes("home-footer"), "首页应包含页脚");
assert.ok(component.includes("gallery-showcase"), "首页应包含艺术画廊式书籍展示区");
assert.ok(component.includes("gallery-detail"), "横屏画廊右侧应展示当前书籍封面和介绍");
assert.ok(component.includes("gallery-list"), "竖屏画廊应直接展示所有已撰写书籍");
assert.ok(component.includes("Agent Revelations"), "画廊应展示《Agent 启示录》的英文副标题");
assert.ok(component.includes("以 Claude Code 为例理解智能体原理"), "画廊应展示《Agent 启示录》的核心介绍");
assert.ok(component.includes("LLM for Everyone"), "画廊应展示《LLM for Everyone》的英文标题");
assert.ok(component.includes("面向程序员的大模型入门电子书"), "画廊应展示《LLM for Everyone》的核心介绍");
assert.ok(component.includes("gallery-layout"), "画廊应提供横屏左右布局容器");
assert.ok(component.includes("grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);"), "横屏时书架和详情应左右布局");
assert.ok(component.includes("--shelf-stage-top-padding: 28px;"), "横屏应显式记录书架舞台顶部留白，便于右侧展品和书架主体对齐");
assert.ok(component.includes("align-items: start;"), "横屏时右侧展品外框应按书架主体顶部对齐，不应拉满舞台高度");
assert.ok(component.includes("height: calc(var(--book-spine-height) + 16px);"), "右侧电子书展品外框高度应和书架主体加底座区域一致");
assert.ok(component.includes("margin-top: var(--shelf-stage-top-padding);"), "右侧电子书展品外框应下移到书架主体顶部");
assert.ok(component.includes(".gallery-list {\n    display: grid;"), "竖屏时画廊应以列表展示所有已撰写书籍");
assert.ok(component.includes("© 2026 潘嘉铖"), "页脚应包含版权信息");
assert.ok(component.includes("https://github.com/JackieAnxis/jackieanxis.github.io"), "页脚应包含 GitHub 链接");
assert.ok(!component.includes("resume-iframe"), "首页不应继续嵌入简历 iframe");
assert.ok(!themeCss.includes("position: relative !important;"), "页头应保持 VitePress 默认固定行为");
assert.ok(!themeCss.includes("padding-top: 0 !important;"), "内容区应保留 VitePress 默认页头偏移");
assert.ok(themeCss.includes(".VPNavBarTitle .title"), "主题应覆盖导航栏标题容器样式");
assert.ok(themeCss.includes("border-bottom: 0 !important;"), "导航栏左侧标题不应继续使用 border-bottom 画分割线");
assert.ok(dynamicNavTitle.includes("nav-title-divider"), "导航栏左侧标题应插入独立 divider 元素");
assert.ok(dynamicNavTitle.includes("closest('.VPNavBarTitle')"), "导航栏左侧 divider 应挂载到标题容器内");
assert.ok(dynamicNavTitle.includes("appendChild(dividerElement)"), "导航栏左侧 divider 应作为 .title 的兄弟元素插入");
assert.ok(themeCss.includes(".VPNavBarTitle > .nav-title-divider"), "导航栏左侧 divider 样式应只匹配 .title 的兄弟元素");
assert.ok(themeCss.includes("grid-template-rows: var(--vp-nav-height, 64px) 1px;"), "宽屏导航栏左侧 title 应保持 64px，divider 应作为额外 1px 行");
assert.ok(!themeCss.includes("position: absolute;"), "导航栏左侧 divider 不应依赖绝对定位");
assert.ok(themeCss.includes("height: 1px;"), "导航栏左侧 divider 应保持 1px 高");
assert.ok(themeCss.includes("background: var(--vp-c-gutter);"), "导航栏左侧 divider 应复用 banner 分割线颜色");
assert.ok(themeCss.includes(".VPSidebar .group"), "侧边栏章节分组应统一分割线颜色");
assert.ok(themeCss.includes("border-top-color: var(--vp-c-gutter) !important;"), "侧边栏章节分组 border top 应和 banner 分割线颜色一致");
assert.ok(themeCss.includes("@media (min-width: 960px)"), "宽屏模式下应单独调整 aside");
assert.ok(themeCss.includes("border-right: 10px solid transparent;"), "宽屏 aside 应预留透明右边框让滚动条视觉居中");
assert.ok(themeCss.includes("scrollbar-width: thin;"), "侧边栏滚动条应使用更细的样式");
assert.ok(themeCss.includes("rgba(118, 111, 101, 0.28)"), "侧边栏滚动条应使用淡灰棕色");
assert.ok(themeCss.includes("border-radius: 999px;"), "侧边栏滚动条 thumb 应保持圆润");
assert.ok(themeCss.includes("background-clip: content-box;"), "侧边栏滚动条 thumb 应通过透明边框获得留白");

console.log("homepage structure matches bookshelf design markers");
