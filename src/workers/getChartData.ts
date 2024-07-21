import { DayLogAFR, GetChartDataRequest } from "../models/models";
import * as miscHelpers2 from "../services/misc-helpers2"
import { IOperationHandler, Operation_GetChartData, OperationName } from "../models/worker-models";


class GetChartDataHandler implements IOperationHandler {
    name: OperationName = "getChartData";

    handle: Operation_GetChartData = async (input: GetChartDataRequest) => {
        var dayLogAfrss: DayLogAFR[][] = [];
        for (var dayPrices of input.dayPricess){
            var afrs = miscHelpers2.getAFRs(dayPrices, input.returnDays);
            var logAfrs = miscHelpers2.getLogAFRs(afrs, input.smoothDays);
            dayLogAfrss.push(logAfrs);
        }
        var chartData = miscHelpers2.getChartData(input.tickers, dayLogAfrss, input.filterDays);
        return chartData;
    }
}
export var getChartDataHandler = new GetChartDataHandler();