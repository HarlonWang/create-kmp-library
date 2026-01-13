#!/usr/bin/env node

import * as fs from 'node:fs'
import * as path from 'node:path'

import prompts from 'prompts'
import { bold, green, red } from 'kolorist'

import { postOrderDirectoryTraverse } from './utils/directoryTraverse'
import renderTemplate from './utils/renderTemplate'
import getCommand from './utils/getCommand'
import { applyReplacementsInDir, movePackagePlaceholderDirs } from './utils/replacements'

function isValidKotlinPackageName(packageName: string): boolean {
    return /^([A-Za-z_][A-Za-z0-9_]*)(\.[A-Za-z_][A-Za-z0-9_]*)*$/.test(packageName)
}

function canSkipEmptying(dir: string): boolean {
    if (!fs.existsSync(dir)) {
        return true
    }

    const files = fs.readdirSync(dir)
    if (files.length === 0) {
        return true
    }

    return files.length === 1 && files[0] === '.git'
}

function emptyDir(dir: string): void {
    if (!fs.existsSync(dir)) {
        return
    }

    postOrderDirectoryTraverse(
        dir,
        (dirPath) => fs.rmdirSync(dirPath),
        (filePath) => fs.unlinkSync(filePath),
    )
}

function toPackagePath(packageName: string): string {
    return packageName.replace(/\./g, '/')
}

function toFrameworkName(input: string): string {
    const parts = input
        .split(/[^A-Za-z0-9]+/g)
        .map((s) => s.trim())
        .filter(Boolean)

    const camel = parts
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join('')
        .replace(/^[^A-Za-z]+/, '')

    return camel.length > 0 ? camel : 'Shared'
}

function tryInjectPromptsFromEnv(): void {
    const raw = process.env.CREATE_KMP_LIBRARY_INJECT
    if (!raw) {
        return
    }
    try {
        const injected = JSON.parse(raw)
        if (Array.isArray(injected)) {
            prompts.inject(injected)
        }
    } catch {
        // ignore
    }
}

function toExtraKotlinTargetsSnippet(needsJvm: boolean): string {
    if (!needsJvm) {
        return ''
    }

    return [
        '    jvm {',
        '        compilations.configureEach {',
        '            compileTaskProvider.configure {',
        '                compilerOptions {',
        '                    jvmTarget.set(JvmTarget.JVM_11)',
        '                }',
        '            }',
        '        }',
        '    }',
        '',
    ].join('\n')
}

