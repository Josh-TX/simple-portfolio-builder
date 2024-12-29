import { DayVal, DayAFR, DayLogAFR, ChartData, ChartDataColumn, GetUnionDaysResult, Row } from "../models/models";
import * as MathHelpers from "./math-helpers";
import { choleskyDecomposition, getCorrelation } from "./matrix-helpers";

var log2 = Math.log(2);

export function interpolateDayPrices(dayPrices: DayVal[]): DayVal[] {
    var output: DayVal[] = [];
    for (var i = 0; i < dayPrices.length - 1; i++) {
        output.push(dayPrices[i]);
        var dayDiff = dayPrices[i + 1].dayNumber - dayPrices[i].dayNumber;
        for (var j = 1; j < dayDiff; j++) {
            var interpolated = dayPrices[i].val + (dayPrices[i + 1].val - dayPrices[i].val) * (j / dayDiff);
            var dayNumber = dayPrices[i].dayNumber + j;
            output.push({
                dayNumber: dayNumber,
                val: interpolated
            });
        }
    }
    return output;
}

/**
 * for each dayPrices, filters it to just DayNumbers shared by all the provided dayPricess
 */
export function getIntersectionDayPricess(dayPricess: DayVal[][]): DayVal[][] {
    if (dayPricess.length === 0) return [];
    let dayNumbersSet = new Set(dayPricess[0].map(z => z.dayNumber));
    for (let i = 1; i < dayPricess.length; i++) {
        dayNumbersSet = new Set(dayPricess[i].filter(z => dayNumbersSet.has(z.dayNumber)).map(z => z.dayNumber));
    }
    return dayPricess.map(dayPrices => {
        return dayPrices.filter(z => dayNumbersSet.has(z.dayNumber));
    })
}

/**
 * Finds the first DayNumber shared by all the provided DayPricess
 */
export function getFirstCommonDayNumber(dayPricess: DayVal[][]): number {
    var common = dayPricess[0][0].dayNumber;
    for(var i = 1; i < dayPricess.length; i++){
        common = Math.max(common, dayPricess[i][0].dayNumber);
    }
    return common;
}

export function getReturns(dayPrices: DayVal[], returnDays: number): DayVal[] {
    var output: DayVal[] = [];
    for (var i = returnDays; i < dayPrices.length; i++) {
        output.push({
            dayNumber: dayPrices[i].dayNumber,
            val: dayPrices[i].val / dayPrices[i - returnDays].val
        });
    }
    return output;
}

export function getLogReturns(dayReturns: DayVal[]): DayVal[] {
    return dayReturns.map(z => ({ dayNumber: z.dayNumber, val: Math.log(z.val) / log2 }))
}

export function getEqualizePrices(dayPrices: DayVal[], firstCommonDayNumber: number): DayVal[] {
    console.log("getEqualizePrices", dayPrices)
    var firstCommonDayPrice = dayPrices.find(z => z.dayNumber == firstCommonDayNumber)!;
    var factor = 10 / firstCommonDayPrice.val;
    return dayPrices.map(z => ({
        dayNumber: z.dayNumber,
        val: z.val * factor
    }));
}


export function getExponentReturns(dayLogReturns: DayVal[]): DayVal[] {
    return dayLogReturns.map(z => ({ dayNumber: z.dayNumber, val: Math.pow(2, z.val) }))
}

export function getExtrapolatedReturns(dayReturns: DayVal[], returnDays: number, extrapolateDays: number): DayVal[] {
    var exponent = extrapolateDays / returnDays;
    return dayReturns.map(z => ({ dayNumber: z.dayNumber, val: Math.pow(z.val, exponent) }))
}

export function smoothData(dayVals: DayVal[], smoothDays: number): DayVal[] {
    var output: DayVal[] = []
    var sum = 0;
    var sideDays = Math.floor(smoothDays / 2);
    smoothDays = sideDays * 2 + 1;//in effect, smoothDays is just rounded down to the nearest odd number
    var leftIndex = dayVals.length - sideDays;
    console.log("dayVals", dayVals)
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
            dayNumber: dayVals[i].dayNumber,
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
        dayNumber: dayVals[dayVals.length - 1].val,
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

export function getUnionDayNumbers(dayPricess: DayVal[][]): number[] {
    const dayNumbersSet = new Set<number>();
    for (var dayPrices of dayPricess) {
        for (const dayPrice of dayPrices) {
            dayNumbersSet.add(dayPrice.dayNumber);
        }
    }
    var dayNumbers = Array.from(dayNumbersSet);
    dayNumbers.sort((z1, z2) => z1 - z2);
    return dayNumbers;
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
export function getUnionDays<T extends { dayNumber: number }>(dayss: Row<T>[]): GetUnionDaysResult<T> {
    const dayNumbersSet = new Set<number>();
    for (var days of dayss) {
        for (const day of days) {
            dayNumbersSet.add(day.dayNumber);
        }
    }
    var dayNumbers = Array.from(dayNumbersSet);
    dayNumbers.sort((z1, z2) => z1 - z2);

    var lastIndexes: number[] = dayss.map(_ => 0);
    var dayRows: Row<(T | null)>[] = dayss.map(_ => []);
    for (var dayNumber of dayNumbers) {
        for (var i = 0; i < dayss.length; i++) {

            if (lastIndexes[i] >= dayss[i].length) {
                dayRows[i].push(null);//timestamp is later than the latest timestamp in dayss[i]
            }
            else if (dayss[i][lastIndexes[i]].dayNumber == dayNumber) {
                dayRows[i].push(dayss[i][lastIndexes[i]]);
                lastIndexes[i]++;
            } else {
                dayRows[i].push(null);//timestamp is before than the earliest timestamp in dayss[i]
            }
        }
    }
    return {
        dayNumbers: dayNumbers,
        days: dayRows
    };
}

/**
 * Maps each dayNumbers to the corresponding dayVal value. Uses null if there is no corresponding dayVal.
 * @param dayNumbers A list of dayNumbers. Determines the output array length
 * @param dayVals Must already be sorted by timestamp. Could be any type of dayVal list (price, returns, logReturns, etc.)
 * @returns a list a (number | null)[] who's length will match the length of dayNumbers.length
 */
export function matchDataToDayNumbers(dayNumbers: number[], dayVals: DayVal[]): (number | null)[] {
    var lastIndex = 0;
    var output: (number | null)[] = [];
    for (var dayNumber of dayNumbers) {
        while (lastIndex < dayVals.length && dayVals[lastIndex].dayNumber < dayNumber) {
            lastIndex++;
        }
        if (lastIndex >= dayVals.length) {
            output.push(null);
        } else if (dayVals[lastIndex].dayNumber == dayNumber) {
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
    var dayDiff = last.dayNumber - dayPrices[0].dayNumber;
    var avgAfr = ((last.val / dayPrices[0].val) ** (365 / dayDiff));
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
    var sumWeight = MathHelpers.getSum(weights);
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
            dayNumber: dayPricess[0][i].dayNumber,
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
    var sumWeight = MathHelpers.getSum(weights);
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
                dayNumber: dayPricess[j][i].dayNumber,
                val: dayPricess[j][i].val * shares[j]
            });
        }
    }
    var lastRebalanceIndex = 0;
    return output;
}