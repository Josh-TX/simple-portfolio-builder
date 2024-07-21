<script setup lang="ts">

import LineChart from './LineChart.vue';
import TickerInputComponent from './TickerInputComponent.vue';
import { tickerInputs } from '../services/tickerInputService';
import { Ref, ref, ShallowRef, watch } from 'vue'
import { debounce } from '../services/debouncer';
import { DayLogAFR, GetLogAfrsRequest, LineDataContainer } from '../models/models';
import { getPriceHistory } from '../services/priceLoader';
import { getSD } from '../services/helpers';
import * as WorkerOperations from '../services/WorkerOperations';
import * as MiscHelpers2 from '../services/misc-helpers2';



var lineDataContainer: ShallowRef<LineDataContainer | null> = ref(null);
var correlationMatrix: Ref<number[][] | null> = ref(null);
var tickerArray: Ref<string[] | null> = ref(null);
var averages: Ref<string[] | null> = ref(null);
var sds: Ref<string[] | null> = ref(null);

var dayLogAfrss: DayLogAFR[][] = [];

async function updateData(){
    var tempTickerArray = tickerInputs.tickers.split(/[^a-zA-Z$]+/).filter(z => !!z);
    tickerArray.value = tempTickerArray;
    var promises = tempTickerArray.map(z => getPriceHistory(z));
    var dayPricess = await Promise.all(promises);
    var request: GetLogAfrsRequest = {
        dayPricess: dayPricess,
        tickers: tempTickerArray,
        filterDays: tickerInputs.filterDays,
        returnDays: tickerInputs.returnDays,
        smoothDays: tickerInputs.smoothDays
    };
    dayLogAfrss = await WorkerOperations.getLogAfrs(request);
    var timestamps = MiscHelpers2.everyNthItem(MiscHelpers2.getUnionTimestamps(dayLogAfrss), 10);
    console.log(timestamps)
    lineDataContainer.value = {
        timestamps: timestamps,
        seriesLabels: tempTickerArray,
        LineDatas: [
            {
                data: dayLogAfrss.map(dayLogAfrs => MiscHelpers2.matchDataToTimestamps(dayLogAfrs, timestamps).map(z => z ? z.afr : null)),
                labelCallback: z => z != null ? z.toFixed(2) : "",
                yAxisTitle: "AFR",
                type: "return"
            },
            {
                data: dayLogAfrss.map(dayLogAfrs => MiscHelpers2.matchDataToTimestamps(dayLogAfrs, timestamps).map(z => z ? Math.log(z.afr)/Math.log(2) : null)),
                labelCallback: z => z != null ? z.toFixed(2) : "",
                yAxisTitle: "Log AFR",
                type: "log"
            },
        ]
    }
    correlationMatrix.value = MiscHelpers2.getCorrelationMatrix(dayLogAfrss);
    averages.value = [];
    sds.value = [];
    for (var i = 0; i < tempTickerArray.length; i++){
        var avgAfr = MiscHelpers2.getAvgAfr(dayLogAfrss[i]);
        var logAfrSd = getSD(dayLogAfrss[i].map(z => z.logAfr))!;
        averages.value.push((Math.round(avgAfr * 1000) / 10) + "%");
        sds.value.push((Math.round((Math.pow(2, logAfrSd)-1) * 1000) / 10) + "%");
    }
}

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
    <TickerInputComponent />
    <div style="height: 50vh; position: relative; width: 100%;" >
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
