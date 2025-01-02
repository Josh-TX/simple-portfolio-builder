import { FundData, LineChartDataInputs, LineDataContainer } from "../models/models";
import * as PriceHelpers from './price-helpers';

export function getLineDataContainer(
        tickers: string[], 
        fundDatas: FundData[], 
        lineInputs1: LineChartDataInputs, 
        lineInputs2: LineChartDataInputs
    ): LineDataContainer{

    var seriesLabels = [...tickers];
    var firstCommonDayNumber =  PriceHelpers.getFirstCommonDayNumber(fundDatas);
    var getDataFunc = function(input: LineChartDataInputs): (FundData | null)[] {
        var currentFundDatas = fundDatas
        if (input.equalPrice && (input.mode == "price" || input.mode == "maxDrawdown")){
            currentFundDatas = currentFundDatas.map(fundData => PriceHelpers.getEqualizePrices(fundData, firstCommonDayNumber));
        }
        if (input.mode == "none"){
            return fundDatas.map(_ => null);//might need to fix this?
        }
        if (input.mode == "price"){
            return currentFundDatas;
        }
        if (input.mode == "maxDrawdown"){
            return currentFundDatas.map(fundData => {
                var maxDropdown = PriceHelpers.getMaxDrawdown(fundData, input.drawdownDays);
                return maxDropdown?.fundData || null;
            });
        }
        var afrFundDatas = currentFundDatas.map(fundDatas => PriceHelpers.getReturns(fundDatas, input.returnDays));
        afrFundDatas = afrFundDatas.map(fundData => PriceHelpers.getExtrapolatedReturns(fundData, input.returnDays, input.extrapolateDays));
        if (input.mode == "returns" && input.smoothDays == 0){
            return afrFundDatas;
        }
        var logAfrFundDatas = afrFundDatas.map(fundData => PriceHelpers.getLogReturns(fundData)); 
        var smoothedFundDatas = logAfrFundDatas.map(fundData => PriceHelpers.getSmoothData(fundData, input.smoothDays));
        if (input.mode == "logReturns"){
            return smoothedFundDatas;
        }
        if (input.mode == "logLosses"){
            //mutating seems fine
            for (var fundData of smoothedFundDatas){                
                for (var i = 0; i < fundData.values.length; i++){
                    fundData.values[i] = Math.min(0, fundData.values[i]);
                }
            }
            return smoothedFundDatas;
        }
        if (input.mode == "returns"){
            var exponentFundDatas = smoothedFundDatas.map(fundDatas => PriceHelpers.getExponentReturns(fundDatas));
            return exponentFundDatas;
        } else {
            throw "unknown mode"
        }
    }
    var fundDatas1 = getDataFunc(lineInputs1);
    var fundDatas2 = getDataFunc(lineInputs2);
    var nonNullFundDatas = [...fundDatas1, ...fundDatas2].filter(z => !!z) as FundData[];
    var dayNumbers = PriceHelpers.everyNthItem(PriceHelpers.getUnionDayNumbers(nonNullFundDatas), 3);
    var output: LineDataContainer = {
        dayNumbers: dayNumbers,
        seriesLabels: seriesLabels,
        LineDatas: [
            {
                data: fundDatas1.map(fundData => PriceHelpers.matchDataToDayNumbers(dayNumbers, fundData)),
                labelCallback: z => z != null ? z.toFixed(2) : "",
                yAxisTitle: lineInputs1.mode,
                type: lineInputs1.mode
            },
            {
                data: fundDatas2.map(fundData => PriceHelpers.matchDataToDayNumbers(dayNumbers, fundData)),
                labelCallback: z => z != null ? z.toFixed(2) : "",
                yAxisTitle: lineInputs2.mode,
                type: lineInputs2.mode
            },
        ]
    }
    return output;
}