import { GetWeightsRequest, ChartData, DayLogAFR, GetLogAfrsRequest, DayPrice, DayReturn } from "./models"

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

// export type OperationName = "getWeights" | "getLogAfrs" | "getChartData";

// export type Operation<I, O> = (input: I) => Promise<O>;
// export type Operation_GetWeights = Operation<GetWeightsRequest, number[][]>;
// export type Operation_GetChartData = Operation<GetChartDataRequest, ChartData>;
// export type Operation_GetLogAfrs = Operation<GetLogAfrsRequest, DayLogAFR[][]>;

export interface AllWorkerOperations {

    getWeights(input: GetWeightsRequest): Promise<number[][]>

    getInterpolatedPrices(input: DayPrice[]):  Promise<DayPrice[]>

    getReturns(input: {dayPrices: DayPrice[], returnDays: number}): Promise<DayReturn[]>
}

export type OperationName = keyof AllWorkerOperations