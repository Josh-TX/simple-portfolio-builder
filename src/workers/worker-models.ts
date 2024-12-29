//this file should only contain type definitions, since it'll be used both the main thread and each worker

import type { GetWeightsRequest } from "../models/models"

export type WorkerInputWrapper = {
    id: string,
    name: OperationName,
    data: WorkerInputData
}
export type WorkerProgress = {
    id: string,
    progress: number
}
export type WorkerOutputWrapper = {
    id: string,
    data: WorkerOutputData
}
export type WorkerInputData = any;
export type WorkerOutputData = any

export interface AllWorkerOperations {
    getWeightss(input: GetWeightsRequest): Promise<number[][]>
}

export type OperationName = keyof AllWorkerOperations