import { DayVal, LineChartDataInputs, LineDataContainer } from "../models/models";
import * as MiscHelpers2 from '../services/misc-helpers2';

export function getLineDataContainer(
        tickers: string[], 
        dayPricess: DayVal[][], 
        lineInputs1: LineChartDataInputs, 
        lineInputs2: LineChartDataInputs,
        portfolioWeights: number[] | null
    ): LineDataContainer{

    var seriesLabels = [...tickers, "portfolio"];
    var interpolatedPricess = dayPricess.map(dayPrices => MiscHelpers2.interpolateDayPrices(dayPrices));
    var rebalanceIndexes1: number[] = [];
    var rebalanceIndexes2: number[] = [];
    var firstCommonDayNumber =  MiscHelpers2.getFirstCommonDayNumber(dayPricess);
    var getDataFunc = function(input: LineChartDataInputs, rebalanceIndexes: number[]){
        var pricess = interpolatedPricess
        if (input.mode == "price" && input.equalPrice){
            pricess = pricess.map(prices => MiscHelpers2.getEqualizePrices(prices, firstCommonDayNumber));
        }
        var intersectionPricess = MiscHelpers2.getIntersectionDayPricess(pricess);
        if (portfolioWeights){
            var portfolioPrices = MiscHelpers2.getPortfolioDayPrices(intersectionPricess, portfolioWeights, 365);
            pricess = [...pricess, portfolioPrices]
        }
        if (input.mode == "none"){
            return pricess.map(z => []);
        }
        if (input.mode == "price"){
            return pricess;
        }
        if (input.mode == "portfolioHoldings"){
            if (!portfolioWeights){
                throw "portfolioWeights required for portfolioHoldings mode"
            }
            var portfolioPricess = MiscHelpers2.getPortfolioDayPricess(intersectionPricess, portfolioWeights, 365, rebalanceIndexes);
            portfolioPricess.push([]);//extra item because the portfolio row is blank
            return portfolioPricess;
        }
        var returnss = pricess.map(prices => MiscHelpers2.getReturns(prices, input.returnDays));
        var extReturnss = returnss.map(returns => MiscHelpers2.getExtrapolatedReturns(returns, input.returnDays, input.extrapolateDays));
        if (input.mode == "returns" && input.smoothDays == 0){
            return extReturnss;
        }
        var logReturnss = extReturnss.map(extReturns => MiscHelpers2.getLogReturns(extReturns)); 
        var smoothedLogReturnss = logReturnss.map(logReturns => MiscHelpers2.smoothData(logReturns, input.smoothDays));
        if (input.mode == "logReturns"){
            return smoothedLogReturnss;
        }
        if (input.mode == "returns"){
            var smoothedReturnss = smoothedLogReturnss.map(smoothedLogReturns => MiscHelpers2.getExponentReturns(smoothedLogReturns));
            return smoothedReturnss;
        } else {
            throw "unknown mode"
        }
    }
    var data1: DayVal[][] = getDataFunc(lineInputs1, rebalanceIndexes1);
    var data2: DayVal[][] = getDataFunc(lineInputs2, rebalanceIndexes2);
    var dayNumbers = MiscHelpers2.everyNthItem(MiscHelpers2.getUnionDayNumbers([...data1, ...data2]), 3);
    var start = dayNumbers.findIndex(z => z >= firstCommonDayNumber);
    var output: LineDataContainer = {
        dayNumbers: dayNumbers,
        seriesLabels: seriesLabels,
        LineDatas: [
            {
                data: data1.map(data => MiscHelpers2.matchDataToDayNumbers(dayNumbers, data)),
                labelCallback: z => z != null ? z.toFixed(2) : "",
                yAxisTitle: lineInputs1.mode,
                type: lineInputs1.mode,
                rebalanceIndexes: rebalanceIndexes1 && lineInputs1.showRebalance ? rebalanceIndexes1.map(z => start + Math.ceil(z / 3) - 1) : null,
            },
            {
                data: data2.map(data => MiscHelpers2.matchDataToDayNumbers(dayNumbers, data)),
                labelCallback: z => z != null ? z.toFixed(2) : "",
                yAxisTitle: lineInputs2.mode,
                type: lineInputs2.mode,
                rebalanceIndexes: rebalanceIndexes2 && lineInputs2.showRebalance ? rebalanceIndexes2.map(z => start + Math.ceil(z / 3) - 1) : null,
            },
        ]
    }
    return output;
}