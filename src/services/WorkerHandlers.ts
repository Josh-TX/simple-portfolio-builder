// import { DayLogAFR, GetChartDataRequest, GetWeightsRequest } from "../models/models";
// import { IWorkerHandler } from "../models/worker-models";
// import { PortfolioBuilder } from "./portfolioBuilder";
// import { callWorker } from "./WorkerCaller";
// import * as miscHelpers2 from "./misc-helpers2"
// import { ChartData } from "./chartDataBuilder";

// class GetWeightsWorker implements IWorkerHandler {
//     name = "getWeights";

//     //runs in a worker
//     async handle(input: GetWeightsRequest): Promise<number[][]> {
//         let builder = new PortfolioBuilder();
//         var weights = builder.getWeights(input.tickers, input.segmentCount, input.filterExpr);
//         return weights;
//     }

//     getWeights(input: GetWeightsRequest): Promise<number[][]>{
//         return callWorker(this.name, input);
//     }
// }
// export var getWeightsWorker = new GetWeightsWorker();



// class GetChartDataWorker implements IWorkerHandler{
//     name = "getChartDataWorker";

//     async handle(input: GetChartDataRequest): Promise<ChartData>{
//         var dayLogAfrss: DayLogAFR[][] = [];
//         for (var dayPrices of input.dayPricess){
//             var afrs = miscHelpers2.getAFRs(dayPrices, input.returnDays);
//             var logAfrs = miscHelpers2.getLogAFRs(afrs, input.smoothDays);
//             dayLogAfrss.push(logAfrs);
//         }
//         var chartData = miscHelpers2.getChartData(input.tickers, dayLogAfrss, input.filterDays);
//         return chartData;
//     }

//     getChartData(input: GetChartDataRequest): Promise<ChartData>{
//         return callWorker(this.name, input);
//     }
// }
// var getChartDataWorker = new GetChartDataWorker();



// export var allWorkerHandlers: IWorkerHandler[] = [
//     getWeightsWorker,
//     getChartDataWorker
// ]