import { WorkerInputWrapper, WorkerOutputWrapper, WorkerOutputData } from "./models/worker-models";
import { operationHandlers } from "./services/WorkerHandlers";

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
    var handler = (<any>operationHandlers)[input.name];
    return handler(input.data);
}