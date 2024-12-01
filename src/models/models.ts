export type TickerInputs = {
    returnDays: number,
    smoothDays: number,
    syncDays: boolean,
    tickers: string,
    filterDays: string,
}

export type LineChartMode = "price" | "returns" | "logReturns" | "portfolioHoldings" | "none"

export type LineChartDataInputs = {
    mode: LineChartMode,
    returnDays: number,
    smoothDays: number,
    equalPrice: boolean,
    extrapolateDays: number,
    showRebalance: boolean,
}

export type DayPrice = {
    timestamp: number,
    price: number
}

export type DayVal = {
    dayNumber: number,
    val: number
}

export type DayReturn = {
    timestamp: number,
    return: number
}

export type DayLogReturn = {
    timestamp: number,
    logReturn: number
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

export type GetLogAfrsRequest = {
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


export type ChartData = {
    timestamps: number[],
    seriesLabels: string[],
    dataColumns: ChartDataColumn[]
}

export type LineChartData = {
    timestamps: number[], 
    seriesLabels: string[],
    data: (number | null)[][],//outer array's length should match seriesLabels.length, innerArray should match timestamps.length
    labelCallback: (val: number | null) => string,
    data2: (number | null)[][] | null,
    labelCallback2: (val: number | null) => string | null
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

//export type LineDataType = "price" | "returns" | "logReturns"

export type GetUnionDaysResult<T> = {
    dayNumbers: number[]
    days: Row<(T | null)>[]
}


export type ChartDataColumn = Array<number | null>;

export type Row<T> = T[];
export type Colunn<T> = T[];