export type TickerInputs = {
    tickers: string,
}

export type LineChartMode = "price" | "returns" | "logReturns" | "none" | "maxDrawdown" | "logLosses"

export type LineChartDataInputs = {
    mode: LineChartMode,
    returnDays: number,
    smoothDays: number,
    equalPrice: boolean,
    extrapolateDays: number,
    drawdownDays: number,
}

export type StatInputs = {
    returnDays: number,
    smoothDays: number,
    extrapolateDays: number,
    drawdownDays: number,
}

export type ScatterplotAxisMode = "return" | "logReturnSD" | "logLossRMS" | "maxDrawdown"

export type ScatterplotAxisInputs= {
    mode: ScatterplotAxisMode,
    returnDays: number,
    smoothDays: number,
    drawdownDays: number
}

export type ScatterplotDataContainer = {
    points: ScatterplotPoint[],
    seriesLabels: string[],
    axisInputsX: ScatterplotAxisInputs,
    axisInputsY: ScatterplotAxisInputs
}

export type ScatterplotPoint = {
    weights: number[],
    x: number,
    y: number
}

export type FundDataType = "price" | "afr" | "logafr";

export type FundData = {
    startDayNumber: number,
    dataType: FundDataType
    values: Float32Array
}

export type GetWeightsRequest = {
    tickers: string[];
    segmentCount: number;
    filterExpr: string;
}

export type CalculatePointsRequest = {
    fundDatas: FundData[];
    weightss: number[][];
    axisInputsX: ScatterplotAxisInputs,
    axisInputsY: ScatterplotAxisInputs
}

export type GetPortfolioSimulationsRequest = {
    portfolio: Portfolio, 
    simulationCount: number, 
    years: number
}

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

export type LineDataContainer = {
    dayNumbers: number[], 
    seriesLabels: string[],
    LineDatas: LineData[],
}
export type LineData = {
    type: LineChartMode,
    data: (number | null)[][], //outer array's length should match seriesLabels.length, innerArray should match dayNumbers.length
    labelCallback: (val: number | null) => string,
    yAxisTitle: string,
}

