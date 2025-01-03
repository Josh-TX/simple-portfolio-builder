import { FundData, ScatterplotPoint, ScatterplotDataContainer, ScatterplotAxisInputs } from "../models/models";
import * as PriceHelpers from './price-helpers';
import { workerCaller } from "../workers/worker-caller";
import { workerPool } from "../workers/worker-pool";


export async function getScatterplotDataContainer(
        tickers: string[], 
        fundDatas: FundData[], 
        segmentCount: number, 
        filterExpr: string,
        axisInputsX: ScatterplotAxisInputs,
        axisInputsY: ScatterplotAxisInputs,
        includePure: boolean
    ): Promise<ScatterplotDataContainer>{
    var fundDatas = PriceHelpers.getIntersectionDayPricess(fundDatas)
    var weightss = await workerCaller.getWeightss(
    {
        tickers: tickers,
        segmentCount: segmentCount,
        filterExpr: filterExpr,
        includePure: includePure
    });
    if (weightss == null){
        alert("The current settings would calculate way too many portfolios. Try reducing the segment count, removing some tickers, or adding a filter.");
        throw "unable to generate scatterplot"
    }
    if (weightss.length > 200000){
        alert("The current settings would calculate " + weightss.length + " different portfolios. That's just too many. Try reducing the segment count, removing some tickers, or adding a filter.")
        return {
            points: [],
            seriesLabels: tickers,
            axisInputsX: axisInputsX,
            axisInputsY: axisInputsY
        };
    }
    if (weightss.length > 20000){
        if (!confirm("The current settings would calculate " + weightss.length + " different portfolios. Consider reducing the segment count, removing some tickers, or adding a filter. Proceed anyways?")){
            return {
                points: [],
                seriesLabels: tickers,
                axisInputsX: axisInputsX,
                axisInputsY: axisInputsY
            };
        }
    }
    console.log("computing " + weightss.length + " different points");
    var promises: Promise<ScatterplotPoint[]>[] = [];
    var poolSize = workerPool.getPoolSize();
    var sectionSize = Math.ceil(weightss.length / poolSize);
    for (let i = 0; i < weightss.length; i += sectionSize) {
        var weightsSection = weightss.slice(i, i + sectionSize);
        var promise = workerCaller.calculatePoints({
            fundDatas: fundDatas,
            weightss: weightsSection,
            axisInputsX: {...axisInputsX},
            axisInputsY: {...axisInputsY}
        });
        promises.push(promise);
    }
    var pointss = await Promise.all(promises);
    return {
        points: pointss.flat(),
        seriesLabels: tickers,
        axisInputsX: axisInputsX,
        axisInputsY: axisInputsY
    };
}