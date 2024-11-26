import { DayVal, DayReturn, DayAFR, DayLogReturn, DayLogAFR, ChartData, ChartDataColumn, GetUnionDaysResult, Row } from "../models/models";
import { getSum } from "./helpers";
import { choleskyDecomposition, getCorrelation } from "./matrix-helper";

var log2 = Math.log(2);

export function interpolateDayPrices(dayPrices: DayVal[]): DayVal[] {
    var output: DayVal[] = [];
    for (var i = 0; i < dayPrices.length - 1; i++) {
        output.push(dayPrices[i]);
        var dayDiff = Math.round((dayPrices[i + 1].timestamp - dayPrices[i].timestamp) / 86400);
        for (var j = 1; j < dayDiff; j++) {
            var interpolated = dayPrices[i].val + (dayPrices[i + 1].val - dayPrices[i].val) * (j / dayDiff);
            var time = dayPrices[i].timestamp + j * 86400;
            output.push({
                timestamp: time,
                val: interpolated
            });
        }
    }
    return output;
}

export function getIntersectionDayPricess(dayPricess: DayVal[][]): DayVal[][] {
    if (dayPricess.length === 0) return [];
    let timestampsSet = new Set(dayPricess[0].map(z => z.timestamp));
    for (let i = 1; i < dayPricess.length; i++) {
        timestampsSet = new Set(dayPricess[i].filter(z => timestampsSet.has(z.timestamp)).map(z => z.timestamp));
    }
    return dayPricess.map(dayPrices => {
        return dayPrices.filter(z => timestampsSet.has(z.timestamp));
    })
}

export function getFirstCommonTimestamp(dayPricess: DayVal[][]): number {
    var common = dayPricess[0][0].timestamp;
    for(var i = 1; i < dayPricess.length; i++){
        common = Math.max(common, dayPricess[i][0].timestamp);
    }
    return common;
}

// //assumes the dayPricess are already filterd to intersection, meaning each row has the same set of timestamps
// export function getPortfolioDayPrices(dayPricess: DayVal[][], weights: number[]): DayVal[]{
//     if (dayPricess.length === 0) return [];

//     var output: DayVal[] = [];
//     var sumWeight = getSum(weights);
//     var rowLength = dayPricess[0].length;
//     var rebalanceDays: number = 365;
//     var lastRebalanceIndex = 0;

//     var startMoney = 10;
//     var shares: number[] = [];
//     for (var rowIndex = 0; rowIndex < weights.length; rowIndex++){
//         var moneyForCurrentFund = weights[rowIndex] / sumWeight * startMoney;
//         shares[rowIndex] = moneyForCurrentFund / dayPricess[rowIndex][0].val 
//     }
//     //normally I iterate by row and then by column, but I need to do columnwise operations. 
//     for (var colIndex = 0; colIndex < rowLength; colIndex++){
//         var sumMoney = 0;
//         for (var rowIndex = 0; rowIndex < weights.length; rowIndex++){
//             var price = dayPricess[rowIndex][colIndex].val * shares[rowIndex];
//             sumMoney += price;
//         }
//         output.push({
//             val: sumMoney,
//             timestamp: dayPricess[0][colIndex].timestamp
//         });
//         if (lastRebalanceIndex + rebalanceDays == colIndex){
//             for (var rowIndex = 0; rowIndex < weights.length; rowIndex++){
//                 var moneyForCurrentFund = weights[rowIndex] / sumWeight * sumMoney;
//                 shares[rowIndex] = moneyForCurrentFund / dayPricess[rowIndex][colIndex].val 
//             }
//             lastRebalanceIndex = colIndex;
//         }
//     }
//     return output;
// }

export function getReturns(dayPrices: DayVal[], returnDays: number): DayVal[] {
    var output: DayVal[] = [];
    for (var i = returnDays; i < dayPrices.length; i++) {
        output.push({
            timestamp: dayPrices[i].timestamp,
            val: dayPrices[i].val / dayPrices[i - returnDays].val
        });
    }
    return output;
}

export function getLogReturns(dayReturns: DayVal[]): DayVal[] {
    return dayReturns.map(z => ({ timestamp: z.timestamp, val: Math.log(z.val) / log2 }))
}

