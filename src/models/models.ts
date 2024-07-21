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


export type LineChartType = "prices" | "returns" | "logreturns"
export type LineChartLabels = "percent" | "afr" | "log2afr"
export type LineChartSecondLabel = ""

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
    timestamps: number[], 
    seriesLabels: string[],
    LineDatas: LineData[],
}
export type LineData = {
    type: LineDataType,
    data: Row<number | null>[], //outer array's length should match seriesLabels.length, innerArray should match timestamps.length
    labelCallback: (val: number | null) => string,
    yAxisTitle: string
}

export type LineDataType = "price" | "return" | "log"

export type GetUnionDaysResult<T> = {
    timestamps: number[]
    days: Row<(T | null)>[]
}


export type ChartDataColumn = Array<number | null>;

export type Row<T> = T[];
export type Colunn<T> = T[];