import { DayPrice, DayAFR, DayLogAFR, ChartData, ChartDataColumn, GetUnionDaysResult, Row  } from "../models/models";
import { getSum } from "./helpers";
import { choleskyDecomposition, getCorrelation } from "./matrix-helper";

export function interpolateDayPrices(dayPrices: DayPrice[]): DayPrice[]{
    var output: DayPrice[] = [];
    for (var i = 0; i < dayPrices.length - 1; i++){
        output.push(dayPrices[i]);
        var dayDiff =  Math.round((dayPrices[i + 1].timestamp - dayPrices[i].timestamp) / 86400);
        for (var j = 1; j < dayDiff; j++){
            var interpolated = dayPrices[i].price + (dayPrices[i + 1].price - dayPrices[i].price) * (j / dayDiff);
            var time = dayPrices[i].timestamp + j * 86400;
            output.push({
                timestamp: time,
                price: interpolated
            });
        }
    }
    return output;
}

export function getIntersectionDayPrices(dayPricess: DayPrice[][]): DayPrice[][]{
    if (dayPricess.length === 0) return [];
    let timestampsSet = new Set(dayPricess[0].map(z => z.timestamp));
    for (let i = 1; i < dayPricess.length; i++) {
        timestampsSet = new Set(dayPricess[i].filter(z => timestampsSet.has(z.timestamp)).map(z => z.timestamp));
    }
    return dayPricess.map(dayPrices => {
        return dayPrices.filter(z => timestampsSet.has(z.timestamp));
    })
}

//assumes the dayPricess are already filterd to intersection, meaning each row has the same set of timestamps
export function getPortfolioDayPrices(dayPricess: DayPrice[][], weights: number[]): DayPrice[]{
    if (dayPricess.length === 0) return [];

    var output: DayPrice[] = [];
    var sumWeight = getSum(weights);
    var rowLength = dayPricess[0].length;
    var rebalanceDays: number = 365;
    var lastRebalanceIndex = 0;

    var startMoney = 10;
    var shares: number[] = [];
    for (var rowIndex = 0; rowIndex < weights.length; rowIndex++){
        var moneyForCurrentFund = weights[rowIndex] / sumWeight * startMoney;
        shares[rowIndex] = moneyForCurrentFund / dayPricess[rowIndex][0].price 
    }
    //normally I iterate by row and then by column, but I need to do columnwise operations. 
    for (var colIndex = 0; colIndex < rowLength; colIndex++){
        var sumMoney = 0;
        for (var rowIndex = 0; rowIndex < weights.length; rowIndex++){
            var price = dayPricess[rowIndex][colIndex].price * shares[rowIndex];
            sumMoney += price;
        }
        output.push({
            price: sumMoney,
            timestamp: dayPricess[0][colIndex].timestamp
        });
        if (lastRebalanceIndex + rebalanceDays == colIndex){
            for (var rowIndex = 0; rowIndex < weights.length; rowIndex++){
                var moneyForCurrentFund = weights[rowIndex] / sumWeight * sumMoney;
                shares[rowIndex] = moneyForCurrentFund / dayPricess[rowIndex][colIndex].price 
            }
            lastRebalanceIndex = colIndex;
        }
    }
    return output;
}

export function getAFRs(dayPrices: DayPrice[], returnDays: number): DayAFR[]{
    var exponent = 365.25 / returnDays;
    var afrs: DayAFR[] = [];
    console.log("exponent", exponent)
    for (var i = returnDays; i < dayPrices.length; i++){
        //var afr = Math.pow((dayPrices[i].price / dayPrices[i - returnDays].price),  exponent)
        var afr = dayPrices[i].price / dayPrices[i - returnDays].price
        // if (i % 100 == 0 || afr > 30){
        //     console.log(i, afr, "from " + dayPrices[i - returnDays].price + " to " + dayPrices[i].price)
        // }
        afrs.push({
            ...dayPrices[i],
            afr
        });
    }
    return afrs;
}

