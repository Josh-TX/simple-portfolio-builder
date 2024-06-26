var timeouts: { [key: string]: any} = {};

export function debounce(key: string, ms: number, callback: () => any): void {
    clearTimeout(timeouts[key]);
    timeouts[key] = setTimeout(callback, ms);
}
