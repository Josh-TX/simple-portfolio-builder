import { combinations } from "./helpers";
//console.log("portfolioBuilder module")
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
}

export type TickerSegmentCount = {}