//this code runs in the main thread

import { CalculatePointsRequest, GetWeightsRequest, ScatterplotPoint } from "../models/models";
import { AllWorkerOperations } from "./worker-models";
import { workerPool } from "./worker-pool";

export var workerCaller: AllWorkerOperations = {
    async getWeightss(input: GetWeightsRequest): Promise<number[][]> {
        return workerPool.runOperation("getWeightss", input);
    },

    async calculatePoints(input: CalculatePointsRequest): Promise<ScatterplotPoint[]> {
        return workerPool.runOperation("calculatePoints", input);
    }
}