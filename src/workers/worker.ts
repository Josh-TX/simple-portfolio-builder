//this code runs in a web worker

import type { CalculatePointsRequest, GetWeightsRequest, ScatterplotAxisInputs, ScatterplotPoint } from "../models/models";
import { PortfolioBuilder } from "../services/portfolioBuilder";
import type { WorkerInputWrapper, WorkerOutputWrapper, WorkerOutputData, AllWorkerOperations } from "./worker-models";
import * as PriceHelpers from '../services/price-helpers';
import * as MathHelpers from '../services/math-helpers';

var operations: AllWorkerOperations = {
    async getWeightss(input: GetWeightsRequest): Promise<number[][] | null> {
        let builder = new PortfolioBuilder();
        var weights = builder.getWeights(input.tickers, input.segmentCount, input.filterExpr, input.includePure);
        return weights;
    },

    async calculatePoints(request: CalculatePointsRequest): Promise<ScatterplotPoint[]> {
        
        var getValueFunc = function(inputs: ScatterplotAxisInputs, weights: number[]): number{
            var portfolioFundData = PriceHelpers.getPortfolioDayPrices(request.fundDatas, weights, 365);
            if (inputs.mode == "logReturnSD" || inputs.mode == "logLossRMS"){
                var portfolioReturns = PriceHelpers.getReturns(portfolioFundData, inputs.returnDays);
                portfolioReturns = PriceHelpers.getExtrapolatedReturns(portfolioReturns, inputs.returnDays, 365);
                var portfolioLogReturns = PriceHelpers.getLogReturns(portfolioReturns);
                if (inputs.smoothDays > 0){
                    portfolioLogReturns = PriceHelpers.getSmoothData(portfolioLogReturns, inputs.smoothDays);
                }
                if (inputs.mode == "logReturnSD"){
                    var sd = MathHelpers.getSD(Array.from(portfolioLogReturns.values));
                    return sd || 0;
                } else {
                    for (var i = 0; i < portfolioLogReturns.values.length; i++){
                        portfolioLogReturns.values[i] = Math.min(0, portfolioLogReturns.values[i]);
                    }
                    var rms = MathHelpers.getRMS(Array.from(portfolioLogReturns.values));
                    return rms || 0;
                }
            }
            if (inputs.mode == "maxDrawdown"){
                var res = PriceHelpers.getMaxDrawdown(portfolioFundData, inputs.drawdownDays);
                return res?.drawdown || 0;
            }
            if (inputs.mode == "return"){
                var afr = PriceHelpers.getAvgAfr(portfolioFundData);
                return Math.log(afr)/Math.log(2);
            }
            throw  `mode ${inputs.mode} not implemented`;
        }
        var points: ScatterplotPoint[] = [];
        for (var weights of request.weightss){
            var x = getValueFunc(request.axisInputsX, weights);
            var y = getValueFunc(request.axisInputsY, weights);
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