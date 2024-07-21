import { DayLogAFR, GetLogAfrsRequest } from "../models/models";
import * as miscHelpers2 from "../services/misc-helpers2"
import { IOperationHandler, Operation_GetLogAfrs, OperationName } from "../models/worker-models";


class GetLogAfrsHandler implements IOperationHandler {
    name: OperationName = "getLogAfrs";

    handle: Operation_GetLogAfrs = async (input: GetLogAfrsRequest) => {
        var dayLogAfrss: DayLogAFR[][] = [];
        for (var dayPrices of input.dayPricess){
            var interpolated = miscHelpers2.interpolateDayPrices(dayPrices);
            var afrs = miscHelpers2.getAFRs(interpolated, input.returnDays);
            var logAfrs = miscHelpers2.getLogAFRs(afrs, input.smoothDays);
            dayLogAfrss.push(logAfrs);
        }
        return dayLogAfrss;
    }
}
export var getLogAfrsHandler = new GetLogAfrsHandler();