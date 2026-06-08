# falling-u

大众商品搜索和电商联盟网站 MVP，面向普通消费者整理京东好物、到手价、关键规格和选购指南，主要通过京东联盟推广链接变现。

## 本地运行

```bash
npm install
npm run dev
```

后端服务用于京东联盟 API、转链、商品同步和后续后台管理：

```bash
cp .env.example .env
npm run server:dev
```

本地后端默认监听 `http://127.0.0.1:8787`，健康检查是 `GET /api/health`。

后台工作台：

```text
http://127.0.0.1:4321/admin/
```

后台页面需要填写 `.env` 里的 `SERVER_ADMIN_TOKEN`，本地前后端分端口开发时 API Base 填 `http://127.0.0.1:8787`。备案和京东开放平台参数完成前，也可以先用后台的“手动新增草稿”维护商品库。

## 站点定位

- 首页先做商品搜索、分类筛选和优惠商品流。
- 内容页围绕真实选购问题做 SEO，给商品清单补充解释。
- 第一阶段目标是商品数量、点击和转化数据，不是立刻规模化。
- 京东普通商品链接不能产生佣金，必须替换为京东联盟后台生成的推广链接。

## 前台数据模式

前台采用“静态 HTML 首屏 + API 增强”的导购站模式：

- 首页和分类页构建时直接输出商品 HTML，利于 SEO 和首屏速度。
- 搜索、筛选、排序和加载更多优先走 `/api/products/search`。
- 商品曝光上报到 `/api/exposures`，点击跳转通过 `/go/[id]` 记录。
- API 不可用时，首屏静态商品仍然可以展示和本地筛选。

## 商品库扩容

当前 6 个商品是首批验证商品，用来跑通商品卡片、详情页、搜索、分类和京东联盟跳转链路，不是最终规模。

第一阶段建议先做到：

- 5 个核心分类。
- 每个分类至少 6 个商品。
- 总计至少 30 个可购买商品。

新增商品时优先补齐缺口最大的分类。每个商品都必须有京东联盟短链 `https://u.jd.com/...`；有可靠京东商品图时使用 `360buyimg.com` 图片，没有可靠图时不要强行配错图。

你不需要逐个手改代码。批量补商品的流程是：

1. 在京东联盟后台批量生成推广短链。
2. 将京东分享文案批量放到 `imports/jd-shares.txt`。
3. 运行导入脚本生成草稿。
4. 复核分类、摘要、规格和商品图后，将草稿的 `importStatus` 改成 `ready`。
5. 合并 ready 草稿到正式商品库。

也可以直接在 `/admin/` 手动新增草稿、复核并发布。

```bash
npm run import:jd
npm run merge:drafts
npm run audit:catalog
npm run check:links
```

## 目录

```text
src/content/guides/     选购指南 Markdown
src/data/products.json  商品推广位与联盟链接字段
src/data/products.ts    商品类型与导出
imports/                京东分享文案和导入草稿
scripts/audit-catalog.mjs 商品库数量与分类缺口审计
scripts/import-jd-shares.mjs 京东分享文案批量解析脚本
scripts/merge-product-drafts.mjs 商品草稿合并脚本
scripts/test-product-drafts.mjs 商品草稿发布校验脚本
src/pages/admin/       商品草稿、京东联盟接口和点击统计后台
src/pages/tools/        工具页
docs/OPERATING_PLAN.md  成本、获客、收入模型和执行计划
docs/DEVELOPMENT_PLAN.md 开发路线图和京东联盟 API 对接计划
openspec/               OpenSpec 项目规格、能力说明和变更计划
server/                 Node 后端服务，负责京东联盟 API 和商品同步
```

## 后端和同域名部署

可以把前台和后端部署在同一个域名服务器上。推荐方式是：

- Astro 前台构建为静态文件，部署到站点根目录。
- Node 后端只监听本机端口，例如 `127.0.0.1:8787`。
- Nginx 将 `/api/*` 反向代理到 Node 后端。
- 京东联盟 `AppKey`、`AppSecret`、`pid` 等只放服务器环境变量，不进入前端代码。

后端详细说明见 `server/README.md`。

完整开发计划见 `docs/DEVELOPMENT_PLAN.md`。

OpenSpec 管理入口：

```bash
npm run spec:list
npm run spec:list:all
npm run spec:validate
```

## 上线前清单

- 注册京东联盟并替换 `src/data/products.json` 中的 `affiliateUrl`。
- 配置京东联盟开放平台应用密钥和推广位参数到 `.env`。
- 将商品库补到至少 30 个可购买商品。
- 将 `astro.config.mjs` 的 `site` 改为真实域名。
- 提交 Google Search Console 和百度搜索资源平台。
- 如果部署到中国大陆服务器，完成 ICP 备案。
