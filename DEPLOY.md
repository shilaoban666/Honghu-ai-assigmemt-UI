# Honghu AI Web — 部署手册（S3 + CloudFront）

前端是纯静态 SPA，最划算且标准的做法是 **S3 静态托管 + CloudFront CDN + ACM TLS**。
配套后端见后端仓库的 `DEPLOY.md`。

```
用户 → Route53(www.your-domain.com) → CloudFront(ACM TLS) → S3(dist/)
                                          │ /api 请求 → 后端 api.your-domain.com
```

## 1. 一次性基础设施
1. **S3 桶**（如 `honghu-ai-web`）：开启静态网站托管或配 CloudFront OAC 私有访问。
2. **CloudFront 分发**：源为该 S3 桶；因为是 SPA，需把 **403/404 自定义错误响应重定向到 `/index.html`（200）**，否则刷新子路由会 404。
3. **ACM 证书**：在 **us-east-1** 申请 `www.your-domain.com` 证书，绑定到 CloudFront。
4. **Route 53**：`www.your-domain.com` → 别名指向 CloudFront 分发。

## 2. 构建时注入后端地址（关键）
Vite 变量在**构建期**写死，所以必须在打包时给出生产后端地址：
```bash
VITE_AUTH_API_URL=https://api.your-domain.com/api/v1 npm run build
```
CI 里通过仓库变量 `VITE_AUTH_API_URL` 注入（见下）。

## 3. GitHub Variables / Secrets
仓库 Settings → Secrets and variables → Actions：

| 类型 | 名称 | 说明 |
|:---|:---|:---|
| Variable | `VITE_AUTH_API_URL` | 生产后端地址，如 `https://api.your-domain.com/api/v1` |
| Variable | `AWS_REGION` | 如 `us-east-1` |
| Variable | `S3_BUCKET` | 前端静态桶名 |
| Variable | `CLOUDFRONT_ID` | CloudFront 分发 ID |
| Secret | `AWS_ACCESS_KEY_ID` | 部署用 IAM 用户（仅需 S3 写 + CloudFront 失效权限） |
| Secret | `AWS_SECRET_ACCESS_KEY` | 同上 |

> 部署用 IAM 用户最小权限：`s3:PutObject/DeleteObject/ListBucket`（目标桶）+ `cloudfront:CreateInvalidation`。

## 4. 发布 / 一键部署
- **出版本**：`git tag v1.0.0 && git push origin v1.0.0` → `release.yml` 构建并把 `dist.zip` 附到 Release。
- **一键部署**：Actions → **Deploy** → Run workflow → 自动构建 + `s3 sync` + CloudFront 失效。

## 5. 后端 CORS
后端需把允许来源收紧到本前端域名（`https://www.your-domain.com`），见后端 `DEPLOY.md`「CORS」小节。
