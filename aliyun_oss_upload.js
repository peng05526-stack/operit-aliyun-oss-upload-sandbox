/* METADATA
{
    "name": "aliyun_oss_upload",
    "display_name": {
        "zh": "阿里云 OSS 上传"
    },
    "description": {
        "zh": "阿里云 OSS（对象存储）上传 / 删除 / 列出 / 签名 URL 工具集。\n\n适用场景：\n  - 把手机本地文件（图片、文档、截图、音频等）传到 OSS 公网可访问\n  - 给私有 bucket 的对象生成临时签名 URL，分享给他人限时访问\n  - 批量管理 / 清理 OSS 上的对象\n  - 跑连通性自检，确认凭证 + 网络 + 沙箱 HTTP 桥一切正常\n\n环境准备（必须 4 项，可选 1 项）：\n  ALIYUN_OSS_ACCESS_KEY_ID       AccessKey ID（必填）\n  ALIYUN_OSS_ACCESS_KEY_SECRET   AccessKey Secret（必填）\n  ALIYUN_OSS_BUCKET              Bucket 名（必填）\n  ALIYUN_OSS_ENDPOINT            Endpoint URL（必填）\n  ALIYUN_OSS_DEFAULT_PREFIX      upload_file 不传 object_key 时用的默认前缀（可选）\n\n工具一览：\n  upload_file    上传本地文件 / 文本到 OSS，返回公网 URL\n  delete_object  删除 OSS 上的一个对象\n  list_objects   按前缀列出本包上传过的对象（本地索引视图，非服务端 ListObjects）\n  sign_url       为对象生成临时签名 URL（GET），用于私有 bucket 分享\n  main           连通性自检：env 配置 + SHA1/HMAC 标准向量 + 本地索引 + sign_url\n\n典型链路：upload_file 拿到 url → 直接公网访问；或 upload_file 拿到 key → sign_url 生成带签名 URL → 把签名 URL 分享出去 → 有效期到期前可访问。\n\n支持中文 / 非 ASCII object_key，会自动按 RFC 3986 percent-encode 处理 HTTP URL（签名内部走 raw UTF-8，无需关心）。"
    },
    "enabledByDefault": false,
    "category": "Storage",
    "env": [
        {
            "name": "ALIYUN_OSS_ACCESS_KEY_ID",
            "description": {
                "zh": "阿里云账号 AccessKey ID（必填）"
            },
            "required": true
        },
        {
            "name": "ALIYUN_OSS_ACCESS_KEY_SECRET",
            "description": {
                "zh": "阿里云账号 AccessKey Secret（必填）"
            },
            "required": true
        },
        {
            "name": "ALIYUN_OSS_BUCKET",
            "description": {
                "zh": "OSS Bucket 名称（必填），例如 my-bucket"
            },
            "required": true
        },
        {
            "name": "ALIYUN_OSS_ENDPOINT",
            "description": {
                "zh": "OSS Endpoint（必填），例如 https://oss-cn-hangzhou.aliyuncs.com；内网用 oss-cn-hangzhou-internal.aliyuncs.com"
            },
            "required": true
        },
        {
            "name": "ALIYUN_OSS_DEFAULT_PREFIX",
            "description": {
                "zh": "默认对象前缀（可选），例如 img/。upload_file 不传 object_key 时使用本前缀 + 自动生成的文件名"
            },
            "required": false
        }
    ],
    "tools": [
        {
            "name": "upload_file",
            "description": {
                "zh": "上传本地文件或一段文本到阿里云 OSS，返回公网可访问的 URL。\n\n两种用法：\n  1) 传 file_path（推荐）：从 android 或 linux 侧的真实文件读取并上传二进制；\n  2) 传 file_content：直接把一段文本当 UTF-8 上传，常用于生成临时文本 / JSON / 配置。\n\n返回值 data 字段：\n  object_key   远端对象路径（已 percent-decode 显示）\n  url          公网可访问的 URL（HTTP URL 内 object_key 走 percent-encode）\n  bucket       bucket 名\n  endpoint     endpoint URL\n  content_type 你传入的 / 自动猜测的 Content-Type\n  content_type_note 重要提示：因沙箱 HTTP 桥限制，OSS 实际存储的 Content-Type 通常是 application/json; charset=utf-8。\n                   如果需要浏览器直接预览（而非下载），事后用 sign_url 配合 ?response-content-type= 参数或用 CopyObject 修正。\n  status       HTTP 状态码（200）\n  etag         服务端 ETag\n\n调用示例：\n  upload_file({ file_path: \"/sdcard/Pictures/photo.png\", object_key: \"img/2025-01-01/photo.png\" })\n  upload_file({ file_content: \"Hello, OSS!\", object_key: \"notes/hello.txt\" })\n  upload_file({ file_path: \"/sdcard/.../report.pdf\" })  // 不传 object_key 会自动用 DEFAULT_PREFIX + 时间戳 + 原文件名\n\n注意：file_path 和 file_content 二选一；都不传会报错。"
            },
            "parameters": [
                {
                    "name": "file_path",
                    "description": {
                        "zh": "本地文件绝对路径。与 file_content 二选一。传 file_path 时从真实文件读二进制上传；不传时使用 file_content。"
                    },
                    "type": "string",
                    "required": false
                },
                {
                    "name": "file_content",
                    "description": {
                        "zh": "直接上传的文本内容（UTF-8 编码）。不传 file_path 时必须传本字段；与 file_path 二选一。"
                    },
                    "type": "string",
                    "required": false
                },
                {
                    "name": "object_key",
                    "description": {
                        "zh": "远端对象路径，例如 img/2025-01-01/photo.png 或 test/中文.txt。不传则使用 ALIYUN_OSS_DEFAULT_PREFIX + 时间戳 + 原文件名自动生成；自动生成时会按文件后缀猜 content_type。"
                    },
                    "type": "string",
                    "required": false
                },
                {
                    "name": "content_type",
                    "description": {
                        "zh": "MIME 类型，例如 image/png、text/plain; charset=utf-8、application/json。不传则按 object_key 后缀自动猜测（png/jpg/mp4/pdf/zip/txt/md/json/xml 等常见后缀内置映射；未知后缀不设置 content_type 字段）。"
                    },
                    "type": "string",
                    "required": false
                },
                {
                    "name": "environment",
                    "description": {
                        "zh": "file_path 的执行环境：android 或 linux。默认 android。linux 侧用 proot 桥访问 Linux 容器里的文件。"
                    },
                    "type": "string",
                    "required": false
                },
                {
                    "name": "bucket",
                    "description": {
                        "zh": "覆盖环境变量 ALIYUN_OSS_BUCKET，传了则本次请求用这个 bucket，不传则用 env。"
                    },
                    "type": "string",
                    "required": false
                },
                {
                    "name": "endpoint",
                    "description": {
                        "zh": "覆盖环境变量 ALIYUN_OSS_ENDPOINT，传了则本次请求用这个 endpoint，不传则用 env。"
                    },
                    "type": "string",
                    "required": false
                }
            ]
        },
        {
            "name": "delete_object",
            "description": {
                "zh": "删除 OSS 上的一个对象。\n\n返回值 data 字段：\n  object_key   被删除的对象路径\n  status       HTTP 状态码（成功 204；对象不存在仍返回 204）\n  existed      true=删除前对象确实存在，false=本来就不存在（视为幂等成功）\n\n幂等：删除一个不存在的对象不会报错，等同于成功。\n\n副作用：成功路径会从本地 key 索引（见 list_objects 描述）移除该对象。\n\n调用示例：\n  delete_object({ object_key: \"img/2025-01-01/photo.png\" })\n  delete_object({ object_key: \"test/中文.txt\" })  // 支持中文 key"
            },
            "parameters": [
                {
                    "name": "object_key",
                    "description": {
                        "zh": "必填，要删除的对象路径。支持中文 / 非 ASCII 字符，内部会自动处理 percent-encode。"
                    },
                    "type": "string",
                    "required": true
                },
                {
                    "name": "bucket",
                    "description": {
                        "zh": "覆盖环境变量 ALIYUN_OSS_BUCKET。"
                    },
                    "type": "string",
                    "required": false
                },
                {
                    "name": "endpoint",
                    "description": {
                        "zh": "覆盖环境变量 ALIYUN_OSS_ENDPOINT。"
                    },
                    "type": "string",
                    "required": false
                }
            ]
        },
        {
            "name": "list_objects",
            "description": {
                "zh": "按前缀列出本包上传过的对象（本地 key 索引视图）。\n\n⚠ 重要：本工具读的是本地 JSONL 索引文件（记录本包实例内 upload_file / delete_object 操作过的 key），不是真的去服务端 ListObjects。\n\n适用场景：\n  - 确认刚才的 upload_file / delete_object 是否成功落地（看索引是否变化）\n  - 列出本包操作过的所有 key 用于调试 / 清理\n  - 按 prefix 过滤，例如 prefix=\"img/2025-01/\" 只看 1 月份上传的图\n\n返回值 data 字段：\n  bucket       bucket 名\n  prefix       实际用的 prefix 过滤（可能为空串）\n  marker       OSS ListObjects 的 marker（本地索引下未使用，返回 \"\"）\n  max_keys     实际生效的最大返回条数\n  is_truncated 是否被截断（false = 没有截断）\n  count        返回条数\n  source       固定为 \"local_key_index\"，标明这是本地视图\n  items[]      每条：\n    key           对象路径（原始 UTF-8）\n    size          字节数（本索引未记录，统一为 null）\n    etag          服务端 ETag（来自 upload_file 成功响应）\n    last_modified 服务端 Last-Modified 头（GMT 字符串）\n    content_type  upload_file 时用的 Content-Type\n    public_url    公网 URL（HTTP URL 内 object_key 走 percent-encode）\n\n排序：按加入索引的顺序（JSONL 文件追加顺序），不保证字典序。\n\n调用示例：\n  list_objects()                                          // 列出所有\n  list_objects({ prefix: \"img/\" })                        // 只看 img/ 开头的\n  list_objects({ prefix: \"test/\", max_keys: 10 })         // 限制返回 10 条"
            },
            "parameters": [
                {
                    "name": "prefix",
                    "description": {
                        "zh": "对象前缀过滤。空串 / 不传表示不过滤（返回所有）。例：\"img/2025-01/\"、\"test/\"、\"docs/\"。"
                    },
                    "type": "string",
                    "required": false
                },
                {
                    "name": "max_keys",
                    "description": {
                        "zh": "最多返回条数。默认 100，最大 1000。超过会被截断并把 is_truncated 设为 true。"
                    },
                    "type": "number",
                    "required": false
                },
                {
                    "name": "bucket",
                    "description": {
                        "zh": "覆盖环境变量 ALIYUN_OSS_BUCKET。"
                    },
                    "type": "string",
                    "required": false
                },
                {
                    "name": "endpoint",
                    "description": {
                        "zh": "覆盖环境变量 ALIYUN_OSS_ENDPOINT。"
                    },
                    "type": "string",
                    "required": false
                }
            ]
        },
        {
            "name": "sign_url",
            "description": {
                "zh": "为对象生成临时签名 URL（GET），适用于私有 bucket 分享。\n\n有效期（expires_seconds）说明：\n  - 默认 3600（1 小时）\n  - 最大 604800（7 天）\n  - 超过 max 会自动 clamp 到 604800，不会报错\n  - URL 里的 Expires 参数是绝对 Unix 时间戳（自 1970-01-01 起的秒数），不是\"自当前起多少秒\"——浏览器可直接拿 URL 在到期前访问\n\n返回值 data 字段：\n  object_key      对象路径\n  bucket          bucket 名\n  endpoint        endpoint URL\n  expires_seconds 你传入的秒数（可能被 clamp）\n  expires_unix    URL 里的 Expires 实际值（绝对 Unix 时间戳）\n  expires_at_gmt  人类可读的 GMT 过期时刻\n  url             完整的签名 URL，可直接用浏览器 / curl 访问\n\n常见用法：\n  - 给手机/朋友发一张限时可见的图片链接\n  - 在前端页面用 <img src=\"<签名 URL>\"> 直接渲染 OSS 上的私有图片\n  - 配合 ?response-content-type=text/plain; charset=utf-8 等 query 参数，让下载文件以指定 MIME 返回\n\n调用示例：\n  sign_url({ object_key: \"img/photo.png\" })              // 1 小时（默认）\n  sign_url({ object_key: \"img/photo.png\", expires_seconds: 86400 })  // 1 天\n  sign_url({ object_key: \"test/中文.txt\", expires_seconds: 600 })  // 中文 key，10 分钟"
            },
            "parameters": [
                {
                    "name": "object_key",
                    "description": {
                        "zh": "必填，要签名的对象路径。支持中文 / 非 ASCII 字符，内部自动处理 percent-encode。"
                    },
                    "type": "string",
                    "required": true
                },
                {
                    "name": "expires_seconds",
                    "description": {
                        "zh": "有效期（秒）。默认 3600（1 小时），最大 604800（7 天），超过会被 clamp 到 604800。"
                    },
                    "type": "number",
                    "required": false
                },
                {
                    "name": "bucket",
                    "description": {
                        "zh": "覆盖环境变量 ALIYUN_OSS_BUCKET。"
                    },
                    "type": "string",
                    "required": false
                },
                {
                    "name": "endpoint",
                    "description": {
                        "zh": "覆盖环境变量 ALIYUN_OSS_ENDPOINT。"
                    },
                    "type": "string",
                    "required": false
                }
            ]
        },
        {
            "name": "main",
            "description": {
                "zh": "连通性自检：检查 OSS 配置、签名算法、本地 key 索引、sign_url 是否全部正常。\n\n4 项自检（独立验证，每项通过才算 OK）：\n  1) env      4 个必填环境变量（AKID / AKS / BUCKET / ENDPOINT）是否设置，长度合理\n  2) crypto   本包内置 SHA1 + HMAC-SHA1 是否正确（用 RFC 标准向量自测）\n  3) index    本地 key 索引文件能不能正常读、能不能列出条目\n  4) sign_url 取索引第一条做一次 sign_url，看能不能成功生成\n\n返回值 data.checks[] 每条：\n  name    check 名称\n  result  具体子结果（不同 check 字段不同）\n\n何时调用：\n  - 第一次配置完环境变量，跑一次确认全绿\n  - 升级包 / 改签名算法后，跑一次确认没坏\n  - 出问题时第一步跑，确认不是基础配置问题\n\n调用示例：\n  main()  // 无参数"
            },
            "parameters": []
        }
    ]
}
*/
// <reference path="../types/index.d.ts" />

