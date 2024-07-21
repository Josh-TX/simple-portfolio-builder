import { GetWeightsRequest } from "../models/models";
import { IOperationHandler, Operation_GetWeights, OperationName } from "../models/worker-models";
import { PortfolioBuilder } from "../services/portfolioBuilder";

class GetWeightsHandler implements IOperationHandler {
    name: OperationName = "getWeights";

    handle: Operation_GetWeights = async (input: GetWeightsRequest) => {
        let builder = new PortfolioBuilder();
        var weights = builder.getWeights(input.tickers, input.segmentCount, input.filterExpr);
        return weights;
    }
}
export var getWeightsHandler = new GetWeightsHandler();