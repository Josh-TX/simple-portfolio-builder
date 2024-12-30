export type TickerInputs = {
    returnDays: number,
    smoothDays: number,
    syncDays: boolean,
    tickers: string,
    filterDays: string,
}

export type LineChartMode = "price" | "returns" | "logReturns" | "portfolioHoldings" | "none" | "maxDrawdown" | "logLosses"

export type LineChartDataInputs = {
    mode: LineChartMode,
    returnDays: number,
    smoothDays: number,
    equalPrice: boolean,
    extrapolateDays: number,
    showRebalance: boolean,
    drawdownDays: number,
}

export type ScatterplotAxisMode = "return" | "riskAdj-0.5" | "riskAdj-1"  | "logReturnSD" | "logLossRMS" | "maxDrawdown"

export type ScatterplotAxisInputs= {
    mode: ScatterplotAxisMode,
    returnDays: number,
    smoothDays: number,
    drawdownDays: number,
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

export type DayVal = {
    dayNumber: number,
    val: number
}

export type NullableColumn = (number | null)[];
export type Column = number[];

export type GetWeightsRequest = {
    tickers: string[];
    segmentCount: number;
    filterExpr: string;
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
    data: Row<number | null>[], //outer array's length should match seriesLabels.length, innerArray should match timestamps.length
    labelCallback: (val: number | null) => string,
    yAxisTitle: string,
    rebalanceIndexes: number[] | null,
}

export type Row<T> = T[];