//this code runs in a web worker

import { GetWeightsRequest } from "../models/models";
import { PortfolioBuilder } from "../services/portfolioBuilder";
import type { WorkerInputWrapper, WorkerOutputWrapper, WorkerOutputData, AllWorkerOperations } from "./worker-models";
import * as MathHelpers from '../services/math-helpers';

var operations: AllWorkerOperations = {
    async getWeightss(input: GetWeightsRequest): Promise<number[][]> {
        let builder = new PortfolioBuilder();
        var weights = builder.getWeights(input.tickers, input.segmentCount, input.filterExpr);
        return weights;
    },
    async doWork(_: any): Promise<any> {
        MathHelpers.doWork(1);
    }
}

self.addEventListener('message', (event) => {
    var workerInput = event.data as WorkerInputWrapper;
    runOperation(workerInput).then(res => {
        var workerOutput: WorkerOutputWrapper = {
            id: workerInput.id,
            data: res
        }
        self.postMessage(workerOutput);
    });
});

function runOperation(input: WorkerInputWrapper): Promise<WorkerOutputData> {
    //for some reason Promise<any> doesn't work
    var operation: any = operations[input.name];
    return operation(input.data);
}