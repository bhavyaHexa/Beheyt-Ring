/**
 * Helper to retrieve a texture URL from the textures configuration object using
 * a list of potential keys, performing both exact and case-insensitive lookups.
 */
export const getTextureValue = (texturesObj: any, searchKeys: string[]): string | undefined => {
    if (!texturesObj) return undefined;
    
    // 1. Try exact matches in priority order
    for (const key of searchKeys) {
        if (texturesObj[key]) return texturesObj[key];
    }
    
    // 2. Try case-insensitive matching
    const searchKeysLower = searchKeys.map(k => k.toLowerCase());
    for (const key of Object.keys(texturesObj)) {
        if (searchKeysLower.includes(key.toLowerCase())) {
            return texturesObj[key];
        }
    }
    
    return undefined;
};

/**
 * Helper to retrieve normal map texture URL by checking both keys and values
 * in textures configuration object case-insensitively for matches.
 */
export const getNormalMapValue = (texturesObj: any, matchTerms: string[]): string | undefined => {
    if (!texturesObj) return undefined;
    const matchTermsLower = matchTerms.map(t => t.toLowerCase());
    
    // 1. Check keys
    for (const key of Object.keys(texturesObj)) {
        const keyLower = key.toLowerCase();
        for (const term of matchTermsLower) {
            if (keyLower.includes(term)) {
                return texturesObj[key];
            }
        }
    }
    
    // 2. Check values/URLs
    for (const key of Object.keys(texturesObj)) {
        const val = texturesObj[key];
        if (typeof val === 'string') {
            const valLower = val.toLowerCase();
            for (const term of matchTermsLower) {
                if (valLower.includes(term)) {
                    return val;
                }
            }
        }
    }
    
    return undefined;
};

/**
 * Helper to retrieve a value from an object using a list of potential keys,
 * matching case-insensitively and ignoring non-alphanumeric characters.
 */
export const getValueIgnoreCaseAndSymbols = (obj: any, keysToSearch: string[]): any => {
    if (!obj) return undefined;
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedKeys = keysToSearch.map(normalize);
    for (const key of Object.keys(obj)) {
        if (normalizedKeys.includes(normalize(key))) {
            return obj[key];
        }
    }
    return undefined;
};