async function init(): Promise<void> {
    console.log('\ncreate-kmp-library\n')

    const defaultProjectName = 'kmp-library'
    let targetDir = defaultProjectName

    let result: {
        projectName?: string
        shouldOverwrite?: boolean
        groupId?: string
        artifactId?: string
        version?: string
        packageName?: string
        projectType?: 'kmp' | 'cmp'
        needsJvm?: boolean
    } = {}

    try {
        tryInjectPromptsFromEnv()
        result = await prompts([
            {
                name: 'projectName',
                type: 'text',
                message: '项目名称（也是目录名）:',
                initial: defaultProjectName,
                onState: (state) => {
                    const value = String(state.value).trim()
                    targetDir = value.length > 0 ? value : defaultProjectName
                },
            },
            {
                name: 'shouldOverwrite',
                type: () => (canSkipEmptying(targetDir) ? null : 'confirm'),
                message: () => {
                    const dirForPrompt = targetDir === '.' ? '当前目录' : `目标目录 “${targetDir}”`
                    return `${dirForPrompt} 非空，是否清空后继续？`
                },
                initial: false,
            },
            {
                name: 'overwriteChecker',
                type: (_, values) => {
                    if (values.shouldOverwrite === false && !canSkipEmptying(targetDir)) {
                        throw new Error(red('✖') + ' 已取消')
                    }
                    return null
                },
            },
            {
                name: 'groupId',
                type: 'text',
                message: 'Maven groupId:',
                initial: 'com.example',
            },
            {
                name: 'artifactId',
                type: 'text',
                message: 'Maven artifactId:',
                initial: () => targetDir.replace(/\\s+/g, '-').toLowerCase(),
            },
            {
                name: 'version',
                type: 'text',
                message: '版本号（version）:',
                initial: '0.1.0',
            },
            {
                name: 'packageName',
                type: 'text',
                message: 'Kotlin 包名（package）:',
                initial: (prev, values) => {
                    const groupId = String(values.groupId ?? 'com.example').trim()
                    const artifactId = String(values.artifactId ?? 'kmp').trim()
                        .replace(/[^A-Za-z0-9_]+/g, '_')
                        .replace(/^_+/, '')
                        .replace(/_+$/, '')
                    return `${groupId}.${artifactId}`.replace(/\.+/g, '.')
                },
                validate: (value) => isValidKotlinPackageName(String(value).trim()) || '包名不合法（只能包含字母/数字/下划线，并用 . 分隔）',
            },
            {
                name: 'projectType',
                type: 'select',
                message: '工程类型:',
                choices: [
                    { title: 'KMP library（只共享逻辑）', value: 'kmp' },
                    { title: 'CMP library（Compose Multiplatform UI 库）', value: 'cmp' },
                ],
                initial: 0,
            },
            {
                name: 'needsJvm',
                type: 'toggle',
                message: '额外支持 JVM target？',
                initial: false,
                active: '是',
                inactive: '否',
            },
        ], {
            onCancel: () => {
                throw new Error(red('✖') + ' 已取消')
            },
        })
    } catch (e: any) {
        console.log(e?.message ?? String(e))
        process.exit(1)
    }

    const projectName = String(result.projectName ?? defaultProjectName).trim() || defaultProjectName
    targetDir = projectName
    const groupId = String(result.groupId ?? 'com.example').trim()
    const artifactId = String(result.artifactId ?? projectName).trim()
    const version = String(result.version ?? '0.1.0').trim()
    const packageName = String(result.packageName ?? `${groupId}.lib`).trim()
    const projectType = result.projectType ?? 'kmp'
    const needsJvm = Boolean(result.needsJvm)

    const cwd = process.cwd()
    const root = path.resolve(cwd, targetDir)

    if (fs.existsSync(root) && !canSkipEmptying(root) && result.shouldOverwrite) {
        emptyDir(root)
    } else if (!fs.existsSync(root)) {
        fs.mkdirSync(root, { recursive: true })
    }

    const templateRoot = path.resolve(__dirname, 'template')
    const baseTemplate = projectType === 'cmp' ? 'base-cmp' : 'base-kmp'

    renderTemplate(path.resolve(templateRoot, baseTemplate), root)
    if (needsJvm) {
        renderTemplate(path.resolve(templateRoot, 'target-jvm'), root)
    }

    movePackagePlaceholderDirs(root, toPackagePath(packageName))

    const frameworkName = toFrameworkName(artifactId)
    const androidAppId = `${packageName}.androidapp`
    const iosBundleId = `${packageName}.iosapp`

    applyReplacementsInDir(root, {
        '__PROJECT_NAME__': projectName,
        '__GROUP_ID__': groupId,
        '__ARTIFACT_ID__': artifactId,
        '__VERSION__': version,
        '__PACKAGE__': packageName,
        '__PACKAGE_PATH__': toPackagePath(packageName),
        '__FRAMEWORK_NAME__': frameworkName,
        '__ANDROID_APPLICATION_ID__': androidAppId,
        '__IOS_BUNDLE_ID__': iosBundleId,
        '__EXTRA_KOTLIN_TARGETS__': toExtraKotlinTargetsSnippet(needsJvm),
    })

    const gradlewPath = path.resolve(root, 'gradlew')
    if (fs.existsSync(gradlewPath)) {
        fs.chmodSync(gradlewPath, 0o755)
    }

    const userAgent = process.env.npm_config_user_agent ?? ''
    const packageManager = /pnpm/.test(userAgent) ? 'pnpm' : /yarn/.test(userAgent) ? 'yarn' : 'npm'

    console.log(`\n完成！项目已生成在 ${root}\n`)
    console.log('下一步：')
    console.log()
    if (root !== cwd) {
        console.log(`  ${bold(green(`cd ${path.relative(cwd, root)}`))}`)
    }
    console.log(`  ${bold(green('./gradlew build'))}`)
    console.log()
    console.log('运行 Android（模拟器或真机）：')
    console.log(`  ${bold(green('./gradlew :androidApp:installDebug'))}`)
    console.log()
    console.log('运行 iOS（模拟器或真机）：')
    console.log(`  ${bold(green('open iosApp/iosApp.xcodeproj'))}`)
    console.log()
    console.log(`如需安装 Node 依赖：${bold(green(getCommand(packageManager, 'install')))}`)
    console.log()
}

init().catch((e) => {
    console.error(e)
    process.exit(1)
})
