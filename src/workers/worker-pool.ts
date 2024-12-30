//this code runs in the main thread

import type { WorkerInputWrapper, WorkerInputData, WorkerOutputWrapper, WorkerOutputData, OperationName } from "./worker-models";

type ActiveOperation = {
    id: number,
    index: number,
    callback: (responseData: WorkerOutputData) => any
}

type QueuedOperation = {
    workerMsg: WorkerInputWrapper,
    callback: (responseData: WorkerOutputData) => any
}

class WorkerPool {
    private _poolSize = window.navigator.hardwareConcurrency || 4;
    private _maxConcurrentPerWorker = 10;
    private _idCursor = 1;
    private _activeOperations: ActiveOperation[] = [];
    private _queuedOperations: QueuedOperation[] = [];
    private _workerActiveCount: {[workerIndex: number]: number} = {}
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
                var workerIndex =  activeOperation.index;
                var oldCount = this._workerActiveCount[workerIndex]--;
                if (oldCount <= this._maxConcurrentPerWorker && this._queuedOperations.length){ //use <= because oldCount is prior to the decriment
                    var queuedOperation = this._queuedOperations.shift()!;
                    this._workerActiveCount[workerIndex]++;
                    this._activeOperations.push({
                        id: queuedOperation.workerMsg.id,
                        index: workerIndex,
                        callback: queuedOperation.callback
                    });
                    this._workerPool[workerIndex].postMessage(queuedOperation.workerMsg);
                }
            });
            this._workerPool.push(worker);
            this._workerActiveCount[i] = 0;
        }
    }

    getPoolSize(): number{
        return this._poolSize;
    }

    runOperation(name: OperationName, input: WorkerInputData): Promise<WorkerOutputData>{
        var workerMsg: WorkerInputWrapper = { 
            id: this._idCursor++,
            name: name,
            data: input
        }

        //set the workerIndex to whatever worker has the fewest active operations
        var workerIndex = 0;
        for (var i = 1; i < this._poolSize; i++){
            if (this._workerActiveCount[i] < this._workerActiveCount[workerIndex]){
                workerIndex = i;
            }
        }

        this._workerActiveCount[workerIndex]++;//reserve a spot now, since there could be many syncronous calls to runOperation() prior to the Promise callback running
        return new Promise((resolve) => {
            var activeCount = this._workerActiveCount[workerIndex];
            if (activeCount < this._maxConcurrentPerWorker){
                this._activeOperations.push({
                    id: workerMsg.id,
                    index: workerIndex,
                    callback: resolve
                });
                this._workerPool[workerIndex].postMessage(workerMsg);
            } else {
                this._workerActiveCount[workerIndex]--; //we reserved our spot earlier, so now we need to un-reserve our spot
                this._queuedOperations.push({
                    workerMsg: workerMsg,
                    callback: resolve
                });
            }
        });
    }
}

export var workerPool = new WorkerPool();