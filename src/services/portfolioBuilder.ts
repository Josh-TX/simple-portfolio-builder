import * as MathHelpers from "./math-helpers";
import { Expression, Parser } from 'expr-eval';

export class PortfolioBuilder{

    private _tickers: string[] = [];
    private _filterExpr: Expression | null = null;
    private _loggedError: boolean = false;
    constructor(){

    }

    getWeights(tickers: string[], segmentCount: number, filterExpr: string): number[][] | null{
        this._tickers = tickers.map(z => z.toLowerCase()).map(z => z == "$" ? "moneymarket" : z);
        this._filterExpr = null;
        if (filterExpr){
            //replace `=` with `==`, `&` or `&&` with ` and `, `|` or `||` with ` or `
            filterExpr = filterExpr.toLowerCase().replace(/(?<![<>!=])=(?![=])/g, '==').replace(/&&?/g, ' and ').replace(/\|\|?/g, ' or ').replace("$", ' moneymarket ');
            var parser =  new Parser();
            this._filterExpr = parser.parse(filterExpr);
        }
        this._loggedError = false;
        var comb = MathHelpers.combinations(segmentCount, tickers.length);
        if (comb > 1000000 && !filterExpr){
            console.error("settings would've generated " + comb + " portfolios. That is way too many.");
            return null;
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
}