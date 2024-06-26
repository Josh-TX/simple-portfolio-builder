<script setup lang="ts">

import LineChart from './LineChart.vue';
import { Ref, ref, watch } from 'vue'
import { localSettingsService } from '../services/localSettingsService';
import { getChartData, ChartData, getLogAfrs, smoothData } from '../services/chartService';
import { ChartDataBuilder } from '../services/chartDataBuilder';
import { debounce } from '../services/debouncer';


var tickers = ref(localSettingsService.getValue("tickers") || "VFIAX VGT");
var returnDays = ref(localSettingsService.getValue("returnDays") || 50);
var smoothDays = ref(localSettingsService.getValue("smoothDays") || 50);
var sync = ref(!!localSettingsService.getValue("syncDays") || true);
var filterDays = ref(localSettingsService.getValue("filterDays") || "MWF");
var chartData: Ref<ChartData | null> = ref(null);

async function updateData(){
    var builder = new ChartDataBuilder(tickers.value.split(/[^a-zA-Z]+/).filter(z => !!z))
        .setFilterDays(filterDays.value)
        .setReturnDays(returnDays.value)
        .setSmoothDays(smoothDays.value);
    chartData.value = await builder.build();
}
watch(returnDays, () => {
    debounce("a", 1000, () => updateData());
    if (sync.value){
        smoothDays.value = returnDays.value;
    }
    localSettingsService.setValue("returnDays", returnDays.value);
});
watch(smoothDays, () => {
    debounce("a", 1000, () => updateData());
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
    debounce("a", 1000, () => updateData());
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