export function getEqualizePrices(dayPrices: DayVal[], firstCommonTimestamp: number): DayVal[] {
    var firstCommonDayPrice = dayPrices.find(z => z.timestamp == firstCommonTimestamp)!;
    var factor = 10 / firstCommonDayPrice.val;
    return dayPrices.map(z => ({
        timestamp: z.timestamp,
        val: z.val * factor
    }));
}


export function getExponentReturns(dayLogReturns: DayVal[]): DayVal[] {
    return dayLogReturns.map(z => ({ timestamp: z.timestamp, val: Math.pow(2, z.val) }))
}

export function getExtrapolatedReturns(dayReturns: DayVal[], returnDays: number, extrapolateDays: number): DayVal[] {
    var exponent = extrapolateDays / returnDays;
    return dayReturns.map(z => ({ timestamp: z.timestamp, val: Math.pow(z.val, exponent) }))
}

export function smoothData(dayVals: DayVal[], smoothDays: number): DayVal[] {
    var output: DayVal[] = []
    var sum = 0;
    var sideDays = Math.floor(smoothDays / 2);
    smoothDays = sideDays * 2 + 1;//in effect, smoothDays is just rounded down to the nearest odd number
    var leftIndex = dayVals.length - sideDays;
    for (var i = leftIndex; i < dayVals.length; i++) {
        sum += dayVals[i].val;
    }
    leftIndex = leftIndex % dayVals.length;
    var rightIndex = sideDays;
    for (var i = 0; i <= rightIndex; i++) {
        sum += dayVals[i].val;
    }
    for (var i = 0; i < dayVals.length - 1; i++) {
        output.push({
            timestamp: dayVals[i].timestamp,
            val: sum / smoothDays
        });
        sum -= dayVals[leftIndex].val;
        leftIndex++;
        leftIndex = leftIndex % dayVals.length;
        rightIndex++;
        rightIndex = rightIndex % dayVals.length;
        sum += dayVals[rightIndex].val;
    }
    output.push({
        timestamp: dayVals[dayVals.length - 1].val,
        val: sum / smoothDays
    });
    return output;
}

export function getLogAFRs(dayAFRs: DayAFR[], smoothDays: number): DayLogAFR[] {
    var log2 = Math.log(2);
    var logAfrs = dayAFRs.map(z => Math.log(z.afr) / log2);
    var output: DayLogAFR[] = []
    var sum = 0;
    var sideDays = Math.floor(smoothDays / 2);
    smoothDays = sideDays * 2 + 1;//in effect, smoothDays is just rounded down to the nearest odd number
    var leftIndex = dayAFRs.length - sideDays;
    for (var i = leftIndex; i < dayAFRs.length; i++) {
        sum += logAfrs[i];
    }
    leftIndex = leftIndex % logAfrs.length;
    var rightIndex = sideDays;
    for (var i = 0; i <= rightIndex; i++) {
        sum += logAfrs[i];
    }
    for (var i = 0; i < dayAFRs.length - 1; i++) {
        output.push({
            ...dayAFRs[i],
            logAfr: sum / smoothDays
        });
        sum -= logAfrs[leftIndex];
        leftIndex++;
        leftIndex = leftIndex % logAfrs.length;
        rightIndex++;
        rightIndex = rightIndex % logAfrs.length;
        sum += logAfrs[rightIndex];
    }
    output.push({
        ...dayAFRs[dayAFRs.length - 1],
        logAfr: sum / smoothDays
    });
    return output;
}


export function getChartData(tickers: string[], dayLogAFRs: DayLogAFR[][], filterDays: string | null): ChartData {
    var timestamps = getTimestamps(dayLogAFRs, filterDays);
    var dataColumns = getPriceColumns(timestamps, dayLogAFRs);
    return {
        seriesLabels: tickers,
        dataColumns: dataColumns,
        timestamps: timestamps
    }
}

