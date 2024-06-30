var timers: { [key: string]: Date} = {};

export function startTimer(key: string): void {
    timers[key] = new Date();
}

export function logElapsed(key: string){
    var ms = new Date().getTime() - timers[key].getTime();
    console.log("elasped time '" + key + "':", ms / 1000);
}
