<script setup lang="ts">

import LineChart from './LineChart.vue';
import TickerInputComponent from './TickerInputComponent.vue';
import LineChartInputComponent from './LineChartInputComponent.vue';
import { tickerInputs } from '../services/tickerInputService';
import { reactive, Reactive, Ref, ref, ShallowRef, watch } from 'vue'
import { debounce } from '../services/debouncer';
import { DayLogAFR, DayReturn, DayVal, GetLogAfrsRequest, LineChartDataInputs, LineDataContainer } from '../models/models';
import { getPriceHistory } from '../services/priceLoader';
import { getSD } from '../services/helpers';
import { workerOperations } from '../services/WorkerOperations';
import { operationHandlers } from '../services/WorkerHandlers';
import * as MiscHelpers2 from '../services/misc-helpers2';
import { getLineDataContainer } from '../services/chartDataBuilder'
import { localSettingsService } from '../services/localSettingsService';



var lineDataContainer: ShallowRef<LineDataContainer | null> = ref(null);
var correlationMatrix: Ref<number[][] | null> = ref(null);
var tickerArray: Ref<string[] | null> = ref(null);
var averages: Ref<string[] | null> = ref(null);
var sds: Ref<string[] | null> = ref(null);

var dayLogAfrss: DayLogAFR[][] = [];

var lineInputs1: Reactive<LineChartDataInputs> = reactive(localSettingsService.getValue("lineChartInputs1") || { mode: "price", equalPrice: true, returnDays: 30, smoothDays: 5, extrapolateDays: 365, showRebalance: false});
var lineInputs2: Reactive<LineChartDataInputs> = reactive(localSettingsService.getValue("lineChartInputs2") || { mode: "logReturns", equalPrice: true, returnDays: 30, smoothDays: 5, extrapolateDays: 365, showRebalance: false});

async function updateData(){
    var tempTickerArray = tickerInputs.tickers.split(/[^a-zA-Z$]+/).filter(z => !!z);
    tickerArray.value = tempTickerArray;


    var seriesLabels = [...tempTickerArray];
    var priceHistoryPromises = tempTickerArray.map(z => getPriceHistory(z));
    var dayPricess = await Promise.all(priceHistoryPromises);
    // var interpolatedPricess = dayPricess.map(dayPrices => MiscHelpers2.interpolateDayPrices(dayPrices));
    // var intersectionPricess = MiscHelpers2.getIntersectionDayPrices(interpolatedPricess);
    // if ((lineInputs1.mode == "price" && lineInputs1.equalPrice) || lineInputs2.mode == "price" && lineInputs2.equalPrice){
    //     for (var i = 0; i < interpolatedPricess.length; i++){
    //         MiscHelpers2.equalizePrices(interpolatedPricess[i], intersectionPricess[0][0].timestamp);
    //     }
    // }
    // var portfolioPrices = MiscHelpers2.getPortfolioDayPrices(intersectionPricess, intersectionPricess.map(_ => 1/intersectionPricess.length), 365);
    // var rebalanceIndexes: number[] = []
    // var portfolioPricess = MiscHelpers2.getPortfolioDayPricess(intersectionPricess, intersectionPricess.map(_ => 1/intersectionPricess.length), 365, rebalanceIndexes);
    // interpolatedPricess.push(portfolioPrices);
    // portfolioPricess.push([])
    // seriesLabels.push("portfolio");
    // var func = function(input: LineChartDataInputs){
    //     var output: DayVal[][] = []
    //     for (var i = 0; i < interpolatedPricess.length; i++){
    //         if (input.mode == "none"){
    //             output.push([]);
    //             continue;
    //         }
    //         if (input.mode == "price"){
    //             output.push(interpolatedPricess[i]);
    //             continue;
    //         }
    //         if (input.mode == "portfolioHoldings"){
    //             output.push(portfolioPricess[i]);
    //             continue;
    //         }
    //         var returns = MiscHelpers2.getReturns(interpolatedPricess[i], input.returnDays);
    //         var extReturns = MiscHelpers2.getExtrapolatedReturns(returns, input.returnDays, input.extrapolateDays);
    //         if (input.mode == "returns" && input.smoothDays == 0){
    //             output.push(extReturns);
    //             continue;
    //         }
    //         var logReturns = MiscHelpers2.getLogReturns(extReturns); 
    //         if (input.mode == "logReturns" && input.smoothDays == 0){
    //             output.push(logReturns);
    //             continue;
    //         }
    //         var smoothedLogReturns = MiscHelpers2.smoothData(logReturns, input.smoothDays);
    //         if (input.mode == "logReturns"){
    //             output.push(smoothedLogReturns);
    //             continue;
    //         }
    //         //must be smooth returns
    //         var smoothedReturns = MiscHelpers2.getExponentReturns(smoothedLogReturns)
    //         output.push(smoothedReturns);
    //     }
    //     return output;
    // }
    // var data1: DayVal[][] = func(lineInputs1);
    // var data2: DayVal[][] = func(lineInputs2);
    // var timestamps = MiscHelpers2.everyNthItem(MiscHelpers2.getUnionTimestamps([...data1, ...data2]), 3);
    // var start = timestamps.findIndex(z => z >= portfolioPricess[0][0].timestamp);
    // rebalanceIndexes = rebalanceIndexes.map(z => start + Math.ceil(z / 3) - 1);
    lineDataContainer.value = getLineDataContainer(tempTickerArray, dayPricess, lineInputs1, lineInputs2, tempTickerArray.map(z => 1))
    // correlationMatrix.value = MiscHelpers2.getCorrelationMatrix(dayLogAfrss);
    // averages.value = [];
    // sds.value = [];
    // for (var i = 0; i < tempTickerArray.length; i++){
    //     var avgAfr = MiscHelpers2.getAvgAfr(dayPricess[i]);
    //     var logAfrSd = getSD(dayLogAfrss[i].map(z => z.logAfr))!;
    //     averages.value.push((Math.round(avgAfr * 1000) / 10) + "%");
    //     sds.value.push((Math.round((Math.pow(2, logAfrSd)-1) * 1000) / 10) + "%");
    // }
}

