import * as fs from 'node:fs'
import * as path from 'node:path'

import deepMerge from './deepMerge'
import sortDependencies from './sortDependencies'

function renderTemplate(src: string, dest: string): void {
    const stats = fs.statSync(src)

    if (stats.isDirectory()) {
        if (path.basename(src) === 'node_modules') {
            return
        }
        fs.mkdirSync(dest, { recursive: true })
        for (const file of fs.readdirSync(src)) {
            renderTemplate(path.resolve(src, file), path.resolve(dest, file))
        }
        return
    }

    const filename = path.basename(src)

    if (filename === 'package.json' && fs.existsSync(dest)) {
        const existing = JSON.parse(fs.readFileSync(dest, 'utf8'))
        const newPackage = JSON.parse(fs.readFileSync(src, 'utf8'))
        const pkg = sortDependencies(deepMerge(existing, newPackage))
        fs.writeFileSync(dest, JSON.stringify(pkg, null, 4) + '\n')
        return
    }

    if (filename.startsWith('_')) {
        dest = path.resolve(path.dirname(dest), filename.replace(/^_/, '.'))
    }

    if (filename === '_gitignore' && fs.existsSync(dest)) {
        const existing = fs.readFileSync(dest, 'utf8')
        const newGitignore = fs.readFileSync(src, 'utf8')
        fs.writeFileSync(dest, existing + '\n' + newGitignore)
        return
    }

    fs.copyFileSync(src, dest)
}

export default renderTemplate
