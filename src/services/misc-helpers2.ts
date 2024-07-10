import { DayPrice, DayAFR, DayLogAFR } from "../models/models";
import { ChartData, ChartDataColumn } from "./chartDataBuilder";
import { getSum } from "./helpers";

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
    for (var i = returnDays; i < dayPrices.length; i++){
        var afr = Math.pow((dayPrices[i].price / dayPrices[i - returnDays].price),  exponent)
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