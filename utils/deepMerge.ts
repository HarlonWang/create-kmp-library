const isObject = (val: unknown): val is Record<string, unknown> => Boolean(val) && typeof val === 'object'

const mergeArrayWithDedupe = (a: unknown[], b: unknown[]) => Array.from(new Set([...a, ...b]))

export default function deepMerge(target: Record<string, any>, obj: Record<string, any>) {
    for (const key of Object.keys(obj)) {
        const oldVal = target[key]
        const newVal = obj[key]

        if (Array.isArray(oldVal) && Array.isArray(newVal)) {
            target[key] = mergeArrayWithDedupe(oldVal, newVal)
        } else if (isObject(oldVal) && isObject(newVal)) {
            target[key] = deepMerge(oldVal as any, newVal as any)
        } else {
            target[key] = newVal
        }
    }

    return target
}
