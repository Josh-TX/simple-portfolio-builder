<script setup lang="ts">

import { ref, watch } from 'vue'
import { localSettingsService } from '../services/localSettingsService';
import { callWorker } from '../services/workerCaller';
import { GetWeightsRequest } from '../models/models';


var tickers = ref(localSettingsService.getValue("tickers") || "VFIAX VGT");
var returnDays = ref(localSettingsService.getValue("returnDays") || 50);
var smoothDays = ref(localSettingsService.getValue("smoothDays") || 50);
var sync = ref(!!localSettingsService.getValue("syncDays") || true);
var filterDays = ref(localSettingsService.getValue("filterDays") || "MWF");
var segmentCount = ref(localSettingsService.getValue("segmentCount") || 5);

watch(returnDays, () => {
    if (sync.value){
        smoothDays.value = returnDays.value;
    }
    localSettingsService.setValue("returnDays", returnDays.value);
});
watch(smoothDays, () => {
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
    localSettingsService.setValue("filterDays", filterDays.value);
});
watch(tickers, () => {

    localSettingsService.setValue("tickers", tickers.value);
});
watch(segmentCount, () => {
    localSettingsService.setValue("segmentCount", segmentCount.value);
});

async function generate(){
    console.log(segmentCount.value)
    var request: GetWeightsRequest = {
        tickers: tickers.value.split(/[^a-zA-Z]+/).filter(z => !!z),
        segmentCount: segmentCount.value
    };
    var weights = await callWorker(request);
    console.log("weights", weights)
}

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
    <div style="display: flex; gap: 16px;">
        <div>
            <label>Segment Count</label>
            <br>
            <select v-model="segmentCount">
                <option :value="5">5 (20% per segment)</option>
                <option :value="8">8 (12.5% per segment)</option>
                <option :value="10">10 (10% per segment)</option>
                <option :value="20">20 (5% per segment)</option>
            </select>
        </div>
        <button @click="generate">Generate</button>
        <p>in progress - eventually I'll show a scatterplot showing each permutations's average return and standard deviation</p>
    </div>

</template>

<style scoped></style>
