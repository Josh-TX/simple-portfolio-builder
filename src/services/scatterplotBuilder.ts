import { DayVal, ScatterplotPoint, ScatterplotDataContainer, ScatterplotAxisInputs } from "../models/models";
import * as PriceHelpers from './price-helpers';
import * as MathHelpers from '../services/math-helpers';
import { workerCaller } from "../workers/worker-caller";
import { workerPool } from "../workers/worker-pool";


export async function getScatterplotDataContainer(
        tickers: string[], 
        dayPricess: DayVal[][], 
        segmentCount: number, 
        filterExpr: string,
        axisInputsX: ScatterplotAxisInputs,
        axisInputsY: ScatterplotAxisInputs,

    ): Promise<ScatterplotDataContainer>{
    var interpolatedPricess = dayPricess.map(dayPrices => PriceHelpers.interpolateDayPrices(dayPrices));
    var pricess = PriceHelpers.getIntersectionDayPricess(interpolatedPricess)
    var weightss = await workerCaller.getWeightss(
    {
        tickers: tickers,
        segmentCount: segmentCount,
        filterExpr: filterExpr
    });
    if (weightss.length > 20000){
        if (!confirm("The current settings would calculate " + weightss.length + " different portfolios (that could take a while). Consider reducing the segment count, removing some tickers, or adding a filter. Procede anyways?")){
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
            pricess: pricess,
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