export function getLogAFRs(dayAFRs: DayAFR[], smoothDays: number): DayLogAFR[]{
    var log2 = Math.log(2);
    var logAfrs = dayAFRs.map(z => Math.log(z.afr) / log2);
    var output: DayLogAFR[] = []
    var sum = 0;
    var sideDays = Math.floor(smoothDays/2);
    smoothDays = sideDays * 2 + 1;//in effect, smoothDays is just rounded down to the nearest odd number
    var leftIndex = dayAFRs.length - sideDays;
    for (var i = leftIndex; i < dayAFRs.length; i++){
        sum += logAfrs[i];
    }
    leftIndex = leftIndex % logAfrs.length;
    var rightIndex = sideDays;
    for (var i = 0; i <= rightIndex; i++){
        sum += logAfrs[i];
    }
    for (var i = 0; i < dayAFRs.length - 1; i++){
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


export function getChartData(tickers: string[], dayLogAFRs: DayLogAFR[][], filterDays: string | null): ChartData{
    var timestamps = getTimestamps(dayLogAFRs, filterDays);
    var dataColumns = getPriceColumns(timestamps, dayLogAFRs);
    return {
        seriesLabels: tickers,
        dataColumns: dataColumns,
        timestamps: timestamps
    }
}

function getPriceColumns(timestamps: number[], dayLogAFRss: DayLogAFR[][]): ChartDataColumn[]{
    var columns: ChartDataColumn[] = [];
    var timestampToLogAfrMaps = dayLogAFRss.map(dayLogAFRs => {
        var map: { [key: number]: number } = {};
        dayLogAFRs.forEach(dayLogAFR => map[dayLogAFR.timestamp] = dayLogAFR.logAfr);
        return map;
    });
    for(var timestamp of timestamps){
        var column: ChartDataColumn = [];
        for (var i = 0; i < dayLogAFRss.length; i++){
            var foundLogAfr = timestampToLogAfrMaps[i][timestamp];
            column.push(foundLogAfr != null ? foundLogAfr : null);
        }
        columns.push(column);
    }
    return columns;
}

export function getUnionTimestamps(dayPricess: DayLogAFR[][]): number[] {
    const timestampsSet = new Set<number>();
    for (var darPrices of dayPricess) {
        for (const dayPrice of darPrices) {
            timestampsSet.add(dayPrice.timestamp);
        }
    }
    var timestamps = Array.from(timestampsSet);
    timestamps.sort((z1, z2) => z1 - z2);
    return timestamps;
}

function getTimestamps(dayPricess: DayLogAFR[][], filterDays: string | null): number[] {
    const timestampsSet = new Set<number>();
    for (var darPrices of dayPricess) {
        for (const dayPrice of darPrices) {
            timestampsSet.add(dayPrice.timestamp);
        }
    }
    var timestamps = Array.from(timestampsSet);
    if (filterDays && filterDays.length < 5){
        if (filterDays == "MWF"){
            var filterDayInts = [1,3,5];
        }
        else if (filterDays == "F"){
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

export function getCorrelationMatrix(dayLogAFRss: DayLogAFR[][], mustBePositiveSemiDefinite = false): number[][]{
    if (!dayLogAFRss.length){
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
    if (!mustBePositiveSemiDefinite){
        return correlationMatrix;
    }
    //the choleskyDecomposition() function will return null if it's not positive semi-definite
    var choleskyDecomp = choleskyDecomposition(correlationMatrix);
    if (choleskyDecomp != null){
        return correlationMatrix;
    }
    //at this point, the matrix we just calculated is not positive semi-definite. This means that it's technically an impossible correlation matrix.
    //the reason this can happen is that each correlation is calculated with as much data as the 2 funds have in common.
    //this should make each individual correlation more accurate, but it can occaisionally make impossible correlation matrices. This is more likely for large matrices
    //So, to fix this, we'll just calculate a correlation matrix using just data that ALL the funds have in common. 

    //I'll do this late
    throw "todo: re-calculate correlation Matrix"
}

//assumes dayss are already sorted by timestamp
export function getIntersectionDays<T extends {timestamp: number}>(dayss: Row<T>[]): Row<T>[]{
    if (!dayss.length || dayss.some(z => !z.length)){
        return [];
    }
    var lastIndexes: number[] = dayss.map(_ => 0);
    var lastTimestamps: number[] = dayss.map(z => z[0].timestamp);
    var outputRows: Row<T>[] = dayss.map(_ => []);
    while(true){
        var minValue = Math.min(...lastTimestamps);
        var maxValue = Math.max(...lastTimestamps);
        if (minValue == maxValue){
            for (var i = 0; i < dayss.length; i++){
                outputRows[i].push(dayss[i][lastIndexes[i]])
            }
            for (var i = 0; i < dayss.length; i++){
                lastIndexes[i]++;
                if (lastIndexes[i] >= dayss[i].length){
                    return outputRows;
                }
                lastTimestamps[i] = dayss[i][lastIndexes[i]].timestamp
            }
        } else {
            for (var i = 0; i < dayss.length; i++){
                while (lastTimestamps[i] < maxValue){
                    lastIndexes[i]++;
                    if (lastIndexes[i] >= dayss[i].length){
                        return outputRows;
                    }
                    lastTimestamps[i] = dayss[i][lastIndexes[i]!].timestamp
                }
            }
        }
    }
}

//assumes dayss are already sorted by timestamp
export function getUnionDays<T extends {timestamp: number}>(dayss: Row<T>[]): GetUnionDaysResult<T>{
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
    for(var timestamp of timestamps){
        for (var i = 0; i < dayss.length; i++){
            
            if (lastIndexes[i] >= dayss[i].length){
                dayRows[i].push(null);//timestamp is later than the latest timestamp in dayss[i]
            } 
            else if (dayss[i][lastIndexes[i]].timestamp == timestamp){
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

export function matchDataToTimestamps<T extends {timestamp: number}>(days: Row<T>, timestamps: number[]): Row<T | null>{
    var lastIndex = 0;
    var output: (T | null)[] = [];
    for(var timestamp of timestamps){
        if (lastIndex >= days.length){
            output.push(null);
        } else {
            while (lastIndex < days.length && days[lastIndex].timestamp < timestamp){
                lastIndex++;
            }
            if (days[lastIndex].timestamp == timestamp){
                output.push(days[lastIndex]);
                lastIndex++;
            } else {
                output.push(null);
            }
        }
    }
    return output;
}

export function getAvgAfr(dayPrices: DayPrice[]): number {
    var last = dayPrices[dayPrices.length - 1];
    var dayDiff = Math.round((last.timestamp - dayPrices[0].timestamp) / 86400);

    var avgAfr = ((last.price / dayPrices[0].price) ** (365 / dayDiff)) - 1;
    return avgAfr;
}

export function everyNthItem<T>(arr: T[], n: number): T[] {
    var output: T[] = [];
    for (let i = 0; i < arr.length; i += n) {
        output.push(arr[i]);
    }
    return output;
}
  