import { PortfolioBuilder } from "./services/portfolioBuilder";
import { GetWeightsRequest, WorkerInputWrapper, WorkerInputData, WorkerOutputWrapper, WorkerOutputData, GetPortfolioSimulationsRequest, DayLogAFR } from "./models/models";
import * as TypeGuards from "./models/type-guards";
import { portfolioSimulator } from "./services/portfolioSimulator";
import * as miscHelpers2 from "./services/misc-helpers2";

self.addEventListener('message', (event) => {
    var workerInput = event.data as WorkerInputWrapper;
    handleMessage(workerInput.data).then(res => {
        var workerOutput: WorkerOutputWrapper = {
            id: workerInput.id,
            data: res
        }
        self.postMessage(workerOutput);
    });
});

async function handleMessage(input: WorkerInputData): Promise<WorkerOutputData> {
    if (TypeGuards.isGetChartDataRequest(input)){
        var dayLogAfrss: DayLogAFR[][] = [];
        for (var dayPrices of input.dayPricess){
            var afrs = miscHelpers2.getAFRs(dayPrices, input.returnDays);
            var logAfrs = miscHelpers2.getLogAFRs(afrs, input.smoothDays);
            dayLogAfrss.push(logAfrs);
        }
        var chartData = miscHelpers2.getChartData(input.tickers, dayLogAfrss, input.filterDays);
        return chartData;
    }
    else if (TypeGuards.isGetWeightsRequest(input)){
        let request = input as GetWeightsRequest
        let builder = new PortfolioBuilder();
        var weights = builder.getWeights(request.tickers, request.segmentCount, request.filterExpr);
        return weights;
    }
    else if (TypeGuards.isGetPortfolioSimulationsRequest(input)){
        let request = input as GetPortfolioSimulationsRequest
        var data = portfolioSimulator.getSimulations(request.portfolio, request.simulationCount, request.years);
        return data;
    }
    throw "unknown worker input";
}