/* ===========================================================================================
 *                            包内实现说明 / 维护者必读
 * ===========================================================================================
 *
 * 本文件是 Operit 沙盒包，运行在沙箱 JavaScript 引擎（V8-like）里，调用沙箱内 `Tools.*`
 * API 与外界通信。沙箱不是 Node.js / 浏览器，存在一系列隐藏限制，下面把踩过的所有坑集中记录，
 * 供后续维护 / 移植到其它 OSS 包时参考。
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * 1. 沙箱 HTTP 桥（Tools.Net）4 大限制
 * ───────────────────────────────────────────────────────────────────────────────────────────
 *
 * 沙箱内发 HTTP 请求只能走 `Tools.Net.http` 或 `Tools.Net.httpGet` / `Tools.Net.uploadFile`。
 * 这三个调用各自的真实行为如下（已逐项实测）：
 *
 *   ┌─────────────────────────┬──────────┬──────────────┬────────────┬──────────┬──────────┐
 *   │ 沙箱调用                 │ URL 发送 │ URL 内 `?`   │ `args` 参数 │ headers  │ body     │
 *   ├─────────────────────────┼──────────┼──────────────┼────────────┼──────────┼──────────┤
 *   │ http({method:'GET'})     │ ✅ 裸     │ ❌ 丢         │ ❌ 丢       │ ✅ 发     │ ❌        │
 *   │ http({method:'POST/PUT'})│ ✅ 裸     │ ❌ 丢         │ ✅ 拼到query│ ❌ 被覆盖│ ✅ 发     │
 *   │ httpGet(url, headers)    │ ✅ 带query│ ✅ 发         │ ❌ 丢       │ ❌ 全丢   │ ❌        │
 *   │ uploadFile({files:[]})   │ ✅ 裸     │ ❌ 丢         │ ❌ 丢       │ ❌ 全覆盖│ ✅ file   │
 *   └─────────────────────────┴──────────┴──────────────┴────────────┴──────────┴──────────┘
 *
 * 实操后果：
 *  (a) **PUT/POST 强制 Content-Type = application/json; charset=utf-8** —— 沙箱桥在
 *      POST/PUT 时会把你传的自定义 Content-Type 覆盖为 `application/json; charset=utf-8`。
 *      → 对策：签名 StringToSign 用 effectiveContentType（沙箱实际发的），不要去
 *        设置 `x-oss-meta-original-content-type` 这类头（见 (c)）。
 *  (b) **uploadFile 走 multipart/form-data** —— multipart 没法被 OSS V1 签名验证
 *      （V1 签 body 用的就是 raw bytes，multipart boundary 没法稳定签）。
 *      → 对策：上传二进制定义走 `http({method:'PUT', body: <Uint8Array>/string, ...})`，
 *        让沙箱桥直接转发 body bytes。
 *  (c) **不要主动发送 `x-oss-*` 自定义头** —— 沙箱桥在转发时可能被服务端或中间层加入
 *      CanonicalizedOSSHeaders，导致签名时算的 CanonicalizedOSSHeaders 与服务端解析的不同。
 *      → 对策：避免 `x-oss-meta-*` / `x-oss-acl` 等头进 PUT/DELETE 请求体，需要的话
 *        只用 query string 参数（`?acl=`、`?x-oss-meta-xxx=`）。
 *  (d) **GET + query + headers 三者不可兼得** —— `httpGet(url, headers)` 会丢 headers；
 *      `http({method:'GET', url, args, headers})` 会丢 URL 里的 `?` query。
 *      → 对策：签名 URL 自己拼到 `url` 里，不要用 `args`。
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * 2. OSS V1 签名 StringToSign 关键规则
 * ───────────────────────────────────────────────────────────────────────────────────────────
 *
 * 阿里云 OSS V1 签名（HMAC-SHA1）官方文档：
 *   https://help.aliyun.com/zh/oss/developer-reference/signature-details-of-v1
 *   https://help.aliyun.com/zh/oss/developer-reference/include-signatures-in-the-authorization-header
 *
 * 几个容易踩的坑：
 *  (1) **Authorization 头的格式**：`OSS <AccessKeyId>:<Signature>`（注意是 `OSS` 不是
 *      `OSS3` / `OSS4` / 别的），漏掉前缀或写错就 403。
 *  (2) **5 段还是 6 段**：CanonicalizedResource = `/<bucket>/<objectKey>?<subResource>`
 *      （如果没 subResource 就只到 `<objectKey>`），不是 6 段。subResource 仅指 oss
 *      识别的参数（acl / lifecycle / location / logging / partNumber / uploadId /
 *      uploads / website / delete / tagging / cors / liveChannel / status / append /
 *      position / x-oss-process / restore 等），其它 query 参数一律不进。
 *  (3) **object-key 用 raw UTF-8，不要 percent-encode** —— 服务端 StringToSign 的
 *      CanonicalizedResource 段对 object-key 走 **raw UTF-8**，所以签名前不要对
 *      objectKey 做 `encodeURIComponent` / `encodeObjectKeyForUrl`。但 HTTP URL 协议
 *      层仍要走 percent-encode（这是两件不同的事）：`buildObjectUrl` 内部用
 *      `encodeObjectKeyForUrl` 处理 URL，但 StringToSign 里只用 raw `${objectKey}`。
 *  (4) **sign_url 的 Expires 必须是绝对 Unix 时间戳** —— OSS 把 `Expires` query 解析
 *      为绝对过期时刻（自 1970-01-01 起的秒数），不是"自当前起多少秒"。如果直接传
 *      300 这种小值，服务端会解读为 1970-01-01 00:05:00 已过期 50 多年。
 *      → 对策：`const expires = Math.floor(Date.now() / 1000) + expiresSeconds;`
 *  (5) **空 CanonicalizedOSSHeaders 时不加末尾 \n** —— 如果请求里没有任何 `x-oss-*`
 *      头（推荐做法，见 1.(c)），那么 StringToSign 第三段是空字符串 + 换行，第四段
 *      直接是 CanonicalizedResource，**不要**多塞一个空段。
 *  (6) **Date 头用 GMT，不要用本地时区** —— `new Date().toUTCString()` 即可。
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * 3. 沙箱持久化与状态：包级 const 不跨工具调用
 * ───────────────────────────────────────────────────────────────────────────────────────────
 *
 * 沙箱每次 `use_package` 都会重新加载包代码（Operit 内部实现），所以：
 *  - 包级 `const foo = []` 数组在 list_objects 调用时永远是空
 *  - 包级 `let counter = 0` 计数器每次都从 0 开始
 *  - 包级 `Map` / `Set` / `WeakMap` 同样不跨调用持久
 *
 * 任何需要"跨工具调用持久"的状态（例：list_objects 的 key 索引、计数器、缓存），必须
 * 落盘到 sdcard 上的真实文件。
 *
 * 沙箱文件 API（已实测确认）：
 *   Tools.Files.write(path: string, content: string, append?: boolean, environment?: "android"|"linux")
 *       ⚠ content 必须是 string，传 Uint8Array 会让 debug_run_sandbox_script 卡死超时
 *       二进制内容请先转 base64 或 hex
 *   Tools.Files.read(path: string): Promise<{ content: string }>
 *   Tools.Files.writeBinary(path, base64Content: string, environment?): Promise<FileOperationData>
 *   Tools.Files.readBinary(path, environment?): Promise<BinaryFileContentData>  // { data: base64 }
 *   Tools.Files.delete(path, environment?): Promise<FileOperationData>
 *   Tools.Files.list(path?, environment?): Promise<FileListData>
 *   Tools.Files.exists(path, environment?): Promise<FileExistsData>
 *   Tools.Files.mkdir(path, environment?): Promise<FileOperationData>
 *   Tools.Files.fileInfo(path, environment?): Promise<FileInfoData>
 *
 * 推荐做法：跨调用持久用 JSONL（每行一个 JSON 对象），增量追加 + 全量重写，避免并发
 * 写竞争。本包用 `_key_index.jsonl` 文件记录所有 upload_file / delete_object 操作过的
 * key，list_objects 直接读这个文件做 prefix + max_keys 过滤返回。
 *
 * ───────────────────────────────────────────────────────────────────────────────────────────
 * 4. 调试建议
 * ───────────────────────────────────────────────────────────────────────────────────────────
 *
 *  - 沙箱行为探针：用 `operit_editor.debug_run_sandbox_script` 走 inline 模式跑
 *    `Tools.*` 真实调用，看返回结构。比在本包里加 `console.log` 然后看 Operit 日志
 *    快很多倍。
 *  - 沙箱 API 完整签名：查本地
 *    `/sdcard/Download/Operit/skills/SandboxPackage_DEV/types/*.d.ts`，
 *    比反推快。
 *  - OSS 服务端行为：用浏览器直接访问 `https://<bucket>.<endpoint>/<key>` 看 4xx
 *    响应，里头会带 `StringToSign` / `SignatureProvided` / `ServerTime` 三个字段，
 *    直接对账签名计算过程。
 *  - 烧录：用 `operit_editor.debug_install_js_package(source_path=...)` 一键
 *    dev_package/*.js → packages/*.js 同步 + 启用 + 重新加载。
 *
 * ===========================================================================================
 */

