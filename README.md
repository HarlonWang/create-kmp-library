# create-kmp-library

通过 `npm create kmp-library` 快速创建 Kotlin Multiplatform library 工程（支持 KMP / CMP），并默认包含可运行的 Android / iOS 宿主 App。

## 环境要求

- Node.js >= 18
- Xcode >= 16（仅 Apple Silicon）

## 本地开发

```sh
npm install
npm run build
node out.js
```

## 使用方式（发布后）

```sh
npm create kmp-library
```

## iOS 配置入口

生成后的 iOS 宿主工程固定为 `iosApp`，相关配置统一收敛在 `iosApp/Configuration/Config.xcconfig`（例如 `TEAM_ID`、`PRODUCT_BUNDLE_IDENTIFIER`、`MARKETING_VERSION` 等）。
