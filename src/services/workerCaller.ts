import { WorkerInputWrapper, WorkerInputData, WorkerOutputWrapper, WorkerOutputData, GetWeightsRequest, GetChartDataRequest, GetPortfolioSimulationsRequest, WorkerProgress } from "../models/models";
import { ChartData } from "./chartDataBuilder";

//there's about 15ms of overhead to spin up a new worker, so keeping one active is slightly more performant
const worker = new Worker(new URL('../worker.ts', import.meta.url), {
    type: 'module',
});

var idCallbackMap: { [id: string]: (responseData: WorkerOutputData) => any } = {}
var idProgressCallbackMap: { [id: string]: (progress: number) => any } = {}

worker.addEventListener('message', (event: MessageEvent<WorkerOutputWrapper | WorkerProgress>) => {
    var workerMsg = event.data;
    if (isWorkerProgress(workerMsg)){
        var progressCallback = idProgressCallbackMap[workerMsg.id];
        if (progressCallback){
            progressCallback(workerMsg.progress);
        }
    } else {
        var callback = idCallbackMap[workerMsg.id];
        if (callback){
            callback(workerMsg.data);
        } else {
            console.warn("no worker callback") //shouldn't be possible
        }
        delete idProgressCallbackMap[workerMsg.id];
        delete idCallbackMap[workerMsg.id];
    }
});

export function callWorker(name: "getWeights", input: GetWeightsRequest, progressCallback?: (progress: number) => any | undefined): Promise<number[][]>;
export function callWorker(name: "getChartData", input: GetChartDataRequest, progressCallback?: (progress: number) => any | undefined): Promise<ChartData>;
export function callWorker(name: "getPortfolioSimulations", input: GetPortfolioSimulationsRequest, progressCallback?: (progress: number) => any | undefined): Promise<number[]>;
export function callWorker(name: string, input: WorkerInputData, progressCallback?: (progress: number) => any | undefined): Promise<WorkerOutputData>{
    var workerMsg: WorkerInputWrapper = { 
        id: getRandomString(),
        name: name,
        data: input
    }
    if (progressCallback){
        idProgressCallbackMap[workerMsg.id] = progressCallback
    }
    return new Promise((resolve) => {
        idCallbackMap[workerMsg.id] = resolve
        worker.postMessage(workerMsg);
    });
}

function isWorkerProgress(workerMsg: WorkerOutputWrapper | WorkerProgress): workerMsg is WorkerProgress {
    if ((<WorkerProgress>workerMsg).progress != null){
        return true;
    }
    return false;
}

function getRandomString(): string {
    return new Date().getTime().toString(36) + Math.random().toString(36).substring(2, 8);
}