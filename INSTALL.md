# 安装指南

## 前置条件

- Android 设备已安装 [Operit](https://github.com/AAswordman/Operit) 客户端
- 有阿里云账号 + 至少一个 OSS bucket
- RAM 控制台创建了 AccessKey（推荐**只用 OSS 单 bucket 读写权限**的子账号 Key）

## 步骤 1：下载包文件

两种方式：

**A. 直接下载（简单）**

```bash
# 在电脑或手机浏览器里打开
https://github.com/peng05526-stack/operit-aliyun-oss-upload-sandbox/raw/main/aliyun_oss_upload.js
# 下载到 /sdcard/Download/aliyun_oss_upload.js
```

**B. Git 克隆（推荐，可看历史）**

```bash
git clone https://github.com/peng05526-stack/operit-aliyun-oss-upload-sandbox.git
cd operit-aliyun-oss-upload-sandbox
# 把 aliyun_oss_upload.js 复制到 /sdcard/Download/aliyun_oss_upload.js
```

## 步骤 2：烧录到 Operit 沙箱

在 Operit 对话里执行：

```js
operit_editor.debug_install_js_package({
  source_path: "/sdcard/Download/aliyun_oss_upload.js",
  enable_after_install: true,
  activate_after_install: true
})
```

烧录成功会自动：
- 复制到 `Android/data/com.ai.assistance.operit/files/packages/aliyun_oss_upload.js`
- 启用该包
- 加载包元数据

## 步骤 3：配置环境变量

依次执行（把你的真实值替换进去）：

```js
operit_editor.write_environment_variable({
  key: "ALIYUN_OSS_ACCESS_KEY_ID",
  value: "LTAI5txxxxxxxxxxxxxxx"
})
operit_editor.write_environment_variable({
  key: "ALIYUN_OSS_ACCESS_KEY_SECRET",
  value: "5UfYJGnyxxxxxxxxxxxxxxxxxxxxxxxx"
})
operit_editor.write_environment_variable({
  key: "ALIYUN_OSS_BUCKET",
  value: "your-bucket-name"
})
operit_editor.write_environment_variable({
  key: "ALIYUN_OSS_ENDPOINT",
  value: "https://oss-cn-hangzhou.aliyuncs.com"  // 改成你 bucket 的实际 endpoint
})
// 可选：默认前缀
operit_editor.write_environment_variable({
  key: "ALIYUN_OSS_DEFAULT_PREFIX",
  value: "operit/"
})
```

## 步骤 4：连通性自检

```js
use_package("aliyun_oss_upload")
main()
```

预期输出（4 项全绿）：

```json
{
  "success": true,
  "message": "Aliyun OSS 包配置 + crypto + 本地 key 索引 + sign_url 正常。",
  "data": {
    "checks": [
      { "name": "env", "result": { "ALIYUN_OSS_ACCESS_KEY_ID": "...(24 chars)" } },
      { "name": "crypto", "result": { "sha1": "ok", "hmac_sha1": "ok" } },
      { "name": "index", "result": { "items_count": 0, "is_new": true } },
      { "name": "sign_url", "result": { "ok": true } }
    ]
  }
}
```

## 步骤 5：第一次真实上传

```js
upload_file({
  file_content: "Hello from Operit!",
  object_key: "test/first-upload.txt"
})
```

预期拿到一个公网 URL，浏览器可直接打开。

## 故障排查

| 现象 | 原因 | 解决 |
|---|---|---|
| `env` check failed | 环境变量没设 / 拼错 | 重新设置；注意 ID 和 Secret 是 2 个独立变量 |
| `crypto` check failed | 包代码被破坏 | 重新烧录；不要手动改 IIFE 主体 |
| `HTTP 403 SignatureDoesNotMatch` | AKS 错了 / clock skew > 15min | 检查 Secret；同步系统时间 |
| `HTTP 403 AccessDenied` | AK 没 bucket 写权限 | 在 RAM 控制台加 `oss:PutObject` 权限 |
| 上传成功但浏览器下载而非预览 | 沙箱 Content-Type 强制 | 见 README「沙箱 HTTP 桥 4 大限制」第 1 条 |
| 中文 key 上传失败 | 历史 bug，已修复 | 升级到最新版本（>= v1.0.4） |

## 升级

```js
// 拉最新代码（git 方式）
// 或重新下载 aliyun_oss_upload.js 覆盖 /sdcard/Download/
// 然后重新 debug_install_js_package
operit_editor.debug_install_js_package({
  source_path: "/sdcard/Download/aliyun_oss_upload.js",
  enable_after_install: true,
  activate_after_install: true
})
```

## 卸载

```js
// 1. 停用
operit_editor.set_sandbox_package_enabled({
  package_name: "aliyun_oss_upload",
  enabled: false
})
// 2. 删除文件
// 用文件管理器删除：
// /sdcard/Android/data/com.ai.assistance.operit/files/packages/aliyun_oss_upload.js
// /sdcard/Download/Operit/dev_package/aliyun_oss_upload/_key_index.jsonl
```