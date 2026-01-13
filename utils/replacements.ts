import * as fs from 'node:fs'
import * as path from 'node:path'

import { postOrderDirectoryTraverse } from './directoryTraverse'

function isProbablyBinaryFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase()
    return ['.jar', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.class'].includes(ext);

}

export function applyReplacementsInDir(
    rootDir: string,
    replacements: Record<string, string>,
): void {
    postOrderDirectoryTraverse(
        rootDir,
        () => {},
        (filePath) => {
            if (isProbablyBinaryFile(filePath)) {
                return
            }
            const content = fs.readFileSync(filePath)
            const text = content.toString('utf8')
            let next = text
            for (const [from, to] of Object.entries(replacements)) {
                next = next.split(from).join(to)
            }
            if (next !== text) {
                fs.writeFileSync(filePath, next)
            }
        },
    )
}

export function movePackagePlaceholderDirs(rootDir: string, packagePath: string): void {
    const placeholder = '__PACKAGE_PATH__'
    const found: string[] = []

    function scan(dir: string): void {
        for (const filename of fs.readdirSync(dir)) {
            const fullPath = path.resolve(dir, filename)
            if (fs.lstatSync(fullPath).isDirectory()) {
                if (filename === placeholder) {
                    found.push(fullPath)
                } else {
                    scan(fullPath)
                }
            }
        }
    }

    scan(rootDir)

    for (const placeholderDir of found) {
        const parentDir = path.dirname(placeholderDir)
        const targetDir = path.resolve(parentDir, packagePath)
        fs.mkdirSync(targetDir, { recursive: true })

        postOrderDirectoryTraverse(
            placeholderDir,
            (dirPath) => {
                if (dirPath !== placeholderDir) {
                    fs.rmdirSync(dirPath)
                }
            },
            (filePath) => {
                const relative = path.relative(placeholderDir, filePath)
                const destPath = path.resolve(targetDir, relative)
                fs.mkdirSync(path.dirname(destPath), { recursive: true })
                fs.renameSync(filePath, destPath)
            },
        )

        fs.rmdirSync(placeholderDir)
    }
}
