import { DayVal, ScatterplotPoint, ScatterplotDataContainer, ScatterplotAxisInputs } from "../models/models";
import * as PriceHelpers from './price-helpers';
import * as MathHelpers from '../services/math-helpers';
import { workerCaller } from "../workers/worker-caller";


export async function getScatterplotDataContainer(
        tickers: string[], 
        dayPricess: DayVal[][], 
        segmentCount: number, 
        filterExpr: string,
        axisInputsX: ScatterplotAxisInputs,
        axisInputsY: ScatterplotAxisInputs,

    ): Promise<ScatterplotDataContainer>{
    var interpolatedPricess = dayPricess.map(dayPrices => PriceHelpers.interpolateDayPrices(dayPrices));
    var pricess = PriceHelpers.getIntersectionDayPricess(interpolatedPricess)
    var weightss = await workerCaller.getWeightss(
    {
        tickers: tickers,
        segmentCount: segmentCount,
        filterExpr: filterExpr
    });
    var getValueFunc = function(inputs: ScatterplotAxisInputs, weights: number[]): number{
        var portfolioPrices = PriceHelpers.getPortfolioDayPrices(pricess, weights, 365);
        if (inputs.mode == "logReturnSD" || inputs.mode == "logLossRMS"){
            var portfolioReturns = PriceHelpers.getReturns(portfolioPrices, inputs.returnDays);
            var portfolioLogReturns = PriceHelpers.getLogReturns(portfolioReturns);
            if (inputs.smoothDays > 0){
                portfolioLogReturns = PriceHelpers.smoothData(portfolioLogReturns, inputs.smoothDays);
            }
            if (inputs.mode == "logReturnSD"){
                var sd = MathHelpers.getSD(portfolioLogReturns.map(z => z.val));
                return sd || 0;
            } else {
                var losses = portfolioLogReturns.map(z => ({dayNumber: z.dayNumber, val: z.val > 0 ? 0 : z.val}));
                var rms = MathHelpers.getRMS(losses.map(z => z.val));
                return rms || 0;
            }
        }
        if (inputs.mode == "maxDrawdown"){
            var res = PriceHelpers.getMaxDrawdown(portfolioPrices, inputs.drawdownDays);
            return res?.drawdown || 0;
        }
        if (inputs.mode == "return"){
            var afr = PriceHelpers.getAvgAfr(portfolioPrices);
            return Math.log(afr)/Math.log(2);
        }
        throw  `mode ${inputs.mode} not implemented`;
    }

    var points: ScatterplotPoint[] = [];
    for (var weights of weightss){
        var x = getValueFunc(axisInputsX, weights);
        var y = getValueFunc(axisInputsY, weights);
        points.push({
            weights: weights,
            x: x,
            y: y,
        });
    }

    return {
        points: points,
        seriesLabels: tickers,
        axisInputsX: axisInputsX,
        axisInputsY: axisInputsY
    };
}