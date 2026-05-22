# 变更日志

## v2.0.1 (2026-05-22)

### 修复的问题

**1. QuotaService 定时器泄露与竞态条件**
- 修复了在停止轮询时未清除重试定时器 (`retryTimeout`) 的问题。
- 在成功获取配额以及调用 `stopPolling()` 时主动清除定时器，杜绝了后台无意义网络请求和竞态冲突。

**2. 状态栏 "NaNs from now" 显示问题**
- 针对模型配额的重置时间进行了防漏保护，在 `parseModelQuota` 中加入 `isNaN` 检测，并在时间计算与格式化 `formatTimeUntilReset` 中增加防御逻辑，避免出现 `"NaNs from now"` 格式错误。

**3. Windows 平台下高精度端口匹配精度修复**
- 修复了 `windowsProcessDetector.ts` 中 PID 模糊匹配的缺陷（之前使用 `findstr "${pid}"` 匹配子串导致误匹配其它端口）。
- 重构 `getPortListCommand` 改用 Windows 原生 `findstr` 的正则表达式 `[ \t][ \t]*${pid}$` 进行完全匹配，确保精准捕捉当前语言服务器（Language Server）占用的监听端口。

**4. 端口覆盖一致性修复**
- 修正了 `setPorts` 方法，在传入新的 `httpPort` 为 `undefined` 时保留原有端口，避免由于不一致的覆盖导致请求链路中断。

### 文件修改清单

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `src/quotaService.ts` | 修改 | 修复定时器泄露、NaN 容错处理及端口覆盖逻辑 |
| `src/windowsProcessDetector.ts` | 修改 | 重构 `findstr` 端口匹配过滤，提升 Windows 进程探测精度 |
| `CHANGELOG.md` | 修改 | 记录 2.0.1 版本的详细变更日志 |

---

## v1.0.4 (2026-05-22)

### 修复的问题

**1. API 请求字段错误**

修复了 Google API 请求中 `metadata` 对象包含不支持字段的问题：

- **错误信息**：
  ```
  Invalid JSON payload received. Unknown name "os" at 'metadata': Cannot find field.
  Invalid JSON payload received. Unknown name "extensionVersion" at 'metadata': Cannot find field.
  ```

- **修复内容**：
  - `src/api/googleCloudCodeClient.ts`：移除了 `loadProjectInfo` 方法中 metadata 的 `os` 和 `extensionVersion` 字段
  - `src/api/antigravityClient.ts`：移除了 `buildMetadataBody` 方法中 metadata 的 `os`、`extensionVersion` 和 `ideVersion` 字段

### 新增功能

**1. 多端点回退机制**

在 `src/quotaService.ts` 中添加了配额 API 的多端点回退机制：

- 配置了三个 API 端点：
  1. `daily-cloudcode-pa.sandbox.googleapis.com`（沙箱环境）
  2. `daily-cloudcode-pa.googleapis.com`（日常环境）
  3. `cloudcode-pa.googleapis.com`（生产环境）

- 当某个端点返回 429（请求过多）或 5xx（服务器错误）时，自动切换到下一个端点

**2. 增强的 403 错误处理**

- 当请求带有 `project_id` 返回 403 时，自动剥离 `project_id` 重试
- 如果仍然返回 403，标记账号为禁止访问状态
- 在 `QuotaSnapshot` 中添加了 `isForbidden` 和 `forbiddenReason` 属性

### 代码优化

- 修复了 TypeScript 编译错误（`model.remainingQuota` 可能为 undefined）
- 修复了 ESLint 警告（`no-constant-condition`、`no-prototype-builtins`）
- 移除了未使用的代码和导入

### 文件修改清单

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `src/api/googleCloudCodeClient.ts` | 修改 | 移除 metadata 中的不支持字段 |
| `src/api/antigravityClient.ts` | 修改 | 移除 metadata 中的不支持字段 |
| `src/quotaService.ts` | 修改 | 添加多端点回退机制、增强错误处理 |
| `src/types.ts` | 修改 | 添加 `isForbidden` 和 `forbiddenReason` 字段 |
| `package.json` | 修改 | 版本号升级到 2.0.1 |

### 打包结果

- **文件路径**：`antigravity-quota-watcher-2.0.1.vsix`