function getPriceColumns(timestamps: number[], dayLogAFRss: DayLogAFR[][]): ChartDataColumn[] {
    var columns: ChartDataColumn[] = [];
    var timestampToLogAfrMaps = dayLogAFRss.map(dayLogAFRs => {
        var map: { [key: number]: number } = {};
        dayLogAFRs.forEach(dayLogAFR => map[dayLogAFR.timestamp] = dayLogAFR.logAfr);
        return map;
    });
    for (var timestamp of timestamps) {
        var column: ChartDataColumn = [];
        for (var i = 0; i < dayLogAFRss.length; i++) {
            var foundLogAfr = timestampToLogAfrMaps[i][timestamp];
            column.push(foundLogAfr != null ? foundLogAfr : null);
        }
        columns.push(column);
    }
    return columns;
}

export function getUnionTimestamps(dayPricess: DayVal[][]): number[] {
    const timestampsSet = new Set<number>();
    for (var dayPrices of dayPricess) {
        for (const dayPrice of dayPrices) {
            timestampsSet.add(dayPrice.timestamp);
        }
    }
    var timestamps = Array.from(timestampsSet);
    timestamps.sort((z1, z2) => z1 - z2);
    return timestamps;
}

function getTimestamps(dayPricess: DayLogAFR[][], filterDays: string | null): number[] {
    const timestampsSet = new Set<number>();
    for (var dayPrices of dayPricess) {
        for (const dayPrice of dayPrices) {
            timestampsSet.add(dayPrice.timestamp);
        }
    }
    var timestamps = Array.from(timestampsSet);
    if (filterDays && filterDays.length < 5) {
        if (filterDays == "MWF") {
            var filterDayInts = [1, 3, 5];
        }
        else if (filterDays == "F") {
            var filterDayInts = [5];
        } else {
            throw "unknown filterDays code";
        }
        timestamps = timestamps.filter(timestamp => {
            var daysSinceEpoch = Math.floor(timestamp / 86400);
            var dayOfWeek = (daysSinceEpoch + 4) % 7;//epoch was on thurday (4);
            return filterDayInts.includes(dayOfWeek);
        });
    }
    timestamps.sort((z1, z2) => z1 - z2);
    return timestamps;
}

export function getCorrelationMatrix(dayLogAFRss: DayLogAFR[][], mustBePositiveSemiDefinite = false): number[][] {
    if (!dayLogAFRss.length) {
        return []
    }
    var matrixSize = dayLogAFRss.length
    var correlationMatrix: number[][] = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(0));
    for (var i = 0; i < matrixSize; i++) {
        for (var j = i; j < matrixSize; j++) {
            if (i === j) {
                correlationMatrix[i][j] = 1;
            } else {
                var commonLogAfrs = getIntersectionDays([dayLogAFRss[i], dayLogAFRss[j]]);
                var x = commonLogAfrs[0].map(z => z.logAfr);
                var y = commonLogAfrs[1].map(z => z.logAfr);
                var r = getCorrelation(x, y);
                correlationMatrix[i][j] = r;
                correlationMatrix[j][i] = r;
            }
        }
    }
    //if we're just displaying this matrix and not simulating anything with it, we can just stop here.
    if (!mustBePositiveSemiDefinite) {
        return correlationMatrix;
    }
    //the choleskyDecomposition() function will return null if it's not positive semi-definite
    var choleskyDecomp = choleskyDecomposition(correlationMatrix);
    if (choleskyDecomp != null) {
        return correlationMatrix;
    }
    //at this point, the matrix we just calculated is not positive semi-definite. This means that it's technically an impossible correlation matrix.
    //the reason this can happen is that each correlation is calculated with as much data as the 2 funds have in common.
    //this should make each individual correlation more accurate, but it can occaisionally make impossible correlation matrices. This is more likely for large matrices
    //So, to fix this, we'll just calculate a correlation matrix using just data that ALL the funds have in common. 

    //I'll do this later
    throw "todo: re-calculate correlation Matrix"
}

