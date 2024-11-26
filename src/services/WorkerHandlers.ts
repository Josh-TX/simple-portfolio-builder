import { GetWeightsRequest, DayPrice, DayReturn } from "../models/models";
import { AllWorkerOperations } from "../models/worker-models";
import { PortfolioBuilder } from "./portfolioBuilder";
import * as miscHelpers from "./misc-helpers2";

//this file runs in the context of a worker

class OperationHandlers implements AllWorkerOperations {
    async getWeights(input: GetWeightsRequest): Promise<number[][]> {
        let builder = new PortfolioBuilder();
        var weights = builder.getWeights(input.tickers, input.segmentCount, input.filterExpr);
        return weights;
    }

    async getInterpolatedPrices (input: DayPrice[]): Promise<DayPrice[]> {
        return miscHelpers.interpolateDayPrices(input);
    }

    async getReturns(input: {dayPrices: DayPrice[], returnDays: number}): Promise<DayReturn[]> {
        return miscHelpers.getReturns(input.dayPrices, input.returnDays);
    }
}

export var operationHandlers = new OperationHandlers();