watch(lineInputs1, () => {
    debounce("a", 500, () => updateData());
    localSettingsService.setValue("lineChartInputs1", lineInputs1)
});
watch(lineInputs2, () => {
    debounce("a", 500, () => updateData());
    localSettingsService.setValue("lineChartInputs2", lineInputs2)
});

watch(() => tickerInputs.returnDays, () => {
    debounce("a", 500, () => updateData());
});
watch(() => tickerInputs.smoothDays, () => {
    debounce("a", 500, () => updateData());
});
watch(() => tickerInputs.filterDays, () => {
    debounce("a", 500, () => updateData());
});
watch(() => tickerInputs.tickers, () => {
    debounce("a", 1000, () => updateData());
});

function roundTo2 (num: number) { return num == 1 ? 1 : num.toFixed(2) }

updateData();
</script>

<template>
    <TickerInputComponent/>
    <div style="display: flex; width: 100%; margin-top: 8px; gap: 12px;">
        <div style="width: 100%; background: #333; padding: 8px; border-radius: 4px; box-shadow: 1px 1px 3px #00000055;">
            <div style="line-height: 1rem; margin-bottom: 2px;">SOLID LINE</div>
            <LineChartInputComponent v-model:inputs="lineInputs1"></LineChartInputComponent>
        </div>
        <div style="width: 100%; background: #333; padding: 8px; border-radius: 4px; box-shadow: 1px 1px 3px #00000055;">
            <div style="line-height: 1rem; margin-bottom: 2px;">DOTTED LINE</div>
            <LineChartInputComponent v-model:inputs="lineInputs2"></LineChartInputComponent>
        </div>
    </div>
    <div style="height: 80vh; position: relative; width: 100%;" >
        <LineChart :dataContainer="lineDataContainer"/> 
    </div>
    <div style="display: flex; gap: 48px;">
        <table v-if="averages && sds">
            <tr>
                <td style="padding: 0 12px;">Ticker</td>
                <td style="padding: 0 12px;">Avg return</td>
                <td style="padding: 0 12px;">Std Dev</td>
            </tr>
            <tr v-for="(ticker, index) in tickerArray">
                <td style="padding: 0 12px;">{{ ticker }}</td>
                <td style="padding: 0 12px;">{{ averages![index] }}</td>
                <td style="padding: 0 12px;">{{ sds![index] }}</td>
            </tr>
        </table>
        <table v-if="correlationMatrix">
            <tr>
                <td style="padding: 0 4px;"></td>
                <td style="padding: 0 4px;" v-for="ticker in tickerArray">{{ ticker }}</td>
            </tr>
            <tr v-for="(ticker, index) in tickerArray">
                <td style="padding: 0 4px;">{{ ticker }}</td>
                <td style="padding: 0 4px;" v-for="r in correlationMatrix![index]">{{ roundTo2(r) }}</td>
            </tr>
        </table>
    </div>

</template>

<style scoped></style>
