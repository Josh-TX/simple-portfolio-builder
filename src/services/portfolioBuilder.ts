import { ChartData } from "./chartDataBuilder";
import { combinations, getSD, getSum } from "./helpers";
export class PortfolioBuilder{

    private _tickers: string[] = [];
    constructor(){

    }

    getWeights(tickers: string[], segmentCount: number): number[][]{
        this._tickers = tickers;
        var comb = combinations(segmentCount, tickers.length);
        if (comb > 1000000){
            alert("too many combinations");
            return [];
        }
        return this.getWeightPermutations(0, Array(tickers.length).fill(0), segmentCount)
    }

    private getWeightPermutations(startIndex: number, incompleteWeights: number[], remainingSegments: number): number[][]{
        if (remainingSegments == 0){
            return [incompleteWeights];
        }
        var output: number[][] = [];
        for (var i = startIndex; i < this._tickers.length; i++){
            for (var j = remainingSegments; j >= 1; j--){
                var incompleteWeightsCopy = [...incompleteWeights];
                incompleteWeightsCopy[i] += j;
                var weightss = this.getWeightPermutations(i + 1, incompleteWeightsCopy, remainingSegments - j);
                output = output.concat(weightss);
            }
        }
        return output;
    }

    applyPortfolioSummaries(chartData: ChartData, weightss: number[][]){
        var portfolioSummaries: PortfolioSummary[] = [];
        var segmentCount = getSum(weightss[0]);
        var validDataColumns = chartData.dataColumns.filter(column => column.every(z => z != null));
        for (var weights of weightss){
            var portfolioData: number[] = [];
            for (var dataColumn of validDataColumns){
                var val: number = 0;
                for (var i = 0; i < dataColumn.length; i++){
                    val += dataColumn[i]! * weights[i] / segmentCount
                }
                portfolioData.push(val);
            }
            var sum = getSum(portfolioData)
            var sd = getSD(portfolioData, sum);
            if (sd == null){
                console.warn("sd is null");
                continue;
            }
            portfolioSummaries.push({
                weights: weights,
                avg: sum / portfolioData.length,
                sd: sd!
            });
        }
        return portfolioSummaries
    }
}

export type PortfolioSummary = {
    weights: number[],
    avg: number,
    sd: number
}

export type TickerSegmentCount = {}