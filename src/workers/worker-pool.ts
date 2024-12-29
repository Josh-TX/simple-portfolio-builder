//this code runs in the main thread

import type { WorkerInputWrapper, WorkerInputData, WorkerOutputWrapper, WorkerOutputData, OperationName } from "./worker-models";

type ActiveOperation = {
    id: string,
    index: number,
    callback: (responseData: WorkerOutputData) => any
}

class WorkerPool {
    private _poolSize = window.navigator.hardwareConcurrency || 4;
    private _activeOperations: ActiveOperation[] = [];
    private _workerPool: Worker[] = [];
    constructor(){
        console.log ("creating " + this._poolSize + " worker threads")
        for (var i = 0; i < this._poolSize; i++){
            let worker = new Worker(new URL('worker.ts', import.meta.url), {
                type: 'module',
            });
            worker.addEventListener('message', (event: MessageEvent<WorkerOutputWrapper>) => {
                var workerMsg = event.data;
                var activeOperation = this._activeOperations.find(z => z.id == workerMsg.id);
                if (!activeOperation){
                    throw "couldn't find operation with id " + workerMsg.id;
                }
                activeOperation.callback(workerMsg.data);
                this._activeOperations = this._activeOperations.filter(z => z.id != workerMsg.id);
            });
            this._workerPool.push(worker);
        }
    }

    runOperation(name: OperationName, input: WorkerInputData): Promise<WorkerOutputData>{
        var workerMsg: WorkerInputWrapper = { 
            id: this.getRandomString(),
            name: name,
            data: input
        }
        var workerOperationCounts = new Array(this._poolSize).fill(0);
        this._activeOperations.forEach(z => workerOperationCounts[z.index]++);
        var index = workerOperationCounts.indexOf(Math.min(...workerOperationCounts));
        return new Promise((resolve) => {
            this._activeOperations.push({
                id: workerMsg.id,
                index: index,
                callback: resolve
            });
            this._workerPool[index].postMessage(workerMsg);
        });
    }
    private getRandomString(): string {
        return new Date().getTime().toString(36) + Math.random().toString(36).substring(2, 8);
    }
}

export var workerPool = new WorkerPool();