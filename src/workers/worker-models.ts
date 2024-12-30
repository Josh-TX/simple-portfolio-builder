//this file should only contain type definitions, since it'll be used both the main thread and each worker

import type { GetWeightsRequest } from "../models/models"

export type WorkerInputWrapper = {
    id: number,
    name: OperationName,
    data: WorkerInputData
}
export type WorkerProgress = {
    id: number,
    progress: number
}
export type WorkerOutputWrapper = {
    id: number,
    data: WorkerOutputData
}
export type WorkerInputData = any;
export type WorkerOutputData = any

export interface AllWorkerOperations {
    getWeightss(input: GetWeightsRequest): Promise<number[][]>
    doWork(input: any): Promise<any>
}

export type OperationName = keyof AllWorkerOperations