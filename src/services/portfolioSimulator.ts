import { getSum } from "./helpers";
import { generateData } from "./matrix-helper";
import { startTimer, logElapsed } from "./timer";
import { Portfolio } from "../models/models";

class PortfolioSimulator{

    constructor(){

    }

    async getSimulations(portfolio: Portfolio, simulationCount: number, years: number): Promise<number[]>{
        var totalWeight = getSum(portfolio.weights);
        var output: number[] = [];
        startTimer("getSimulationsTime");
        for (var simNum = 0; simNum < simulationCount; simNum++){
            var columns = generateData(portfolio.avgLogAfrs, portfolio.stdDevLogAfrs, portfolio.correlationMatrix, years);
            var sectionLogReturns: number[] = [];
            for (var i = 0; i < columns.length; i++){
                var weightedSum = 0;
                for (var j = 0; j < columns[i].length; j++){
                    weightedSum += columns[i][j] * portfolio.weights[j];
                }
                sectionLogReturns.push(weightedSum / totalWeight);
            }
            var averageLogReturn = getSum(sectionLogReturns) / sectionLogReturns.length;
            output.push(averageLogReturn);
        }
        logElapsed("getSimulationsTime")
        return output;
    }
}

export var portfolioSimulator = new PortfolioSimulator();