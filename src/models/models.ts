import { ChartData } from "../services/chartDataBuilder";

export type DayPrice = {
    timestamp: number,
    price: number
}

export type GetWeightsRequest = {
    tickers: string[];
    segmentCount: number;
    filterExpr: string;
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

export type PortfolioSummary = {
    weights: number[],
    avg: number,
    sd: number
}

export type ScatterplotInput = {
    summaries: PortfolioSummary[],
    highlightedSummaries: PortfolioSummary[]
}