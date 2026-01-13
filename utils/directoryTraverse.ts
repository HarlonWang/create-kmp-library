import * as fs from 'node:fs'
import * as path from 'node:path'

export function preOrderDirectoryTraverse(
    dir: string,
    dirCallback: (dirPath: string) => void,
    fileCallback: (filePath: string) => void,
): void {
    for (const filename of fs.readdirSync(dir)) {
        if (filename === '.git') {
            continue
        }
        const fullPath = path.resolve(dir, filename)
        if (fs.lstatSync(fullPath).isDirectory()) {
            dirCallback(fullPath)
            if (fs.existsSync(fullPath)) {
                preOrderDirectoryTraverse(fullPath, dirCallback, fileCallback)
            }
            continue
        }
        fileCallback(fullPath)
    }
}

export function postOrderDirectoryTraverse(
    dir: string,
    dirCallback: (dirPath: string) => void,
    fileCallback: (filePath: string) => void,
): void {
    for (const filename of fs.readdirSync(dir)) {
        if (filename === '.git') {
            continue
        }
        const fullPath = path.resolve(dir, filename)
        if (fs.lstatSync(fullPath).isDirectory()) {
            postOrderDirectoryTraverse(fullPath, dirCallback, fileCallback)
            dirCallback(fullPath)
            continue
        }
        fileCallback(fullPath)
    }
}
