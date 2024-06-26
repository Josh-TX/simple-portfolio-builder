<script setup lang="ts">

import LineChart from './LineChart.vue';
import { Ref, ref, watch } from 'vue'
import { localSettingsService } from '../services/localSettingsService';
import { getChartData, ChartData, getLogAfrs, smoothData } from '../services/chartService';


var tickers = ref(localSettingsService.getValue("tickers") || "VFIAX VGT");
var returnDays = ref(localSettingsService.getValue("returnDays") || 50);
var smoothDays = ref(localSettingsService.getValue("smoothDays") || 50);
var sync = ref(!!localSettingsService.getValue("syncDays") || true);
var chartData: Ref<ChartData | null> = ref(null);
var _baseChartData: ChartData | null = null

function _computeBaseData(){
    getChartData(tickers.value.split(/[^a-zA-Z]+/).filter(z => !!z)).then(z => {
        _baseChartData = z;
        chartData.value = smoothData(getLogAfrs(z, returnDays.value), smoothDays.value);
    })
}

var _timeoutId: any;
function _debounceUpdateSmoothData(){
    clearTimeout(_timeoutId);
    _timeoutId = setTimeout(() => {
        if (_baseChartData){
            chartData.value = smoothData(getLogAfrs(_baseChartData, returnDays.value), smoothDays.value);
        }
    }, 1000)
}
watch(returnDays, () => {
    _debounceUpdateSmoothData();
    if (sync.value){
        smoothDays.value = returnDays.value;
    }
    localSettingsService.setValue("returnDays", returnDays.value);
});
watch(smoothDays, () => {
    _debounceUpdateSmoothData();
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

var tickerTimeoutId: any;
watch(tickers, () => {
    clearTimeout(tickerTimeoutId);
    tickerTimeoutId = setTimeout(() => {
        _computeBaseData();
    }, 1000)
    localSettingsService.setValue("tickers", tickers.value);
});
_computeBaseData();
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
    </div>
    <LineChart :chartData="chartData"/>
</template>

<style scoped></style>
