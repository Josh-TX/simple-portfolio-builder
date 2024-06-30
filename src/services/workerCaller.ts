import { WorkerInputWrapper, WorkerInputData, WorkerOutputWrapper, WorkerOutputData, GetWeightsRequest, GetChartDataRequest } from "../models/models";
import { ChartData } from "./chartDataBuilder";

//there's about 15ms of overhead to spin up a new worker, so keeping one active is slightly more performant
//the downside is that we have to use type guards 
const worker = new Worker(new URL('../worker.ts', import.meta.url), {
    type: 'module',
});

var idCallbackMap: { [id: string]: (responseData: WorkerOutputData) => any } = {}

worker.addEventListener('message', (event: MessageEvent<WorkerOutputWrapper>) => {
    var workerMsg = event.data;
    var callback = idCallbackMap[workerMsg.id];
    if (callback){
        callback(workerMsg.data);
        delete idCallbackMap[workerMsg.id];
    }
});

export function callWorker(input: GetWeightsRequest): Promise<number[][]>;
export function callWorker(input: GetChartDataRequest): Promise<ChartData>;
export function callWorker(requestData: WorkerInputData): Promise<WorkerOutputData>{
    var workerMsg: WorkerInputWrapper = { 
        id: getRandomString(),
        data: requestData
    }
    return new Promise((resolve) => {
        idCallbackMap[workerMsg.id] = resolve
        worker.postMessage(workerMsg);
    });
}

function getRandomString(): string {
    return new Date().getTime().toString(36) + Math.random().toString(36).substring(2, 8);
}