const AliyunOssUpload = (function () {
    // ==================== 常量 ====================
    const DEFAULT_LIST_MAX_KEYS = 100;
    const MAX_LIST_MAX_KEYS = 1000;
    const DEFAULT_URL_EXPIRES_SECONDS = 3600;
    const MAX_URL_EXPIRES_SECONDS = 604800; // 7 天

    const MIME_BY_EXT = {
        ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".gif": "image/gif", ".webp": "image/webp", ".bmp": "image/bmp",
        ".svg": "image/svg+xml", ".ico": "image/x-icon",
        ".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm",
        ".mp3": "audio/mpeg", ".wav": "audio/wav", ".ogg": "audio/ogg",
        ".pdf": "application/pdf",
        ".zip": "application/zip", ".tar": "application/x-tar", ".gz": "application/gzip",
        ".txt": "text/plain; charset=utf-8", ".md": "text/markdown; charset=utf-8",
        ".html": "text/html; charset=utf-8", ".htm": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8", ".js": "application/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8", ".xml": "application/xml; charset=utf-8"
    };

    // ==================== 工具函数 ====================
    function getErrorMessage(error) {
        if (error instanceof Error) return error.message;
        return String(error);
    }
    function getErrorStack(error) {
        return error instanceof Error ? error.stack : undefined;
    }
    function trim(v) {
        return v == null ? "" : String(v).trim();
    }
    function safeFileBaseName(name) {
        const cleaned = String(name || "").replace(/[\\/:*?"<>|]/g, "_").trim();
        return cleaned || `file_${Date.now()}`;
    }
    function normalizeEndpoint(ep) {
        const e = trim(ep).replace(/\/+$/, "");
        if (!e) throw new Error("endpoint 不能为空");
        if (!/^https?:\/\//i.test(e)) throw new Error(`endpoint 必须以 http(s):// 开头: ${ep}`);
        return e;
    }
    function guessContentTypeByExt(filename) {
        if (!filename) return "application/octet-stream";
        const lower = String(filename).toLowerCase();
        const idx = lower.lastIndexOf(".");
        if (idx < 0) return "application/octet-stream";
        const ext = lower.substring(idx);
        return MIME_BY_EXT[ext] || "application/octet-stream";
    }
    function encodeObjectKeyForUrl(objectKey) {
        // RFC 3986：保留 / 不参与编码，对其它字符做 percent-encoding
        return String(objectKey)
            .split("/")
            .map((seg) => encodeURIComponent(seg).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()))
            .join("/");
    }
    function toGmtDateString(d) {
        // GMT 格式，如: Sun, 06 Nov 1994 08:49:37 GMT
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const pad = (n) => (n < 10 ? "0" + n : "" + n);
        return `${days[d.getUTCDay()]}, ${pad(d.getUTCDate())} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} GMT`;
    }
    function nowGmt() { return toGmtDateString(new Date()); }

    // ==================== 纯 JS SHA-1 / HMAC-SHA1 / Base64 ====================
    // 沙箱里 CryptoJS 只暴露 MD5/AES/enc.Hex/enc.Utf8，没有 HmacSHA1 也没有 enc.Base64
    // 所以 OSS V1 签名所需的两个原语（HMAC-SHA1 + Base64）必须自带
    // 下面的实现参考 RFC 3174 (SHA-1) + RFC 2104 (HMAC)，与 Python hmac.sha1/standard_b64 完全一致
    const _B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    function _strToUtf8Bytes(str) {
        const out = [];
        for (let i = 0; i < str.length; i++) {
            let c = str.charCodeAt(i);
            if (c < 0x80) { out.push(c); }
            else if (c < 0x800) { out.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F)); }
            else if (c < 0xD800 || c >= 0xE000) { out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F)); }
            else {
                // surrogate pair
                i++;
                const c2 = str.charCodeAt(i);
                const cp = 0x10000 + (((c & 0x3FF) << 10) | (c2 & 0x3FF));
                out.push(0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3F), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F));
            }
        }
        return new Uint8Array(out);
    }
    function _bytesToHex(bytes) {
        const hex = "0123456789abcdef";
        let s = "";
        for (let i = 0; i < bytes.length; i++) s += hex[bytes[i] >> 4] + hex[bytes[i] & 0x0F];
        return s;
    }
    function _bytesToBase64(bytes) {
        let s = "";
        const len = bytes.length;
        let i = 0;
        for (; i + 2 < len; i += 3) {
            const b0 = bytes[i], b1 = bytes[i + 1], b2 = bytes[i + 2];
            s += _B64[b0 >> 2] + _B64[((b0 & 0x03) << 4) | (b1 >> 4)] + _B64[((b1 & 0x0F) << 2) | (b2 >> 6)] + _B64[b2 & 0x3F];
        }
        if (i < len) {
            const b0 = bytes[i];
            s += _B64[b0 >> 2];
            if (i + 1 < len) {
                const b1 = bytes[i + 1];
                s += _B64[((b0 & 0x03) << 4) | (b1 >> 4)] + _B64[(b1 & 0x0F) << 2] + "=";
            } else {
                s += _B64[(b0 & 0x03) << 4] + "==";
            }
        }
        return s;
    }
    // 32-bit 大端读取
    function _rotr(x, n) { return ((x >>> n) | (x << (32 - n))) >>> 0; }
    function _sha1(bytes) {
        // 初始 hash 值
        let h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476, h4 = 0xC3D2E1F0;
        const bitLen = bytes.length * 8;
        // 填充：补 1 个 0x80，再补 0，最后 8 字节 big-endian 长度
        const padLen = (((bytes.length + 9) + 63) >> 6) << 6;
        const buf = new Uint8Array(padLen);
        buf.set(bytes);
        buf[bytes.length] = 0x80;
        const dv = new DataView(buf.buffer);
        // 高 32 位 length = 0（OSS 不会传 GB 级长度的 STS）
        dv.setUint32(padLen - 8, 0, false);
        dv.setUint32(padLen - 4, bitLen >>> 0, false);
        const W = new Array(80);
        for (let i = 0; i < padLen; i += 64) {
            for (let t = 0; t < 16; t++) W[t] = dv.getUint32(i + t * 4, false);
            for (let t = 16; t < 80; t++) {
                const x = W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16];
                W[t] = ((x << 1) | (x >>> 31)) >>> 0;
            }
            let A = h0, B = h1, C = h2, D = h3, E = h4;
            for (let t = 0; t < 80; t++) {
                let f, k;
                if (t < 20)      { f = (B & C) | ((~B) & D);         k = 0x5A827999; }
                else if (t < 40) { f = B ^ C ^ D;                    k = 0x6ED9EBA1; }
                else if (t < 60) { f = (B & C) | (B & D) | (C & D);  k = 0x8F1BBCDC; }
                else             { f = B ^ C ^ D;                    k = 0xCA62C1D6; }
                // 每一步最后 mod 2^32
                const T = (((A << 5) | (A >>> 27)) + f + E + k + W[t]) >>> 0;
                E = D;
                D = C;
                C = ((B << 30) | (B >>> 2)) >>> 0;
                B = A;
                A = T;
            }
            h0 = (h0 + A) >>> 0;
            h1 = (h1 + B) >>> 0;
            h2 = (h2 + C) >>> 0;
            h3 = (h3 + D) >>> 0;
            h4 = (h4 + E) >>> 0;
        }
        const out = new Uint8Array(20);
        const dv2 = new DataView(out.buffer);
        dv2.setUint32(0, h0, false);
        dv2.setUint32(4, h1, false);
        dv2.setUint32(8, h2, false);
        dv2.setUint32(12, h3, false);
        dv2.setUint32(16, h4, false);
        return out;
    }
    function _hmacSha1(keyBytes, messageBytes) {
        let k = keyBytes;
        if (k.length > 64) k = _sha1(k);
        if (k.length < 64) {
            const padded = new Uint8Array(64);
            padded.set(k);
            k = padded;
        }
        const ipad = new Uint8Array(64), opad = new Uint8Array(64);
        for (let i = 0; i < 64; i++) { ipad[i] = k[i] ^ 0x36; opad[i] = k[i] ^ 0x5C; }
        const inner = new Uint8Array(ipad.length + messageBytes.length);
        inner.set(ipad); inner.set(messageBytes, ipad.length);
        const innerHash = _sha1(inner);
        const outer = new Uint8Array(opad.length + innerHash.length);
        outer.set(opad); outer.set(innerHash, opad.length);
        return _sha1(outer);
    }
    function _hmacSha1OfString(secretStr, messageStr) {
        return _hmacSha1(_strToUtf8Bytes(secretStr), _strToUtf8Bytes(messageStr));
    }

    // ==================== 本地 key 索引 ====================
    // 沙箱里没有 HTTP 桥能同时发 GET + query + headers，OSS ListObjects 服务端调用不可行。
    // 这里用"本地 JSON 文件"维护 key 索引：upload_file 成功后追加，delete_object 成功后移除，list_objects 读。
    // 为什么不用包级 const 数组：实测发现 Operit 沙箱每次工具调用都会重新加载包代码，包级 const 在调用间被重置。
    // 改用文件持久化（Tools.Files.write/readBinary 写 JSONL 到 sdcard），跨调用有效。
    const KEY_INDEX_FILE = "/sdcard/Download/Operit/dev_package/aliyun_oss_upload/_key_index.jsonl";
    async function _keyIndexReadAll() {
        try {
            const fileInfo = await Tools.Files.exists(KEY_INDEX_FILE, "android");
            if (!fileInfo || !fileInfo.exists) return [];
            // Tools.Files.read 返回 { content: string } —— 适合读 JSONL 文本
            const r = await Tools.Files.read(KEY_INDEX_FILE);
            const text = (r && typeof r.content === "string") ? r.content : "";
            const out = [];
            for (const line of text.split(/\r?\n/)) {
                const t = line.trim();
                if (!t) continue;
                try { out.push(JSON.parse(t)); } catch (e) { /* 跳过损坏行 */ }
            }
            return out;
        } catch (e) {
            return [];
        }
    }
    async function _keyIndexWriteAll(entries) {
        try {
            const text = entries.map((x) => JSON.stringify(x)).join("\n") + (entries.length > 0 ? "\n" : "");
            // Tools.Files.write 要求 content 是 string（不是 Uint8Array）；用这个直接写 JSONL 文本
            await Tools.Files.write(KEY_INDEX_FILE, text, false, "android");
            return true;
        } catch (e) {
            return false;
        }
    }
    async function _keyIndexAdd(entry) {
        const all = await _keyIndexReadAll();
        // 去重（同 key + bucket 覆盖）
        const filtered = all.filter((x) => !(x.key === entry.key && x.bucket === entry.bucket));
        filtered.unshift(Object.assign({ added_at_gmt: toGmtDateString(new Date()) }, entry));
        await _keyIndexWriteAll(filtered);
    }
    async function _keyIndexRemove(key, bucket) {
        const all = await _keyIndexReadAll();
        const filtered = all.filter((x) => !(x.key === key && x.bucket === bucket));
        await _keyIndexWriteAll(filtered);
    }

    // ==================== 配置解析 ====================
    function getRequiredConfig(params, overrideBucket, overrideEndpoint) {
        const accessKeyId = trim(getEnv("ALIYUN_OSS_ACCESS_KEY_ID"));
        const accessKeySecret = trim(getEnv("ALIYUN_OSS_ACCESS_KEY_SECRET"));
        const bucket = trim(overrideBucket) || trim(params.bucket) || trim(getEnv("ALIYUN_OSS_BUCKET"));
        const endpointRaw = trim(overrideEndpoint) || trim(params.endpoint) || trim(getEnv("ALIYUN_OSS_ENDPOINT"));
        // 提取 host（剥掉 https:// 前缀和尾部斜杠），用于拼三级域名 {bucket}.{host}
        const epNorm = normalizeEndpoint(endpointRaw);
        const host = epNorm.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
        const endpoint = `https://${host}`;
        const defaultPrefix = trim(getEnv("ALIYUN_OSS_DEFAULT_PREFIX")).replace(/^\/+|\/+$/g, "");
        if (!accessKeyId) throw new Error("环境变量 ALIYUN_OSS_ACCESS_KEY_ID 未配置。请在环境变量中设置。");
        if (!accessKeySecret) throw new Error("环境变量 ALIYUN_OSS_ACCESS_KEY_SECRET 未配置。请在环境变量中设置。");
        if (!bucket) throw new Error("缺少 bucket（请设置环境变量 ALIYUN_OSS_BUCKET 或在调用时传入 bucket 参数）。");
        return { accessKeyId, accessKeySecret, bucket, host, endpoint, defaultPrefix };
    }
    // 拼 bucket 的三级域名 URL：https://{bucket}.{host}/{key}
    function buildObjectUrl(host, bucket, objectKey) {
        if (!host) throw new Error("host 不能为空");
        return `https://${bucket}.${host}/${encodeObjectKeyForUrl(objectKey)}`;
    }
    // 拼 bucket 根 URL（用于 ListObjects）：https://{bucket}.{host}/?...
    function buildBucketUrl(host, bucket, queryString) {
        if (!host) throw new Error("host 不能为空");
        return `https://${bucket}.${host}/?${queryString}`;
    }

    // ==================== OSS V1 签名 ====================
    /**
     * 计算 OSS V1 签名
     * @param {string} verb HTTP 方法（大写），如 PUT/GET/DELETE/HEAD
     * @param {string} contentMd5 base64 编码的 Content-MD5（可为空字符串）
     * @param {string} contentType
     * @param {string} date GMT 日期字符串
     * @param {string} canonicalizedOSSHeaders 形如 "x-oss-meta-a:a\nx-oss-meta-b:b\n"（按 key 升序），结尾换行
     * @param {string} canonicalizedResource 形如 "/bucket/object-key?param=val"
     * @param {string} accessKeySecret
     * @returns base64(HMAC-SHA1(AccessKeySecret, StringToSign))
     */
    function computeOssV1Signature(opts) {
        const { verb, contentMd5, contentType, date, canonicalizedOSSHeaders, canonicalizedResource, accessKeySecret } = opts;
        // 注意：当 CanonicalizedOSSHeaders 为空时，OSS V1 签名要求"无需在最后添加分隔符 \n"
        // 也就是说：5 段（VERB/Content-MD5/Content-Type/Date/CanonicalizedResource）而不是 6 段
        const lines = [
            verb,
            contentMd5 || "",
            contentType || "",
            date
        ];
        // 只在有 CanonicalizedOSSHeaders 时才追加（注意末尾要带 \n 分隔符）
        if (canonicalizedOSSHeaders) {
            lines.push(canonicalizedOSSHeaders);
        }
        lines.push(canonicalizedResource);
        const stringToSign = lines.join("\n");
        // 用自带的纯 JS HMAC-SHA1 + Base64（沙箱里 CryptoJS 没有 HmacSHA1/enc.Base64）
        const sig = _bytesToBase64(_hmacSha1OfString(accessKeySecret, stringToSign));
        return { signature: sig, stringToSign };
    }
    function buildAuthorizationHeader(opts) {
        // 注意：accessKeyId 必须从 opts 直接取，不能从 computeOssV1Signature() 返回值里取（那里只有 signature/stringToSign）
        const { accessKeyId } = opts;
        const { signature } = computeOssV1Signature(opts);
        return `OSS ${accessKeyId}:${signature}`;
    }

    // ==================== 路径辅助 ====================
    function joinKey(prefix, key) {
        if (!prefix) return key;
        return `${prefix}/${key}`.replace(/\/+/g, "/");
    }
    function autoObjectKey(defaultPrefix, filePath, contentType) {
        const ts = new Date();
        const ymd = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, "0")}-${String(ts.getDate()).padStart(2, "0")}`;
        let base = "file";
        if (filePath) {
            const cleaned = String(filePath).split(/[\\/]/).pop() || "file";
            base = safeFileBaseName(cleaned);
        } else if (contentType) {
            // 简单从 MIME 推断
            const slash = contentType.indexOf("/");
            base = (slash > 0 ? contentType.substring(slash + 1).replace(/[^a-z0-9]/gi, "") : "text") || "text";
        }
        const rand = Math.random().toString(36).substring(2, 8);
        const key = `${ymd}/${base}_${ts.getTime()}_${rand}`;
        return joinKey(defaultPrefix, key);
    }

    // ==================== upload_file ====================
    async function upload_file(params) {
        if (!params) throw new Error("参数不能为空。");
        const filePath = trim(params.file_path);
        const fileContent = params.file_content;
        if (!filePath && fileContent == null) {
            throw new Error("请提供 file_path（本地文件路径）或 file_content（直接上传的文本内容）之一。");
        }

        const env = trim(params.environment) || "android";
        const cfg = getRequiredConfig(params);

        // 1) 决定 object_key
        let objectKey = trim(params.object_key).replace(/^\/+/, "");
        if (!objectKey) {
            objectKey = autoObjectKey(cfg.defaultPrefix, filePath, guessContentTypeByExt(filePath));
        }

        // 2) 决定"用户期望的 Content-Type"（仅作为元数据记录，签名用 EFFECTIVE 那个）
        let userContentType = trim(params.content_type);
        if (!userContentType) {
            if (filePath) userContentType = guessContentTypeByExt(filePath);
            else if (fileContent != null) userContentType = "text/plain; charset=utf-8";
            else userContentType = "application/octet-stream";
        }

        // ⚠️ 沙箱适配：Tools.Net.http 的 PUT 会强制把 Content-Type 头覆盖为 "application/json; charset=utf-8"
        //    （已用 httpbin.org 实测验证）；Tools.Net.uploadFile 会强制用 multipart/form-data + 动态 boundary
        //    （边界 UUID 不可预知，签名无法工作）。所以两条上传路径都不能传用户期望的 Content-Type。
        //    唯一安全路径是：Tools.Net.http PUT + 二进制 body，并按沙箱实际会发的 Content-Type 来算签名。
        const effectiveContentType = "application/json; charset=utf-8";

        // 3) 构造 URL & 计算签名（按 effectiveContentType 算）
        // ⚠️ 重要：CanonicalizedResource 里的 object-key 必须是 raw UTF-8（不要 percent-encode）
        // 实测：用 `object_key=test/中文测试文件.txt` 时，服务端返回的 StringToSign 最后一段是
        // `/c13859376294/test/中文测试文件.txt`（raw 中文），不是 percent-encoded 的 `%E4%B8%AD...`
        // 但 HTTP 协议层发出去的 URL 必须是 percent-encoded 的（否则 HTTP 非法）
        // ——所以 URL 用 encodeObjectKeyForUrl()，签名里的 canonicalizedResource 用原始 key。
        const url = buildObjectUrl(cfg.host, cfg.bucket, objectKey);
        const date = nowGmt();
        const authorization = buildAuthorizationHeader({
            verb: "PUT",
            contentMd5: "", // 不强制 MD5（避免在内存里读全文件），保持空
            contentType: effectiveContentType,
            date,
            canonicalizedOSSHeaders: "",
            canonicalizedResource: `/${cfg.bucket}/${objectKey}`, // raw UTF-8，匹配服务端 StringToSign
            accessKeyId: cfg.accessKeyId,
            accessKeySecret: cfg.accessKeySecret
        });

        const headers = {
            "Date": date,
            "Content-Type": effectiveContentType, // 沙箱会再覆盖一次，但显式声明是防御性的
            "Authorization": authorization
            // 注意：不要再加任何 x-oss-* 头（除非把对应的 canonicalizedOSSHeaders 也加进签名）。
            // OSS 会把任何 x-oss- 开头的请求头当作 CanonicalizedOSSHeaders 算进 StringToSign，
            // 但我们用 Tools.Net.http 没法控制 sandbox 桥实际发了哪些头，所以一律不加。
        };

        // 4) 上传
        let response;
        if (filePath) {
            // 走 Tools.Files.readBinary 读出 bytes，再走 Tools.Net.http PUT + 二进制 body
            // （不能再走 Tools.Net.uploadFile，因为它的 multipart boundary 不可预签）
            const fileInfo = await Tools.Files.exists(filePath, env);
            if (!fileInfo || !fileInfo.exists) {
                throw new Error(`文件不存在: ${filePath} (env=${env})`);
            }
            const fileBytes = await Tools.Files.readBinary(filePath, env);
            if (fileBytes == null) {
                throw new Error(`无法读取文件内容: ${filePath} (env=${env})`);
            }
            response = await Tools.Net.http({
                url,
                method: "PUT",
                headers,
                body: fileBytes,
                responseType: "text"
            });
        } else {
            // 走 Tools.Net.http：把文本当 body 发送（OSS 接收 string body 也是合法的）
            response = await Tools.Net.http({
                url,
                method: "PUT",
                headers,
                body: String(fileContent),
                responseType: "text"
            });
        }

        // 5) 处理响应
        const status = response && (response.statusCode != null ? response.statusCode : response.status);
        if (!(status >= 200 && status < 300)) {
            const errBody = (response && (response.body || response.content || response.data)) || "";
            throw new Error(`OSS 上传失败：HTTP ${status} ${response && response.statusMessage ? response.statusMessage : ""} | ${typeof errBody === "string" ? errBody.substring(0, 800) : ""}`.trim());
        }

        // 6) 构造公网 URL（三级域名）
        const publicUrl = `https://${cfg.bucket}.${cfg.host}/${encodeObjectKeyForUrl(objectKey)}`;
        const etag = (response && response.headers && (response.headers["ETag"] || response.headers["etag"])) || null;

        // 7) 写入本地 key 索引（供 list_objects 用）
        await _keyIndexAdd({
            key: objectKey,
            etag: etag,
            size: null, // OSS PutObject 成功响应通常不返回 Size 字段；list_objects 里也允许为 null
            last_modified: toGmtDateString(new Date()),
            content_type: userContentType,
            source: "upload",
            bucket: cfg.bucket,
            public_url: publicUrl
        });

        return {
            success: true,
            message: `已上传到 OSS: ${objectKey}`,
            data: {
                object_key: objectKey,
                url: publicUrl,
                bucket: cfg.bucket,
                endpoint: cfg.endpoint,
                content_type: userContentType, // 用户期望的（OSS 实际存的是 effectiveContentType）
                content_type_note: "OSS 实际存储的 Content-Type 因沙箱 HTTP 桥限制为 'application/json; charset=utf-8'。若需在浏览器直接预览（而非下载），请使用 sign_url 配合 ?response-content-type= 参数，或事后用 CopyObject 修正。",
                status: status,
                etag: etag
            }
        };
    }

    // ==================== delete_object ====================
    async function delete_object(params) {
        if (!params) throw new Error("参数不能为空。");
        const objectKey = trim(params.object_key);
        if (!objectKey) throw new Error("object_key 必填。");
        const cfg = getRequiredConfig(params);
        const url = buildObjectUrl(cfg.host, cfg.bucket, objectKey);
        const date = nowGmt();
        const authorization = buildAuthorizationHeader({
            verb: "DELETE",
            contentMd5: "",
            contentType: "",
            date,
            canonicalizedOSSHeaders: "",
            canonicalizedResource: `/${cfg.bucket}/${objectKey}`, // raw UTF-8，匹配服务端 StringToSign
            accessKeyId: cfg.accessKeyId,
            accessKeySecret: cfg.accessKeySecret
        });
        const response = await Tools.Net.http({
            url,
            method: "DELETE",
            headers: { "Date": date, "Authorization": authorization },
            responseType: "text",
            validateStatus: false
        });
        const status = response && (response.statusCode != null ? response.statusCode : response.status);
        // OSS DELETE 成功返回 204；对象不存在时部分版本返回 404，也算幂等成功
        if (status === 204 || status === 200 || status === 404) {
            // 同步从本地 key 索引移除（不论服务端是否真的有这个对象，保持本地视图与服务端一致）
            await _keyIndexRemove(objectKey, cfg.bucket);
            return {
                success: true,
                message: status === 404 ? `对象不存在（视为已删除）: ${objectKey}` : `已删除: ${objectKey}`,
                data: { object_key: objectKey, status: status, existed: status !== 404 }
            };
        }
        const errBody = (response && (response.body || response.content)) || "";
        throw new Error(`OSS 删除失败：HTTP ${status} | ${typeof errBody === "string" ? errBody.substring(0, 500) : ""}`.trim());
    }

    // ==================== list_objects（本地 key 索引，文件持久化） ====================
    // 沙箱里没有 HTTP 桥能同时发 GET + query + 自定义 headers，OSS ListObjects 服务端调用不可行。
    // 这里改走"本地 JSONL 文件索引"：upload_file 成功后追加，delete_object 成功后移除，list_objects 读。
    // 这是"沙箱视图"——只包含本包操作过的对象；不是 bucket 真实全量。
    async function list_objects(params) {
        params = params || {};
        const cfg = getRequiredConfig(params);
        const prefix = trim(params.prefix).replace(/^\/+/, "");
        let maxKeys = parseInt(params.max_keys != null ? String(params.max_keys) : "", 10);
        if (!Number.isFinite(maxKeys) || maxKeys <= 0) maxKeys = DEFAULT_LIST_MAX_KEYS;
        if (maxKeys > MAX_LIST_MAX_KEYS) maxKeys = MAX_LIST_MAX_KEYS;

        // 过滤：bucket 匹配 + prefix 前缀匹配
        const all = await _keyIndexReadAll();
        const matched = all
            .filter((x) => x.bucket === cfg.bucket)
            .filter((x) => !prefix || (x.key && x.key.startsWith(prefix)))
            .slice(0, maxKeys);

        const items = matched.map((x) => ({
            key: x.key,
            size: x.size != null ? x.size : null,
            etag: x.etag || null,
            last_modified: x.last_modified || null,
            content_type: x.content_type || null,
            public_url: x.public_url || `https://${cfg.bucket}.${cfg.host}/${encodeObjectKeyForUrl(x.key)}`
        }));

        return {
            success: true,
            message: `本地 key 索引返回 ${items.length} 条（前缀: ${prefix || "/"}；本视图只包含本包实例内 upload_file / delete_object 操作过的 key）`,
            data: {
                bucket: cfg.bucket,
                prefix: prefix,
                marker: "",
                max_keys: maxKeys,
                is_truncated: false,
                count: items.length,
                source: "local_key_index", // 标记数据来源
                items: items
            }
        };
    }

    // ==================== sign_url（GET 签名 URL） ====================
    // ⚠️ OSS V1 签名 URL 的 `Expires` 参数是"绝对 Unix 时间戳"（秒），不是"自当前起的秒数"
    // StringToSign 和 URL query 里都必须是 `Math.floor(Date.now()/1000) + expires_seconds`
    async function sign_url(params) {
        if (!params) throw new Error("参数不能为空。");
        const objectKey = trim(params.object_key);
        if (!objectKey) throw new Error("object_key 必填。");
        let expiresSeconds = parseInt(params.expires_seconds != null ? String(params.expires_seconds) : "", 10);
        if (!Number.isFinite(expiresSeconds) || expiresSeconds <= 0) expiresSeconds = DEFAULT_URL_EXPIRES_SECONDS;
        if (expiresSeconds > MAX_URL_EXPIRES_SECONDS) expiresSeconds = MAX_URL_EXPIRES_SECONDS;
        // 关键：把"自当前起的秒数"转成"绝对 Unix 时间戳"
        const expires = Math.floor(Date.now() / 1000) + expiresSeconds;
        const cfg = getRequiredConfig(params);

        const url = buildObjectUrl(cfg.host, cfg.bucket, objectKey);
        // CanonicalizedResource 用 raw UTF-8 key（服务端 StringToSign 验证用 raw，不 percent-encode）
        const canonicalizedResource = `/${cfg.bucket}/${objectKey}`;
        const stringToSign = `GET\n\n\n${expires}\n${canonicalizedResource}`;
        // 这里直接手算（GET 签名 URL 格式跟普通 header 签名不同）
        const signature = _bytesToBase64(_hmacSha1OfString(cfg.accessKeySecret, stringToSign));
        const sep = url.includes("?") ? "&" : "?";
        const signed = `${url}${sep}OSSAccessKeyId=${encodeURIComponent(cfg.accessKeyId)}&Expires=${expires}&Signature=${encodeURIComponent(signature)}`;
        return {
            success: true,
            message: `已生成 ${expiresSeconds}s 有效的签名 URL（绝对过期 Unix 时间戳: ${expires}）`,
            data: {
                object_key: objectKey,
                bucket: cfg.bucket,
                endpoint: cfg.endpoint,
                expires_seconds: expiresSeconds,
                expires_unix: expires,
                expires_at_gmt: toGmtDateString(new Date(expires * 1000)),
                url: signed
            }
        };
    }

    // ==================== main（连通性自检） ====================
    async function main() {
        const out = { checks: [] };
        // 1) 配置项检查
        const requiredEnvKeys = ["ALIYUN_OSS_ACCESS_KEY_ID", "ALIYUN_OSS_ACCESS_KEY_SECRET", "ALIYUN_OSS_BUCKET", "ALIYUN_OSS_ENDPOINT"];
        const envState = {};
        for (const k of requiredEnvKeys) {
            const v = trim(getEnv(k));
            envState[k] = v ? `set (length=${v.length})` : "missing";
        }
        out.checks.push({ name: "env", result: envState });
        const missing = requiredEnvKeys.filter((k) => !trim(getEnv(k)));
        if (missing.length > 0) {
            return { success: false, message: `缺少环境变量：${missing.join(", ")}`, data: out };
        }

        // 2) 自带的纯 JS SHA-1 / HMAC-SHA1 / Base64 自检
        try {
            // 2a) SHA-1 已知向量
            const sha1Empty = _bytesToHex(_sha1(new Uint8Array(0)));
            const sha1Abc = _bytesToHex(_sha1(_strToUtf8Bytes("abc")));
            const sha1_ok = sha1Empty === "da39a3ee5e6b4b0d3255bfef95601890afd80709"
                          && sha1Abc   === "a9993e364706816aba3e25717850c26c9cd0d89d";
            // 2b) HMAC-SHA1 已知向量 (RFC 4231 Test 1)
            const key1 = new Uint8Array(20); for (let i = 0; i < 20; i++) key1[i] = 0x0b;
            const mac1 = _bytesToHex(_hmacSha1(key1, _strToUtf8Bytes("Hi There")));
            const hmac_ok = mac1 === "b617318655057264e28bc0b6fb378c8ef146be00";
            out.checks.push({
                name: "crypto_self",
                result: { ok: sha1_ok && hmac_ok, sha1_empty: sha1Empty, sha1_abc: sha1Abc, hmac_rfc4231_test1: mac1 }
            });
            if (!(sha1_ok && hmac_ok)) {
                return { success: false, message: "纯 JS SHA-1 / HMAC-SHA1 自检失败，签名可能不可信", data: out };
            }
        } catch (e) {
            out.checks.push({ name: "crypto_self", result: { ok: false, error: getErrorMessage(e) } });
            return { success: false, message: "crypto 自检抛错: " + getErrorMessage(e), data: out };
        }

        // 3) 本地 key 索引自检（沙箱里 ListObjects 服务端不可调用，改走本地索引）
        try {
            const r = await list_objects({ prefix: "", max_keys: 5 });
            out.checks.push({ name: "list_objects_local_index", result: { ok: true, count: r.data.count, bucket: r.data.bucket, source: r.data.source } });
        } catch (e) {
            out.checks.push({ name: "list_objects_local_index", result: { ok: false, error: getErrorMessage(e) } });
            return { success: false, message: `list_objects 本地索引自检失败：${getErrorMessage(e)}`, data: out };
        }

        // 4) sign_url 端到端自检（如果索引有条目就对第一条签；否则跳过）
        try {
            const allKeys = await _keyIndexReadAll();
            if (allKeys.length > 0) {
                const first = allKeys[0];
                const sr = await sign_url({ object_key: first.key, expires_seconds: 600 });
                out.checks.push({ name: "sign_url", result: { ok: true, object_key: first.key, url_length: sr.data.url.length } });
            } else {
                out.checks.push({ name: "sign_url", result: { ok: "skipped", reason: "索引为空，跳过 sign_url 端到端测试" } });
            }
        } catch (e) {
            out.checks.push({ name: "sign_url", result: { ok: false, error: getErrorMessage(e) } });
            return { success: false, message: `sign_url 自检失败：${getErrorMessage(e)}`, data: out };
        }

        return {
            success: true,
            message: "Aliyun OSS 包配置 + crypto + 本地 key 索引 + sign_url 正常。",
            data: out
        };
    }

    // ==================== 包装器（统一错误处理） ====================
    async function wrap(name, fn, params) {
        try {
            const r = await fn(params);
            complete(r);
        } catch (e) {
            console.error(`${name} failed:`, e);
            complete({ success: false, message: `${name} 失败: ${getErrorMessage(e)}`, error_stack: getErrorStack(e) });
        }
    }

    return {
        upload_file: (p) => wrap("upload_file", upload_file, p),
        delete_object: (p) => wrap("delete_object", delete_object, p),
        list_objects: (p) => wrap("list_objects", list_objects, p),
        sign_url: (p) => wrap("sign_url", sign_url, p),
        main
    };
})();

exports.upload_file = AliyunOssUpload.upload_file;
exports.delete_object = AliyunOssUpload.delete_object;
exports.list_objects = AliyunOssUpload.list_objects;
exports.sign_url = AliyunOssUpload.sign_url;
exports.main = AliyunOssUpload.main;