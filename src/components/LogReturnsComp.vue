<script setup lang="ts">

import LineChart from './LineChart.vue';
import { Ref, ref, watch } from 'vue'
import { localSettingsService } from '../services/localSettingsService';
import { ChartData } from '../services/chartDataBuilder';
import { callWorker } from '../services/workerCaller';
import { debounce } from '../services/debouncer';
import { logElapsed, startTimer } from '../services/timer';
import { GetChartDataRequest } from '../models/models';
import { getPriceHistory } from '../services/priceLoader';


var tickers = ref(localSettingsService.getValue("tickers") || "VFIAX VGT");
var returnDays = ref(localSettingsService.getValue("returnDays") || 50);
var smoothDays = ref(localSettingsService.getValue("smoothDays") || 50);
var sync = ref(!!localSettingsService.getValue("syncDays") || true);
var filterDays = ref(localSettingsService.getValue("filterDays") || "MWF");
var chartData: Ref<ChartData | null> = ref(null);

async function updateData(){
    startTimer("chartBuilder")
    var tickerArray = tickers.value.split(/[^a-zA-Z]+/).filter(z => !!z);
    var promises = tickerArray.map(z => getPriceHistory(z));
    var dayPricess = await Promise.all(promises);
    var request: GetChartDataRequest = {
        dayPricess: dayPricess,
        tickers: tickerArray,
        filterDays: filterDays.value,
        returnDays: returnDays.value,
        smoothDays: smoothDays.value
    };
    chartData.value = await callWorker(request);
    logElapsed("chartBuilder")
}
watch(returnDays, () => {
    debounce("a", 500, () => updateData());
    if (sync.value){
        smoothDays.value = returnDays.value;
    }
    localSettingsService.setValue("returnDays", returnDays.value);
});
watch(smoothDays, () => {
    debounce("a", 500, () => updateData());
    if (sync.value){
        returnDays.value = smoothDays.value;
    }
    localSettingsService.setValue("smoothDays", smoothDays.value);
});
watch(sync, () => {
    if (sync.value){
        smoothDays.value = returnDays.value;
    }
    localSettingsService.setValue("syncDays", sync.value);
});
watch(filterDays, () => {
    debounce("a", 500, () => updateData());
    localSettingsService.setValue("filterDays", filterDays.value);
});
watch(tickers, () => {
    debounce("a", 1000, () => updateData());
    localSettingsService.setValue("tickers", tickers.value);
});
updateData();
</script>

<template>
    <div style="display: flex; gap: 16px;">
        <div style="flex: 1; padding-right: 8px;" >
            <label>Tickers</label>
            <br>
            <input v-model="tickers" style="width: 100%">
        </div>
        <div>
            <label>N Day Return</label>
            <br>
            <input v-model.number="returnDays">
        </div>
        <div>
            <label>Smooth N Days</label>
            <br>
            <input v-model.number="smoothDays">
        </div>
        <div style="padding-top: 24px;"> 
            <input id="sync" type="checkbox" v-model.boolean="sync">
            <label for="sync">sync</label>
        </div>
        <div>
            <label>Filter Days</label>
            <br>
            <select v-model="filterDays">
                <option value="MTWTF">All Weekdays</option>
                <option value="MWF">Mon, Wed, Fri</option>
                <option value="F">Just Friday</option>
            </select>
        </div>
    </div>
    <LineChart :chartData="chartData"/>
</template>

<style scoped></style>
