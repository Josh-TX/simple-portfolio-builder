import { GetWeightsRequest, WorkerInputData, GetChartDataRequest, GetPortfolioSimulationsRequest } from "./models";

export function isGetWeightsRequest(input: WorkerInputData): input is GetWeightsRequest {
    return (<GetWeightsRequest>input).segmentCount != null;
}

export function isGetChartDataRequest(input: WorkerInputData): input is GetChartDataRequest {
    return (<GetChartDataRequest>input).returnDays != null;
}

export function isGetPortfolioSimulationsRequest(input: WorkerInputData): input is GetPortfolioSimulationsRequest {
    return (<GetPortfolioSimulationsRequest>input).portfolio != null;
}