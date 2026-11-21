function getNestedValue(tree, key) {
    const parts = key.split(".");
    let node = tree;
    for (const part of parts) {
        if (node == null || typeof node === "string")
            return undefined;
        node = node[part];
    }
    return typeof node === "string" ? node : undefined;
}
function interpolate(template, params) {
    if (!params)
        return template;
    return template.replace(/\{\{(\w+)\}\}/g, (_, name) => {
        const value = params[name];
        return value != null ? String(value) : `{{${name}}}`;
    });
}
export function createTranslator(primary, fallback) {
    return (key, params) => {
        const raw = getNestedValue(primary, key) ?? getNestedValue(fallback, key);
        if (raw == null)
            return key;
        return interpolate(raw, params);
    };
}
