const duration = 1000 * 60 * 60 * 24 * 30 * 6

export const validateGithub = (createTime: number) => {
    const currentTimeStamp = new Date().getTime();
    if (currentTimeStamp - createTime > duration) {
        return true
    }
    return false;
}

/**
 * Parse object into JSON object
 * @param {Object} o any object
 */
export function parseObj(o: any) {
    return JSON.parse(JSON.stringify(o));
}