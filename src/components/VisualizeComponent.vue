<script setup lang="ts">

import LineChart from './LineChart.vue';
import TickerInputComponent from './TickerInputComponent.vue';
import { tickerInputs } from '../services/tickerInputService';
import { Ref, ref, watch } from 'vue'
import { ChartData } from '../services/chartDataBuilder';
import { callWorker } from '../services/workerCaller';
import { debounce } from '../services/debouncer';
import { GetChartDataRequest } from '../models/models';
import { getPriceHistory } from '../services/priceLoader';
import { getCorrelationMatrix } from '../services/matrix-helper';
import { getSD, getSum } from '../services/helpers';



var chartData: Ref<ChartData | null> = ref(null);
var correlationMatrix: Ref<number[][] | null> = ref(null);
var tickerArray: Ref<string[] | null> = ref(null);
var averages: Ref<string[] | null> = ref(null);
var sds: Ref<string[] | null> = ref(null);

async function updateData(){
    var tempTickerArray = tickerInputs.tickers.split(/[^a-zA-Z$]+/).filter(z => !!z);
    tickerArray.value = tempTickerArray;
    var promises = tempTickerArray.map(z => getPriceHistory(z));
    var dayPricess = await Promise.all(promises);
    var request: GetChartDataRequest = {
        dayPricess: dayPricess,
        tickers: tempTickerArray,
        filterDays: tickerInputs.filterDays,
        returnDays: tickerInputs.returnDays,
        smoothDays: tickerInputs.smoothDays
    };
    chartData.value = await callWorker("getChartData", request);
    correlationMatrix.value = getCorrelationMatrix(chartData.value.dataColumns);
    averages.value = [];
    sds.value = [];
    for (var i = 0; i < tempTickerArray.length; i++){
        var nums = chartData.value.dataColumns.map(z => z[i]).filter(z => z != null).map(z => z!); //typescript being dumb
        var avg = getSum(nums) / nums.length;
        var sd = getSD(nums)!;
        averages.value.push((Math.round((Math.pow(2, avg)-1) * 1000) / 10) + "%");
        sds.value.push((Math.round((Math.pow(2, sd)-1) * 1000) / 10) + "%");
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

function roundCor (num: number) { return num == 1 ? 1 : num.toFixed(2) }

updateData();
</script>

<template>
    <TickerInputComponent />
    <div style="height: 50vh; position: relative; width: 100%;" >
        <LineChart :chartData="chartData"/> 
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
                <td style="padding: 0 4px;" v-for="r in correlationMatrix![index]">{{ roundCor(r) }}</td>
            </tr>
        </table>
    </div>

</template>

<style scoped></style>
