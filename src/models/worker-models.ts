export interface IWorkerHandler {
    name: string,
    handle(input: any): any
}

export type WorkerInputWrapper = {
    id: string,
    name: string,
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