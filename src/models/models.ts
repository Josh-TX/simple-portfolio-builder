import { ChartData } from "../services/chartDataBuilder";

export type DayPrice = {
    timestamp: number,
    price: number
}

export type GetWeightsRequest = {
    tickers: string[];
    segmentCount: number;
}

export type GetChartDataRequest = {
    tickers: string[];
    dayPricess: DayPrice[][];
    filterDays: string;
    returnDays: number;
    smoothDays: number;
}

export type WorkerInputWrapper = {
    id: string,
    data: WorkerInputData
}

export type WorkerOutputWrapper = {
    id: string,
    data: WorkerOutputData
}

export type WorkerInputData = GetWeightsRequest | GetChartDataRequest;
export type WorkerOutputData = ChartData | number[][];