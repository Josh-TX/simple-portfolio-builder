import { PortfolioSummary } from "../models/models";
import { ChartData } from "./chartDataBuilder";
import { combinations, getSD, getSum } from "./helpers";
import { Expression, Parser } from 'expr-eval';

export class PortfolioBuilder{

    private _tickers: string[] = [];
    private _filterExpr: Expression | null = null;
    private _loggedError: boolean = false;
    constructor(){

    }

    getWeights(tickers: string[], segmentCount: number, filterExpr: string): number[][]{
        this._tickers = tickers.map(z => z.toLowerCase()).map(z => z == "$" ? "moneymarket" : z);
        this._filterExpr = null;
        if (filterExpr){
            filterExpr = filterExpr.toLowerCase().replace(/(?<![<>!=])=(?![=])/g, '==').replace(/&&?/g, ' and ').replace(/\|\|?/g, ' or ').replace("$", ' moneymarket ');;
            var parser =  new Parser();
            this._filterExpr = parser.parse(filterExpr);
        }
        this._loggedError = false;
        var comb = combinations(segmentCount, tickers.length);
        if (comb > 1000000){
            alert("too many combinations");
            return [];
        }
        return this.getWeightPermutations(0, Array(tickers.length).fill(0), segmentCount)
    }

    private getWeightPermutations(startIndex: number, incompleteWeights: number[], remainingSegments: number): number[][]{
        if (remainingSegments == 0){
            if (this._filterExpr){
                var exprData: {[ticker: string]: number} = {};
                for (var i = 0; i < incompleteWeights.length; i++){
                    exprData[this._tickers[i]] = incompleteWeights[i];
                }
                try {
                    var passesFilter = this._filterExpr.evaluate(exprData);
                    return passesFilter ? [incompleteWeights] : [];
                } catch(e){
                    if (!this._loggedError){
                        console.error(e);
                        this._loggedError = true;
                    }
                }
            }
            return [incompleteWeights];
        }
        var output: number[][] = [];
        for (var i = startIndex; i < incompleteWeights.length; i++){
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
        var log2 = Math.log(2);
        for (var weights of weightss){
            var portfolioData: number[] = [];
            for (var dataColumn of validDataColumns){
                //when getting the weighted average of several funds, it can be tempting to just average the log-scaled returns
                //but doing so is incorrect. That would result in the geometric mean of the different funds, which isn't what we want
                //we need to exponent the log returns so that their just normal factor returns, get the arithmetic mean, and then log scale that result. 
                var val: number = 0;
                for (var i = 0; i < dataColumn.length; i++){
                    val += Math.pow(2, dataColumn[i]!) * weights[i] / segmentCount
                }
                portfolioData.push(Math.log(val) / log2);
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

export type TickerSegmentCount = {}