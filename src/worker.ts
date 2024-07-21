import { WorkerInputWrapper, WorkerOutputWrapper, WorkerOutputData } from "./models/worker-models";
import { getChartDataHandler } from "./workers/getChartData";
import { getWeightsHandler }  from "./workers/getWeights";
import { getLogAfrsHandler }  from "./workers/getLogAfrs";
var allHandlers = [
    getChartDataHandler, 
    getWeightsHandler,
    getLogAfrsHandler
];

self.addEventListener('message', (event) => {
    var workerInput = event.data as WorkerInputWrapper;
    handleMessage(workerInput).then(res => {
        var workerOutput: WorkerOutputWrapper = {
            id: workerInput.id,
            data: res
        }
        self.postMessage(workerOutput);
    });
});

function handleMessage(input: WorkerInputWrapper): Promise<WorkerOutputData> {
    var handler = allHandlers.find(z => z.name == input.name);
    return handler!.handle(input.data);
}