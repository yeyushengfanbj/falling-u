# falling-u API

这个后端服务负责京东联盟 API、转链、商品同步和以后后台管理。前台 Astro 继续静态构建，后端只挂在同域名的 `/api/*`。

## 本地运行

```bash
cp .env.example .env
npm run server:dev
```

公开接口：

- `GET /api/health`
- `GET /api/products`

管理接口需要 `SERVER_ADMIN_TOKEN`，用 `Authorization: Bearer <token>` 或 `x-admin-token: <token>` 调用：

- `POST /api/admin/jd/goods/search`
- `POST /api/admin/jd/promotion/link`

## 京东联盟接口

先在 `.env` 配置：

```bash
JD_UNION_APP_KEY=...
JD_UNION_APP_SECRET=...
JD_UNION_SITE_ID=...
JD_UNION_POSITION_ID=...
JD_UNION_PID=...
```

商品搜索示例：

```bash
curl -X POST http://127.0.0.1:8787/api/admin/jd/goods/search \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer change-me' \
  -d '{"keyword":"显示器","pageSize":10}'
```

转链示例：

```bash
curl -X POST http://127.0.0.1:8787/api/admin/jd/promotion/link \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer change-me' \
  -d '{"materialId":"https://item.jd.com/10111784658291.html"}'
```

## 同域名部署

前台静态文件部署到站点根目录，后端监听本机端口，例如 `127.0.0.1:8787`，Nginx 把 `/api/` 反向代理到后端。

```nginx
server {
  server_name example.com;

  root /var/www/falling-u/dist;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:8787/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    try_files $uri $uri/ =404;
  }
}
```