//assumes dayss are already sorted by timestamp
export function getIntersectionDays<T extends { timestamp: number }>(dayss: Row<T>[]): Row<T>[] {
    if (!dayss.length || dayss.some(z => !z.length)) {
        return [];
    }
    var lastIndexes: number[] = dayss.map(_ => 0);
    var lastTimestamps: number[] = dayss.map(z => z[0].timestamp);
    var outputRows: Row<T>[] = dayss.map(_ => []);
    while (true) {
        var minValue = Math.min(...lastTimestamps);
        var maxValue = Math.max(...lastTimestamps);
        if (minValue == maxValue) {
            for (var i = 0; i < dayss.length; i++) {
                outputRows[i].push(dayss[i][lastIndexes[i]])
            }
            for (var i = 0; i < dayss.length; i++) {
                lastIndexes[i]++;
                if (lastIndexes[i] >= dayss[i].length) {
                    return outputRows;
                }
                lastTimestamps[i] = dayss[i][lastIndexes[i]].timestamp
            }
        } else {
            for (var i = 0; i < dayss.length; i++) {
                while (lastTimestamps[i] < maxValue) {
                    lastIndexes[i]++;
                    if (lastIndexes[i] >= dayss[i].length) {
                        return outputRows;
                    }
                    lastTimestamps[i] = dayss[i][lastIndexes[i]!].timestamp
                }
            }
        }
    }
}

//assumes dayss are already sorted by timestamp
export function getUnionDays<T extends { timestamp: number }>(dayss: Row<T>[]): GetUnionDaysResult<T> {
    const timestampsSet = new Set<number>();
    for (var days of dayss) {
        for (const day of days) {
            timestampsSet.add(day.timestamp);
        }
    }
    var timestamps = Array.from(timestampsSet);
    timestamps.sort((z1, z2) => z1 - z2);

    var lastIndexes: number[] = dayss.map(_ => 0);
    var dayRows: Row<(T | null)>[] = dayss.map(_ => []);
    for (var timestamp of timestamps) {
        for (var i = 0; i < dayss.length; i++) {

            if (lastIndexes[i] >= dayss[i].length) {
                dayRows[i].push(null);//timestamp is later than the latest timestamp in dayss[i]
            }
            else if (dayss[i][lastIndexes[i]].timestamp == timestamp) {
                dayRows[i].push(dayss[i][lastIndexes[i]]);
                lastIndexes[i]++;
            } else {
                dayRows[i].push(null);//timestamp is before than the earliest timestamp in dayss[i]
            }
        }
    }
    return {
        timestamps: timestamps,
        days: dayRows
    };
}

/**
 * Maps each timestamps to the corresponding dayVal value. Uses null if there is no corresponding dayVal.
 * @param timestamps A list of timestamps. Determines the output array length
 * @param dayVals Must already be sorted by timestamp. Could be any type of dayVal list (price, returns, logReturns, etc.)
 * @returns a list a (number | null)[] who's length will match the length of timestamps.length
 */
export function matchDataToTimestamps(timestamps: number[], dayVals: DayVal[]): (number | null)[] {
    var lastIndex = 0;
    var output: (number | null)[] = [];
    for (var timestamp of timestamps) {
        while (lastIndex < dayVals.length && dayVals[lastIndex].timestamp < timestamp) {
            lastIndex++;
        }
        if (lastIndex >= dayVals.length) {
            output.push(null);
        } else if (dayVals[lastIndex].timestamp == timestamp) {
            output.push(dayVals[lastIndex].val);
            lastIndex++;
        } else {
            output.push(null);
        }

    }
    return output;
}

/**
 * Gets the average annual factor return
 * @param dayPrices a list of dayPrices (the stock's value)
 */
export function getAvgAfr(dayPrices: DayVal[]): number {
    var last = dayPrices[dayPrices.length - 1];
    var dayDiff = Math.round((last.timestamp - dayPrices[0].timestamp) / 86400);

    var avgAfr = ((last.val / dayPrices[0].val) ** (365 / dayDiff)) - 1;
    return avgAfr;
}

/**
 * gets a copy of the array that only includes every nth item
 */
export function everyNthItem<T>(arr: T[], n: number): T[] {
    var output: T[] = [];
    for (let i = 0; i < arr.length; i += n) {
        output.push(arr[i]);
    }
    return output;
}

