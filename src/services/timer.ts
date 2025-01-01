var timers: { [key: string]: number} = {};

export function startTimer(key: string): void {
    timers[key] = performance.now();
}

export function logElapsed(key: string){
    var ms = performance.now() - timers[key];
    console.log("elasped time '" + key + "':", ms / 1000);
}
