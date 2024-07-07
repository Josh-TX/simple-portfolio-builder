import { ChartData, ChartDataBuilder } from "./services/chartDataBuilder";
import { PortfolioBuilder } from "./services/portfolioBuilder";
import { GetWeightsRequest, WorkerInputWrapper, WorkerInputData, WorkerOutputWrapper, WorkerOutputData, GetPortfolioSimulationsRequest } from "./models/models";
import * as TypeGuards from "./models/type-guards";
import { portfolioSimulator } from "./services/portfolioSimulator";
import * as miscHelpers from "./services/misc-helpers";
import * as matrixHelpers from "./services/matrix-helper";

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
        var timestamps = miscHelpers.getTimestamps(input.dayPricess, input.filterDays);
        var priceColumns = miscHelpers.getPriceColumns(timestamps, input.dayPricess);
        var priceRows = matrixHelpers.transpose(priceColumns);
        var smoothedLogAfrRows = priceRows.map(z => {
            var afrs = miscHelpers.getAFRs(timestamps, z, input.returnDays);
            var fixedTimestamp = timestamps.slice(timestamps.length - afrs.length);
            var logAfrs = afrs.map(z => z != null ? Math.log(z)/Math.log(2) : null);
            var smoothedAfr = miscHelpers.getSmoothedLogAFRs(fixedTimestamp, logAfrs, input.smoothDays);
            return smoothedAfr;
        });
        var maxLength = Math.max(...smoothedLogAfrRows.map(z => z.length));
        var chartData: ChartData = {
            timestamps: timestamps.slice(timestamps.length - maxLength),
            seriesLabels: input.tickers,
            dataColumns: matrixHelpers.transpose(smoothedLogAfrRows)
        };

        // miscHelpers.getPriceColumns(input.)
        // let builder = new ChartDataBuilder(input.dayPricess, input.tickers)
        //     .setFilterDays(input.filterDays)
        //     .setReturnDays(input.returnDays)
        //     .setSmoothDays(input.smoothDays);
        // var chartData = await builder.build();
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