/**
 * gets the value of the portfolio over time, assuming we started with $10
 * @param dayPricess a list of a list of dayPrices (the stock's value), should already be interpolated and intersected
 * @param weights a list of weights for desired holding of each stock. Magnitude doesn't matter, just relative proportion
 * @param rebalanceDays how often (in days) the portfolio's holdings should be redistributed to match the weights
 */
export function getPortfolioDayPrices(dayPricess: DayVal[][], weights: number[], rebalanceDays: number): DayVal[] {
    //assumes days have already been interpolated
    if (Math.min(...dayPricess.map(z => z.length)) != Math.max(...dayPricess.map(z => z.length))) {
        throw "all dayPricess must be same length";
    }
    if (dayPricess.length != weights.length) {
        throw "weights.length must match dayPricess.length";
    }
    if (!dayPricess.length || !dayPricess[0].length) {
        return [];
    }
    var sumWeight = getSum(weights);
    var startMoney = 10;
    var shares: number[] = [];
    var output: DayVal[] = [];
    for (var i = 0; i < weights.length; i++) {
        var moneyForCurrentFund = weights[i] / sumWeight * startMoney;
        shares.push(moneyForCurrentFund / dayPricess[i][0].val)
    }
    var lastRebalanceIndex = 0;
    for (var i = 0; i < dayPricess[0].length; i++) {
        var sumMoney = 0;
        for (var j = 0; j < shares.length; j++) {
            sumMoney += dayPricess[j][i].val * shares[j];
        }
        if (i - lastRebalanceIndex == rebalanceDays) {
            for (var j = 0; j < weights.length; j++) {
                var moneyForCurrentFund = weights[j] / sumWeight * sumMoney;
                shares[j] = moneyForCurrentFund / dayPricess[j][i].val
            }
            lastRebalanceIndex = i;
        }
        output.push({
            timestamp: dayPricess[0][i].timestamp,
            val: sumMoney
        });
    }
    var lastRebalanceIndex = 0;
    return output;
}
/**
 * gets the holdings of each fund in the portfolio over time, assuming we started with $10
 * @param dayPricess a list of a list of dayPrices (the stock's value), should already be interpolated and intersected
 * @param weights a list of weights for desired holding of each stock. Magnitude doesn't matter, just relative proportion
 * @param rebalanceDays how often (in days) the portfolio's holdings should be redistributed to match the weights
 * @param rebalanceIndexes this is only written to and not read from. Stores the indexes (nth day) that a rebalance occurred
 */
export function getPortfolioDayPricess(dayPricess: DayVal[][], weights: number[], rebalanceDays: number, rebalanceIndexes: number[]): DayVal[][] {
    //assumes days have already been interpolated
    if (Math.min(...dayPricess.map(z => z.length)) != Math.max(...dayPricess.map(z => z.length))) {
        throw "all dayPricess must be same length";
    }
    if (dayPricess.length != weights.length) {
        throw "weights.length must match dayPricess.length";
    }
    if (!dayPricess.length || !dayPricess[0].length) {
        return [];
    }
    var sumWeight = getSum(weights);
    var startMoney = 10;
    var shares: number[] = [];
    var output: DayVal[][] = weights.map(_ => []);
    for (var i = 0; i < weights.length; i++) {
        var moneyForCurrentFund = weights[i] / sumWeight * startMoney;
        shares.push(moneyForCurrentFund / dayPricess[i][0].val)
    }
    var lastRebalanceIndex = 0;
    for (var i = 0; i < dayPricess[0].length; i++) {
        if (i - lastRebalanceIndex == rebalanceDays) {
            var sumMoney = 0;
            for (var j = 0; j < shares.length; j++) {
                sumMoney += dayPricess[j][i].val * shares[j];
            }
            for (var j = 0; j < weights.length; j++) {
                var moneyForCurrentFund = weights[j] / sumWeight * sumMoney;
                shares[j] = moneyForCurrentFund / dayPricess[j][i].val
            }
            lastRebalanceIndex = i;
            rebalanceIndexes.push(i);
        }
        for (var j = 0; j < shares.length; j++) {
            output[j].push({
                timestamp: dayPricess[j][i].timestamp,
                val: dayPricess[j][i].val * shares[j]
            });
        }
    }
    var lastRebalanceIndex = 0;
    return output;
}