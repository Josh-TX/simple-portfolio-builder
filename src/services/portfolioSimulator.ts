import { getSum } from "./helpers";
import { generateData } from "./matrix-helper";
import { startTimer, logElapsed } from "./timer";
import { Portfolio } from "../models/models";

class PortfolioSimulator{

    constructor(){

    }

    async getSimulations(portfolio: Portfolio, simulationCount: number, years: number): Promise<number[]>{
        var sumWeight = getSum(portfolio.weights);
        var output: number[] = [];
        var log2 = Math.log(2);
        startTimer("getSimulationsTime");
        for (var simNum = 0; simNum < simulationCount; simNum++){
            var nodesPerYear = 4;
            var nodesPerRebalance = 4;

            var nodes = years * nodesPerYear;
            var columns = generateData(portfolio.avgLogAfrs, portfolio.stdDevLogAfrs, portfolio.correlationMatrix, nodes);
            var prices = portfolio.weights.map(_ => 1); //all simulated funds start at a price of $1
            var shares: number[] = [];
            var startMoney = 10;
            for (var i = 0; i < portfolio.weights.length; i++){
                var moneyForCurrentFund = portfolio.weights[i] / sumWeight * startMoney;
                shares[i] = moneyForCurrentFund / prices[i] 
            }
            var lastRebalanceIndex = 0
            for (var i = 0; i < columns.length; i++){
                for (var j = 0; j < columns[i].length; j++){
                    var afr = (2 ** columns[i][j]);
                    var periodFactorReturn = Math.pow(afr, 1 / nodesPerYear);
                    prices[j] *= periodFactorReturn;
                }
                if (lastRebalanceIndex + nodesPerRebalance == i){
                    var sumMoney = 0;
                    for (var j = 0; j < portfolio.weights.length; j++){
                        sumMoney += prices[j] * shares[j];
                    }
                    for (var j = 0; j < portfolio.weights.length; j++){
                        var moneyForCurrentFund = portfolio.weights[i] / sumWeight * sumMoney;
                        shares[i] = moneyForCurrentFund / prices[i]
                    }

                }
            }
            var sumMoney = 0;
            for (var j = 0; j < portfolio.weights.length; j++){
                sumMoney += prices[j] * shares[j];
            }
            var averageReturn = Math.pow(sumMoney / startMoney, 1 / years)
            var averageLogReturn = Math.log(averageReturn) / log2;
            output.push(averageLogReturn);
        }
        logElapsed("getSimulationsTime")
        return output;
    }
}

export var portfolioSimulator = new PortfolioSimulator();