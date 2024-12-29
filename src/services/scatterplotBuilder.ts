import { DayVal, ScatterplotAxisMode, ScatterplotPoint, ScatterplotDataContainer } from "../models/models";
import * as PriceHelpers from './price-helpers';
import * as MathHelpers from '../services/math-helpers';
import { workerCaller } from "../workers/worker-caller";


export async function getScatterplotDataContainer(
        tickers: string[], 
        dayPricess: DayVal[][], 
        segmentCount: number, 
        filterExpr: string,
        modeX: ScatterplotAxisMode,
        modeY: ScatterplotAxisMode,

    ): Promise<ScatterplotDataContainer>{
    var interpolatedPricess = dayPricess.map(dayPrices => PriceHelpers.interpolateDayPrices(dayPrices));
    var pricess = PriceHelpers.getIntersectionDayPricess(interpolatedPricess)
    var weightss = await workerCaller.getWeightss(
    {
        tickers: tickers,
        segmentCount: segmentCount,
        filterExpr: filterExpr
    });
    var getValueFunc = function(mode: ScatterplotAxisMode, weights: number[]): number{
        var portfolioPrices = PriceHelpers.getPortfolioDayPrices(pricess, weights, 365);
        if (mode == "logReturnSD"){
            var portfolioReturns = PriceHelpers.getReturns(portfolioPrices, 30);
            var portfolioLogReturns = PriceHelpers.getLogReturns(portfolioReturns);
            var sd = MathHelpers.getSD(portfolioLogReturns.map(z => z.val));
            return sd || 0;
        }
        if (mode == "return"){
            var afr = PriceHelpers.getAvgAfr(portfolioPrices);
            return Math.log(afr)/Math.log(2);
        }
        throw  `mode ${mode} not implemented`;
    }
    var points: ScatterplotPoint[] = [];
    for (var weights of weightss){
        var x = getValueFunc(modeX, weights);
        var y = getValueFunc(modeY, weights);
        points.push({
            weights: weights,
            x: x,
            y: y,
        });
    }

    return {
        points: points
    };
}