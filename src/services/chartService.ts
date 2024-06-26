import { flattenArray, getDistinct, getSum } from "./helpers";
import { getPriceHistory } from "./priceLoader";

export async function getChartData(tickers: string[]): Promise<ChartData> {
    var promises = tickers.map(z => getPriceHistory(z));
    var dayPricess = await Promise.all(promises);
    var timestamps = getDistinct(flattenArray(dayPricess.map(dayPrices => dayPrices.map(z => z.timestamp))));
    var dataColumns: ChartDataColumn[] = [];
    for(var timestamp of timestamps){
        var dataColumn: ChartDataColumn = [];
        for (var dayPrices of dayPricess){
            var foundDayPrice = dayPrices.find(z => z.timestamp == timestamp);
            dataColumn.push(foundDayPrice ? foundDayPrice.price : null);
        }
        dataColumns.push(dataColumn);
    }
    return {
        timestamps: timestamps,
        seriesLabels: tickers,
        dataColumns: dataColumns
    }
}

export function getLogAfrs(chartData: ChartData, returnDays: number): ChartData{
    if (chartData.timestamps.length < 2){
        return chartData;
    }
    var indexDiff = Math.ceil(returnDays * 5 / 7);
    var newTimestamps: number[] = [];
    var newDataColumns: ChartDataColumn[] = [];
    var log2 = Math.log(2);
    for (var i = indexDiff; i < chartData.timestamps.length; i++){
        newTimestamps.push(chartData.timestamps[i]);
        var newDataColumn: ChartDataColumn = [];
        for (var j = 0; j < chartData.seriesLabels.length; j++){
            var startVal = chartData.dataColumns[i - indexDiff][j];
            var endVal = chartData.dataColumns[i][j];
            if (startVal == null || endVal == null){
                newDataColumn.push(null)
            } else {
                var factorReturn = endVal / startVal;
                var afr = Math.pow(factorReturn, 365 / returnDays);
                newDataColumn.push(Math.log(afr) / log2)
            }
        }
        newDataColumns.push(newDataColumn)
    }
    return {
        timestamps: newTimestamps,
        seriesLabels: [...chartData.seriesLabels],
        dataColumns: newDataColumns
    };
}

export function smoothData(chartData: ChartData, days: number): ChartData{ 
    var indexDiff = Math.floor((days - 1) * 5 / 7 / 2);
    var newDataColumns: ChartDataColumn[] = [];
    for (var i = 0; i < chartData.timestamps.length; i++){
        var newDataColumn: ChartDataColumn = [];
        for (var j = 0; j < chartData.seriesLabels.length; j++){
            if (chartData.dataColumns[i][j] == null){
                newDataColumn[j] = null;
                continue; 
            }
            var left: number[] = [];
            var right: number[] = [];
            for (var k = 0; k < indexDiff; k++){
                var leftIndex = i - k - 1;
                var rightIndex = i + k + 1;
                if (leftIndex >= 0 && chartData.dataColumns[leftIndex][j] != null){
                    left.push(chartData.dataColumns[leftIndex][j]!)
                }
                if (rightIndex < chartData.timestamps.length && chartData.dataColumns[rightIndex][j] != null){
                    right.push(chartData.dataColumns[rightIndex][j]!)
                }
            }
            var leftWeights = getWeights(left.length, true);
            var rightWeights = getWeights(right.length, false);
            var sumWeight = getSum(leftWeights) + getSum(rightWeights) + 1;
            var sumValue = chartData.dataColumns[i][j]!;
            for (var k = 0; k < left.length; k++){
                sumValue += left[k] * leftWeights[k];
            }
            for (var k = 0; k < right.length; k++){
                sumValue += right[k] * rightWeights[k];
            }
            newDataColumn[j] = sumValue / sumWeight;
        }
        newDataColumns.push(newDataColumn)
    }
    return {
        timestamps: chartData.timestamps,
        seriesLabels: [...chartData.seriesLabels],
        dataColumns: newDataColumns
    };
}

function getWeights(len: number, isLeft: boolean): number[]{
    var weights: number[] = []
    for (var i = 0; i < len; i++){
        weights.push(1);
        //weights.push((len - i) / (len + 1))
    }
    if (isLeft){
        weights.reverse();
    }
    return weights
}

export type ChartData = {
    timestamps: number[],
    seriesLabels: string[],
    dataColumns: ChartDataColumn[]
}

export type ChartDataColumn = Array<number | null>;
