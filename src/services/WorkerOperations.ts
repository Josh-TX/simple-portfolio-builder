import { callWorker } from "./WorkerCaller";
import {Operation_GetChartData, Operation_GetLogAfrs, Operation_GetWeights} from "../models/worker-models";

export var getWeights: Operation_GetWeights = (i) => callWorker("getWeights", i);
export var getChartData: Operation_GetChartData = (i) => callWorker("getChartData", i);
export var getLogAfrs: Operation_GetLogAfrs = (i) => callWorker("getLogAfrs", i);