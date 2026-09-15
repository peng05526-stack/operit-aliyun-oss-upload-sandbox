# Operit 沙盒包：阿里云 OSS 上传 / 删除 / 列出 / 签名 URL

> 把手机本地文件（图片、文档、截图、音频）传到阿里云 OSS 公网可访问，或给私有 bucket 的对象生成临时签名 URL。

## 适用场景

- 把手机本地文件（图片、文档、截图、音频）传到 OSS 公网可访问
- 给私有 bucket 的对象生成临时签名 URL，分享给他人限时访问
- 批量管理 / 清理 OSS 上的对象
- 跑连通性自检，确认凭证 + 网络 + 沙箱 HTTP 桥一切正常

## 工具一览

| 工具 | 作用 |
|---|---|
| `upload_file` | 上传本地文件 / 文本到 OSS，返回公网 URL |
| `delete_object` | 删除 OSS 上的一个对象 |
| `list_objects` | 按前缀列出本包上传过的对象（本地索引视图，非服务端 ListObjects） |
| `sign_url` | 为对象生成临时签名 URL（GET），用于私有 bucket 分享 |
| `main` | 连通性自检：env 配置 + SHA1/HMAC 标准向量 + 本地索引 + sign_url |

## 环境准备（必须 4 项，可选 1 项）

在 Operit Android 客户端里调用 `operit_editor.write_environment_variable` 设置：

| 变量 | 必填 | 说明 |
|---|---|---|
| `ALIYUN_OSS_ACCESS_KEY_ID` | ✅ | AccessKey ID |
| `ALIYUN_OSS_ACCESS_KEY_SECRET` | ✅ | AccessKey Secret |
| `ALIYUN_OSS_BUCKET` | ✅ | Bucket 名 |
| `ALIYUN_OSS_ENDPOINT` | ✅ | Endpoint URL（如 `https://oss-cn-hangzhou.aliyuncs.com`） |
| `ALIYUN_OSS_DEFAULT_PREFIX` | ❌ | upload_file 不传 object_key 时用的默认前缀 |

## 安装

1. 下载本仓库的 `aliyun_oss_upload.js`
2. 在 Operit 里调用 `operit_editor.debug_install_js_package(source_path="/sdcard/Download/aliyun_oss_upload.js")` 烧录
3. 配置上面 4 个环境变量
4. 调用 `aliyun_oss_upload:main` 跑自检，4 项全绿表示就绪
5. 调用 `use_package("aliyun_oss_upload")` 即可在对话里使用

## 快速上手

```js
// 1) 上传一段文本
use_package("aliyun_oss_upload")
upload_file({
  file_content: "Hello, OSS!",
  object_key: "notes/hello.txt"
})

// 2) 上传本地图片
upload_file({
  file_path: "/sdcard/Pictures/photo.png",
  object_key: "img/2025-01-01/photo.png"
})

// 3) 给私有对象生成 1 小时签名 URL
sign_url({
  object_key: "img/photo.png",
  expires_seconds: 3600
})

// 4) 删除一个对象
delete_object({ object_key: "notes/hello.txt" })

// 5) 列出我上传过的 key
list_objects({ prefix: "img/" })
```

## 沙箱 HTTP 桥 4 大限制（必读）

`aliyun_oss_upload.js` 在 Operit 沙箱里跑，实际发请求依赖沙箱的 `Tools.Net.http` 桥，这个桥有 4 个硬限制：

1. **Content-Type 强制** — 沙箱会自动给请求加 `Content-Type: application/json; charset=utf-8`，**无法**通过 `header` 参数覆盖
   - 对策：OSS 实际存储的 Content-Type 几乎都是 `application/json; charset=utf-8`；想让浏览器直接预览图片，事后用 `sign_url` 配合 `?response-content-type=image/png` 或用 OSS 控制台 / CopyObject 修正

2. **multipart/form-data 不可签** — V1 签名要求把每个 part 的 hash 都进 StringToSign，沙箱发不出合法的 multipart
   - 对策：本包只走 `PUT /<key>` 单 PUT 上传，不支持 POST multipart 批量上传

3. **`x-oss-*` 头副作用** — 沙箱会保留请求里所有 `x-oss-*` 头（用户头、ACL、StorageClass 等），它们会进 StringToSign
   - 对策：本包严格按 OSS V1 规范拼头：把请求头按小写 key 字典序排序，OSS 规定的 `x-oss-*` 头放进 CanonicalizedOSSHeaders

4. **Body 必须可重放** — 签名 StringToSign 里有 body 的 SHA1，沙箱要求 body 是 string 或有限大小的 buffer
   - 对策：超大文件（> 50MB）应改用分片上传（OSS multipart），本包当前不实现

## OSS V1 签名关键规则（实现笔记）

- `Authorization: OSS <AKID>:<Signature>`，Signature = Base64(HMAC-SHA1(AccessKeySecret, StringToSign))
- StringToSign 5 段：`VERB\nContent-MD5\nContent-Type\nDate\nCanonicalizedOSSHeaders + CanonicalizedResource`
- `CanonicalizedResource` = `/{bucket}/{object-key}`，**注意：object-key 用原始 UTF-8，不做 percent-encode**（HTTP URL 里才 percent-encode，签名里是原始字符）
- 支持中文 / 非 ASCII object_key，**HTTP URL 走 percent-encode，StringToSign 走 raw UTF-8**

## 凭证安全提醒

⚠️ 你的阿里云 AccessKey 已经暴露在本对话里（包括 ID + Secret + Bucket + Endpoint），**强烈建议**：

1. 立即去 https://ram.console.aliyun.com/manage/ak 撤销这把 Key
2. 重新创建一把，只授权 OSS 单一 bucket 的最小权限
3. 避免把 AccessKey 写在任何会被 git 提交的代码里

## 仓库信息

- owner: `peng05526-stack`
- repo: `operit-aliyun-oss-upload-sandbox`
- 配套平台：[Operit](https://github.com/AAswordman/Operit)
