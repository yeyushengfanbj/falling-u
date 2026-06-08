# falling-u 开发计划

更新日期：2026-06-08

## 项目定位

falling-u 是面向大众消费者的商品搜索和电商联盟网站。第一阶段不做复杂电商交易系统，只做三件事：

- 商品搜索、分类筛选和商品详情页，让用户能快速找到值得买的京东商品。
- 选购指南和专题页，用 SEO 覆盖真实购买问题。
- 京东联盟 CPS 转化链路，把普通京东商品链接转换为联盟推广链接。

## 当前架构

```text
Astro 静态前台
-> 商品列表、分类页、商品详情、指南页、跳转页

Node 后端服务
-> /api/products
-> /api/admin/jd/goods/search
-> /api/admin/jd/promotion/link

京东联盟开放平台
-> 商品查询
-> 推广链接生成
```

前台继续静态构建，后端只处理需要密钥的能力。京东联盟 `AppKey`、`AppSecret`、推广位等敏感参数必须只放在服务器环境变量里，不进入前端代码。

## 已完成

- 项目名称统一为 `falling-u`。
- 首页和分类页已改为更接近商品列表的结构。
- 商品数据从 `src/data/products.json` 读取。
- 已有 6 个首批验证商品，并完成联盟短链校验。
- 已有京东分享文案导入脚本：
  - `npm run import:jd`
  - `npm run merge:drafts`
  - `npm run audit:catalog`
  - `npm run check:links`
- 已新增 Node 后端服务，路径在 `server/`。
- 已提供同域名部署方案：前台静态文件走根路径，后端挂 `/api/*`。

## 京东联盟对接计划

官方入口：

- 京东联盟开放平台：https://union.jd.com/openplatform/api
- 京东联盟帮助文章：https://union.jd.com/searchResultDetail?articleId=108188

### 第 1 步：配置开放平台凭证

在服务器 `.env` 配置：

```bash
PORT=8787
SERVER_ADMIN_TOKEN=change-me

JD_UNION_APP_KEY=
JD_UNION_APP_SECRET=
JD_UNION_ACCESS_TOKEN=
JD_UNION_API_ENDPOINT=https://api.jd.com/routerjson
JD_UNION_API_VERSION=2.0

JD_UNION_SITE_ID=
JD_UNION_POSITION_ID=
JD_UNION_PID=
JD_UNION_SUB_UNION_ID=
```

优先确认这些信息：

- 应用的 `AppKey` 和 `AppSecret`。
- 推广位、网站 ID 或媒体 ID。
- 是否需要 `access_token`。
- 商品查询和转链接口是否已经开通权限。

### 第 2 步：验证商品搜索 API

已有接口：

```text
POST /api/admin/jd/goods/search
```

本地验证：

```bash
curl -X POST http://127.0.0.1:8787/api/admin/jd/goods/search \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer change-me' \
  -d '{"keyword":"显示器","pageSize":10}'
```

开发目标：

- 支持关键词搜索。
- 支持按京东 SKU 精确查询。
- 返回商品名、SKU、价格、图片、佣金比例、优惠券信息和商品地址。
- 对京东返回结构做统一归一化，避免前端直接依赖京东原始字段。

### 第 3 步：验证联盟转链 API

已有接口：

```text
POST /api/admin/jd/promotion/link
```

本地验证：

```bash
curl -X POST http://127.0.0.1:8787/api/admin/jd/promotion/link \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer change-me' \
  -d '{"materialId":"https://item.jd.com/10111784658291.html"}'
```

开发目标：

- 输入京东商品链接或 SKU 对应的 `materialId`。
- 输出联盟推广链接、短链和可追踪字段。
- 支持默认推广位，也支持按页面、分类或活动传不同 `positionId`。
- 转链失败时保留错误信息，不把普通京东链接误当作可变现链接。

### 第 4 步：商品入库流程

短期流程：

```text
京东联盟后台或 API 获取商品
-> 生成推广链接
-> 写入 imports/product-drafts.json
-> 人工复核标题、分类、图片、价格和推荐理由
-> 合并到 src/data/products.json
-> 构建静态页面
```

中期目标：

- 新增后台商品草稿页。
- 搜索京东商品后，一键转链并保存草稿。
- 支持批量 SKU 导入。
- 支持批量刷新价格、优惠券和佣金信息。
- 商品图优先使用京东 API 返回的可靠主图，避免图货不一致。

### 第 5 步：自动同步策略

第一阶段不做全自动上架。原因是商品名、图片、价格和活动页经常变化，完全自动容易产生错误推荐。

推荐策略：

- 每天自动刷新价格、优惠券和佣金。
- 新商品先进入草稿，不直接公开。
- 已公开商品如果转链失效，标记为 `needsReview`。
- 活动价变化只更新数值，不自动改推荐结论。

## 前台开发计划

### P0：可上线商品站

- 商品库扩到 30 个，5 个分类每类至少 6 个。
- 首页支持搜索、分类、价格区间和排序。
- 分类页做成稳定商品流，而不是文章列表。
- 商品详情页展示主图、价格、到手价、关键规格、适合人群和购买按钮。
- `/go/[id]` 跳转页保留，用于统计点击和合规提示。

验收：

```bash
npm run audit:catalog
npm run check:links
npm run build
```

### P1：商品后台

- 管理端登录使用 `SERVER_ADMIN_TOKEN`。
- 商品搜索：调用京东联盟商品查询接口。
- 一键转链：调用京东联盟推广链接接口。
- 草稿编辑：补充分类、摘要、推荐理由、标签和图片。
- 发布：写入正式商品库或后续数据库。

### P2：数据化运营

- 记录 `/go/[id]` 点击日志。
- 按商品、分类、页面统计点击率。
- 标记高点击低转化商品，后续人工复核。
- 接入 Google Search Console、百度搜索资源平台和基础访问分析。

### P3：从静态 JSON 升级到数据库

当商品超过 200 个，或者价格需要每天刷新时，再从 JSON 升级到数据库。

候选方案：

- SQLite：适合单服务器、轻量后台。
- PostgreSQL：适合长期运营、复杂查询和多人维护。

第一阶段不急着上数据库，先把商品质量和转化链路跑通。

## 部署计划

推荐同域名部署：

```text
https://falling-u.com/
-> Astro 静态页面

https://falling-u.com/api/*
-> Nginx 反向代理到 Node 后端 127.0.0.1:8787
```

上线前检查：

- `.env` 只存在服务器，不提交到代码仓库。
- Nginx 只暴露 `/api/*`，不要暴露后端内部文件。
- 管理接口必须带 `SERVER_ADMIN_TOKEN`。
- `astro.config.mjs` 的 `site` 改为真实域名。
- `public/robots.txt` 的 sitemap 域名同步改为真实域名。

## 下一步开发顺序

1. 配好京东联盟开放平台凭证，跑通商品搜索和转链接口。
2. 做一个最小后台页面：搜索商品、预览商品、生成推广链接、保存草稿。
3. 把商品库从 6 个扩到 30 个。
4. 继续打磨首页、分类页、商品详情页的商品列表体验。
5. 增加点击日志，为后续判断哪些商品值得扩展做数据基础。

