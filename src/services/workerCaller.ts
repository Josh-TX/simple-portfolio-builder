import { WorkerInputWrapper, WorkerInputData, WorkerOutputWrapper, WorkerOutputData, OperationName } from "../models/worker-models";

type ActiveOperation = {
    id: string,
    index: number,
    callback: (responseData: WorkerOutputData) => any
}

//there's about 15ms of overhead to spin up a new worker, so reusing them is slightly more performant, particularly when doing many smaller operations. 
var poolSize = 4;
var activeOperations: ActiveOperation[] = [];

var workerPool: Worker[] = [];

for (var i = 0; i < poolSize; i++){
    let worker = new Worker(new URL('../worker.ts', import.meta.url), {
        type: 'module',
    });
    worker.addEventListener('message', (event: MessageEvent<WorkerOutputWrapper>) => {
        var workerMsg = event.data;
        var activeOperation = activeOperations.find(z => z.id == workerMsg.id);
        if (!activeOperation){
            throw "couldn't find operation with id " + workerMsg.id;
        }
        activeOperation.callback(workerMsg.data);
        activeOperations = activeOperations.filter(z => z.id != workerMsg.id);
    });
    workerPool.push(worker);
}

export function callWorker(name: OperationName, input: WorkerInputData): Promise<WorkerOutputData>{
    var workerMsg: WorkerInputWrapper = { 
        id: getRandomString(),
        name: name,
        data: input
    }
    var workerOpCounts = new Array(poolSize).fill(0);
    activeOperations.forEach(z => workerOpCounts[z.index]++);
    var index = workerOpCounts.indexOf(Math.min(...workerOpCounts));
    return new Promise((resolve) => {
        activeOperations.push({
            id: workerMsg.id,
            index: index,
            callback: resolve
        });
        workerPool[index].postMessage(workerMsg);
    });
}

function getRandomString(): string {
    return new Date().getTime().toString(36) + Math.random().toString(36).substring(2, 8);
}
