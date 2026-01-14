# create-kmp-library Agent 指南

本文件用于记录 `create-kmp-library` 的已确认约束与实现约定，方便下次启动无需重复补充上下文。

## 交互约定

- 默认使用中文回复，并遵守中英文排版规范（中文与英文/数字之间加空格等）。
- 代码缩进统一使用 4 个空格。
- 涉及代码或文件改动：先给出实现方案说明，再执行修改（除非我明确要求直接修改）。

## 项目定位

- 本仓库是一个 npm 脚手架包：`create-kmp-library`。
- 目标：通过 `npm create kmp-library` 快速生成可运行的 Kotlin Multiplatform library 工程。
- 支持两类模板工程：
    - KMP：纯 Kotlin Multiplatform library（共享逻辑），iOS 宿主用 SwiftUI `Text(...)` 做最简 UI。
    - CMP：Compose Multiplatform library（以 Compose 作为主界面），iOS 宿主用 SwiftUI 包一层 `UIViewControllerRepresentable` 承载 Compose。

## 生成器行为（create-kmp-library）

- 源码入口：`index.ts`。
- 构建产物：`out.js`（由 `npm run build` 生成，`package.json` 的 `bin.create-kmp-library` 指向该文件）。
- 本地调试：`npm install` → `npm run build` → `node out.js`。
- 交互参数（必填）：
    - `projectName` / `groupId` / `artifactId` / `version` / `packageName`
- 交互参数（可选）：
    - `projectType`：`kmp` 或 `cmp`
    - `needsJvm`：是否额外支持 JVM target
- 目标平台约束：
    - 默认生成 Android + iOS
    - JVM 可选
    - wasm 本期不做
    - linuxX64 本期不做（已移除）
- 模板目录：
    - `template/base-kmp`：KMP 模板
    - `template/base-cmp`：CMP 模板
    - `template/target-jvm`：JVM 增量模板
- 模板渲染机制：
    - 模板中的 `_gitignore` 会在渲染时合并到生成工程的 `.gitignore`
    - 已要求忽略生成工程根目录下的 `/.kotlin`

## iOS 宿主约定（方案 B：脚本驱动，不污染仓库）

- iOS 宿主工程名固定为：`iosApp`。
- iOS 最低版本：15.0。
- 仅考虑 Apple Silicon：
    - Simulator：`iosSimulatorArm64`
    - 真机：`iosArm64`
- Xcode 要求：Xcode 16+。
- 配置入口统一使用 `Config.xcconfig`：
    - 路径：`iosApp/Configuration/Config.xcconfig`
    - 典型配置：`TEAM_ID`、`PRODUCT_BUNDLE_IDENTIFIER`、`MARKETING_VERSION` 等
- Kotlin 产物形态：
    - iOS 通过 `.framework` 引用（不使用 `.xcframework`）
    - framework 构建产物不提交到仓库（不污染仓库）
- Framework 集成方式：
    - 不在 Xcode 工程里显式添加 framework 引用
    - `FRAMEWORK_SEARCH_PATHS` / `OTHER_LDFLAGS` 通过 `Config.xcconfig` 配置
    - `iosApp/scripts/build_framework.sh` 在构建期执行 Gradle task，并将 framework 拷贝到 `$(TARGET_BUILD_DIR)`
- 兼容 Xcode Indexing / Planning 阶段：
    - 某些情况下 Xcode 会设置 `OVERRIDE_KOTLIN_BUILD_IDE_SUPPORTED=YES`
    - 脚本策略：仅当 `$(TARGET_BUILD_DIR)/<Framework>.framework` 已存在时才允许跳过，否则必须回退执行 Gradle 构建，避免 Swift `import <Framework>` 报错
- 工程结构约束：
    - 不创建 `iosApp/Frameworks` 空目录
    - 模板工程已移除 Xcode 导航树中的 `Frameworks` 分组（仅保留构建阶段 `PBXFrameworksBuildPhase`）

## Compose 与 Info.plist 约束

- Compose 版本固定：1.9.3。
- CMP iOS 侧需要在 `Info.plist` 中配置：
    - `CADisableMinimumFrameDurationOnPhone = true`
    - 否则 Compose UIKit 侧会做严格校验并抛异常

## 发布能力（生成工程）

- publish 默认开箱即用（基于 vanniktech Maven Publish 插件约定）。
- `enableWasm`、`enablePublish` 等开关本期不做。
- Kotlin / KMP 相关版本尽量沿用 `multiplatform-library-template` 的版本；Compose 版本以 1.9.3 为准。

## npm 发布（本仓库）

- 发布前检查：
    - `npm run build`（生成 `out.js`）
    - `npm pack --dry-run`（可选，检查打包内容）
- 发布命令：
    - `npm publish`
- registry 校验：
    - `npm config get registry`（期望 `https://registry.npmjs.org/`）
- 若遇到 `E403`（需要 2FA 或 token）：
    - 发布到 npm 需要满足其一：账号已开启 2FA，或使用开启了 `bypass 2fa` 的 granular access token
    - 若网页只提供 `Security key` 选项，说明走的是 WebAuthn / Passkey（不是 6 位 TOTP）
    - 自动化发布建议使用 token，并通过项目级 `.npmrc` 或 `--userconfig` 注入

## 回归验证建议

- 生成器无交互回归：
    - 通过环境变量 `CREATE_KMP_LIBRARY_INJECT` 注入 prompts 数组，便于脚本化生成与回归
- iOS 构建回归（Simulator）：
    - `xcodebuild -project iosApp.xcodeproj -scheme iosApp -configuration Debug -destination 'platform=iOS Simulator,name=...,OS=...' build`
