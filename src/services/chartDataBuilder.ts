import { DayVal, LineChartDataInputs, LineDataContainer } from "../models/models";
import * as PriceHelpers from './price-helpers';

export function getLineDataContainer(
        tickers: string[], 
        dayPricess: DayVal[][], 
        lineInputs1: LineChartDataInputs, 
        lineInputs2: LineChartDataInputs,
        portfolioWeights: number[] | null
    ): LineDataContainer{

    var seriesLabels = [...tickers, "portfolio"];
    var interpolatedPricess = dayPricess.map(dayPrices => PriceHelpers.interpolateDayPrices(dayPrices));
    var rebalanceIndexes1: number[] = [];
    var rebalanceIndexes2: number[] = [];
    var firstCommonDayNumber =  PriceHelpers.getFirstCommonDayNumber(dayPricess);
    var getDataFunc = function(input: LineChartDataInputs, rebalanceIndexes: number[]){
        var pricess = interpolatedPricess
        if (input.equalPrice && (input.mode == "price" || input.mode == "maxDrawdown")){
            pricess = pricess.map(prices => PriceHelpers.getEqualizePrices(prices, firstCommonDayNumber));
        }
        var intersectionPricess = portfolioWeights ? PriceHelpers.getIntersectionDayPricess(pricess) : [];
        if (portfolioWeights){
            var portfolioPrices = PriceHelpers.getPortfolioDayPrices(intersectionPricess, portfolioWeights, 365);
            pricess = [...pricess, portfolioPrices]
        }
        if (input.mode == "none"){
            return pricess.map(_ => []);
        }
        if (input.mode == "price"){
            return pricess;
        }
        if (input.mode == "maxDrawdown"){
            return pricess.map(prices => {
                var maxDropdown = PriceHelpers.getMaxDrawdown(prices, input.drawdownDays);
                return maxDropdown?.prices || [];
            });
        }
        if (input.mode == "portfolioHoldings"){
            if (!portfolioWeights){
                throw "portfolioWeights required for portfolioHoldings mode"
            }
            var portfolioPricess = PriceHelpers.getPortfolioDayPricess(intersectionPricess, portfolioWeights, 365, rebalanceIndexes);
            portfolioPricess.push([]);//extra item because the portfolio row is blank
            return portfolioPricess;
        }
        var returnss = pricess.map(prices => PriceHelpers.getReturns(prices, input.returnDays));
        var extReturnss = returnss.map(returns => PriceHelpers.getExtrapolatedReturns(returns, input.returnDays, input.extrapolateDays));
        if (input.mode == "returns" && input.smoothDays == 0){
            return extReturnss;
        }
        var logReturnss = extReturnss.map(extReturns => PriceHelpers.getLogReturns(extReturns)); 
        var smoothedLogReturnss = logReturnss.map(logReturns => PriceHelpers.smoothData(logReturns, input.smoothDays));
        if (input.mode == "logReturns"){
            return smoothedLogReturnss;
        }
        if (input.mode == "logLosses"){
            return smoothedLogReturnss.map(logReturns => {
                return logReturns.map(z => ({dayNumber: z.dayNumber, val: z.val > 0 ? 0 : z.val}))
            });
        }
        if (input.mode == "returns"){
            var smoothedReturnss = smoothedLogReturnss.map(smoothedLogReturns => PriceHelpers.getExponentReturns(smoothedLogReturns));
            return smoothedReturnss;
        } else {
            throw "unknown mode"
        }
    }
    var data1: DayVal[][] = getDataFunc(lineInputs1, rebalanceIndexes1);
    var data2: DayVal[][] = getDataFunc(lineInputs2, rebalanceIndexes2);
    var dayNumbers = PriceHelpers.everyNthItem(PriceHelpers.getUnionDayNumbers([...data1, ...data2]), 3);
    var start = dayNumbers.findIndex(z => z >= firstCommonDayNumber);
    var output: LineDataContainer = {
        dayNumbers: dayNumbers,
        seriesLabels: seriesLabels,
        LineDatas: [
            {
                data: data1.map(data => PriceHelpers.matchDataToDayNumbers(dayNumbers, data)),
                labelCallback: z => z != null ? z.toFixed(2) : "",
                yAxisTitle: lineInputs1.mode,
                type: lineInputs1.mode,
                rebalanceIndexes: rebalanceIndexes1 && lineInputs1.showRebalance ? rebalanceIndexes1.map(z => start + Math.ceil(z / 3) - 1) : null,
            },
            {
                data: data2.map(data => PriceHelpers.matchDataToDayNumbers(dayNumbers, data)),
                labelCallback: z => z != null ? z.toFixed(2) : "",
                yAxisTitle: lineInputs2.mode,
                type: lineInputs2.mode,
                rebalanceIndexes: rebalanceIndexes2 && lineInputs2.showRebalance ? rebalanceIndexes2.map(z => start + Math.ceil(z / 3) - 1) : null,
            },
        ]
    }
    return output;
}