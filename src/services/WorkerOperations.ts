import { callWorker } from "./WorkerCaller";
import { AllWorkerOperations } from "../models/worker-models";
import { GetWeightsRequest, DayPrice, DayReturn } from "../models/models";

class WorkerOperations implements AllWorkerOperations {
    getWeights(input: GetWeightsRequest): Promise<number[][]> {
        return callWorker("getWeights", input);
    }
    getInterpolatedPrices(input: DayPrice[]): Promise<DayPrice[]> {
        return callWorker("getInterpolatedPrices", input);
    }
    getReturns(input: {dayPrices: DayPrice[], returnDays: number}): Promise<DayReturn[]> {
        return callWorker("getReturns", input);
    }
}

export var workerOperations = new WorkerOperations();