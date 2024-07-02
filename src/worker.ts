import { ChartDataBuilder } from "./services/chartDataBuilder";
import { PortfolioBuilder } from "./services/portfolioBuilder";
import { GetWeightsRequest, WorkerInputWrapper, WorkerInputData, WorkerOutputWrapper, WorkerOutputData } from "./models/models";
import * as TypeGuards from "./models/type-guards";

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
        let builder = new ChartDataBuilder(input.dayPricess, input.tickers)
            .setFilterDays(input.filterDays)
            .setReturnDays(input.returnDays)
            .setSmoothDays(input.smoothDays);
        var chartData = await builder.build();
        return chartData;
    }
    else if (TypeGuards.isGetWeightsRequest(input)){
        var request = input as GetWeightsRequest
        let builder = new PortfolioBuilder();
        var weights = builder.getWeights(request.tickers, request.segmentCount, request.filterExpr);
        return weights;
    }
    throw "unknown worker input";
}