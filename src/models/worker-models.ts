import { GetChartDataRequest, GetWeightsRequest, ChartData, DayLogAFR, GetLogAfrsRequest } from "./models"

export interface IOperationHandler {
    name: OperationName,
    handle: Operation<any, any>,
    progress?: (percent: number) => any
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

export type OperationName = "getWeights" | "getLogAfrs" | "getChartData";

export type Operation<I, O> = (input: I) => Promise<O>;
export type Operation_GetWeights = Operation<GetWeightsRequest, number[][]>;
export type Operation_GetChartData = Operation<GetChartDataRequest, ChartData>;
export type Operation_GetLogAfrs = Operation<GetLogAfrsRequest, DayLogAFR[][]>;