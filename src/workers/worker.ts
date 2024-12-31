//this code runs in a web worker

import type { CalculatePointsRequest, GetWeightsRequest, ScatterplotAxisInputs, ScatterplotPoint } from "../models/models";
import { PortfolioBuilder } from "../services/portfolioBuilder";
import type { WorkerInputWrapper, WorkerOutputWrapper, WorkerOutputData, AllWorkerOperations } from "./worker-models";
import * as PriceHelpers from '../services/price-helpers';
import * as MathHelpers from '../services/math-helpers';

var operations: AllWorkerOperations = {
    async getWeightss(input: GetWeightsRequest): Promise<number[][]> {
        let builder = new PortfolioBuilder();
        var weights = builder.getWeights(input.tickers, input.segmentCount, input.filterExpr);
        return weights;
    },

    async calculatePoints(request: CalculatePointsRequest): Promise<ScatterplotPoint[]> {
        
        var getValueFunc = function(inputs: ScatterplotAxisInputs, weights: number[], tickerSDs: number[] | null): number{
            if (inputs.mode == "riskAdjReturn"){
                if (!tickerSDs){
                    throw "tickerSDs is null";//should't happen
                }
                var adjustedPricess = request.pricess.map((prices,i)=> PriceHelpers.getAdjustPrices(prices, tickerSDs[i] * inputs.riskAdjSD));
                var portfolioPrices = PriceHelpers.getPortfolioDayPrices(adjustedPricess, weights, 365);
                var afr = PriceHelpers.getAvgAfr(portfolioPrices);
                return Math.log(afr)/Math.log(2);
            }
            var portfolioPrices = PriceHelpers.getPortfolioDayPrices(request.pricess, weights, 365);
            if (inputs.mode == "logReturnSD" || inputs.mode == "logLossRMS"){
                var portfolioReturns = PriceHelpers.getReturns(portfolioPrices, inputs.returnDays);
                portfolioReturns = PriceHelpers.getExtrapolatedReturns(portfolioReturns, inputs.returnDays, 365);
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
        var getSDsFunc = function(inputs: ScatterplotAxisInputs): number[] | null{
            if (inputs.mode != "riskAdjReturn"){
                return null;
            }
            var sds = request.pricess.map(prices => {
                var afrs = PriceHelpers.getReturns(prices, inputs.returnDays);
                var logAfrs = PriceHelpers.getLogReturns(afrs);
                if (inputs.smoothDays > 0){
                    logAfrs = PriceHelpers.smoothData(logAfrs, inputs.smoothDays);
                }
                return MathHelpers.getSD(logAfrs.map(z => z.val)) || 0;
            });
            return sds;
        }
        var xTickerSDs = getSDsFunc(request.axisInputsX);
        var yTickerSDs = getSDsFunc(request.axisInputsY);
        var points: ScatterplotPoint[] = [];
        for (var weights of request.weightss){
            var x = getValueFunc(request.axisInputsX, weights, xTickerSDs);
            var y = getValueFunc(request.axisInputsY, weights, yTickerSDs);
            points.push({
                weights: weights,
                x: x,
                y: y,
            });
        }
        return points;
    }
}

self.addEventListener('message', (event) => {
    var workerInput = event.data as WorkerInputWrapper;
    runOperation(workerInput).then(res => {
        var workerOutput: WorkerOutputWrapper = {
            id: workerInput.id,
            data: res
        }
        self.postMessage(workerOutput);
    });
});

function runOperation(input: WorkerInputWrapper): Promise<WorkerOutputData> {
    //for some reason Promise<any> doesn't work
    var operation: any = operations[input.name];
    return operation(input.data);
}