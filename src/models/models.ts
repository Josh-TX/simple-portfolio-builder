import { ChartData } from "../services/chartDataBuilder";

export type TickerInputs = {
    returnDays: number,
    smoothDays: number,
    syncDays: boolean,
    tickers: string,
    filterDays: string,
}

export type DayPrice = {
    timestamp: number,
    price: number
}

export type DayAFR = {
    timestamp: number,
    price: number,
    afr: number
}
export type DayLogAFR = {
    timestamp: number,
    price: number,
    afr: number,
    logAfr: number,
}

export type NullableColumn = (number | null)[];
export type Column = number[];

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

export type GetPortfolioSimulationsRequest = {
    portfolio: Portfolio, 
    simulationCount: number, 
    years: number
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

export type WorkerInputData = GetWeightsRequest | GetChartDataRequest | GetPortfolioSimulationsRequest;
export type WorkerOutputData = ChartData | number[][] | number[];

export type PortfolioSummary = {
    weights: number[],
    avgLogAfr: number,
    stdDevLogAfr: number
}

export type Portfolio = {
    name: string,

    returnDays: number,
    smoothDays: number,
    tickers: string[],
    weights: number[],

    avgLogAfrs: number[],
    stdDevLogAfrs: number[],
    correlationMatrix: number[][]
}

export type SimulatedPortfolio = Portfolio & { results: number[] }


export type HistogramContainer = {
    binAvgs: number[],
    datasets: HistogramDataset[]
}

export type HistogramDataset = {
    name: string,
    bins: number[]
}