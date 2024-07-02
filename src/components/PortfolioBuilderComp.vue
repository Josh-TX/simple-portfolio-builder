<script setup lang="ts">

import { Ref, ref, watch } from 'vue'
import { localSettingsService } from '../services/localSettingsService';
import { callWorker } from '../services/workerCaller';
import { GetChartDataRequest, GetWeightsRequest, PortfolioSummary, ScatterplotInput } from '../models/models';
import { getPriceHistory } from '../services/priceLoader';
import { PortfolioBuilder } from '../services/portfolioBuilder';
import ScatterplotChart from './ScatterplotChart.vue';
import { Parser } from 'expr-eval';


var tickers = ref(localSettingsService.getValue("tickers") || "VFIAX VGT");
var returnDays = ref(localSettingsService.getValue("returnDays") || 50);
var smoothDays = ref(localSettingsService.getValue("smoothDays") || 50);
var sync = ref(!!localSettingsService.getValue("syncDays") || true);
var filterDays = ref(localSettingsService.getValue("filterDays") || "MWF");
var segmentCount = ref(localSettingsService.getValue("segmentCount") || 5);
var filterExpr = ref(localSettingsService.getValue("filterExpr") || "");
var highlightExpr = ref(localSettingsService.getValue("highlightExpr") || "");
var scatterplotInput: Ref<ScatterplotInput | null> = ref(null);

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
watch(filterExpr, () => {
    localSettingsService.setValue("filterExpr", filterExpr.value);
});
watch(highlightExpr, () => {
    localSettingsService.setValue("highlightExpr", highlightExpr.value);
});
async function generate(){
    var request: GetWeightsRequest = {
        tickers: tickers.value.split(/[^a-zA-Z]+/).filter(z => !!z),
        segmentCount: segmentCount.value,
        filterExpr: filterExpr.value
    };
    var weightss = await callWorker(request);
    var tickerArray = tickers.value.split(/[^a-zA-Z]+/).filter(z => !!z);
    var promises = tickerArray.map(z => getPriceHistory(z));
    var dayPricess = await Promise.all(promises);
    var getChartDataRequest: GetChartDataRequest = {
        dayPricess: dayPricess,
        tickers: tickerArray,
        filterDays: filterDays.value,
        returnDays: returnDays.value,
        smoothDays: smoothDays.value
    };
    var chartData = await callWorker(getChartDataRequest);
    var builder = new PortfolioBuilder();
    var summaries =  builder.applyPortfolioSummaries(chartData, weightss);
    var highlightedSummaries: PortfolioSummary[] = [];
    if (highlightExpr.value){
        var fixedExprStr = highlightExpr.value.toLowerCase().replace(/(?<![<>!=])=(?![=])/g, '==').replace(/&&?/g, ' and ').replace(/\|\|?/g, ' or ');
        var parsedExpr =  new Parser().parse(fixedExprStr);
        var lowercaseTickers = tickerArray.map(z => z.toLowerCase());
        var loggedError = false;
        for (var summary of summaries){
            var exprData: {[ticker: string]: number} = {};
            for (var i = 0; i < lowercaseTickers.length; i++){
                exprData[lowercaseTickers[i]] = summary.weights[i];
            }
            try {
                var passesFilter = parsedExpr.evaluate(exprData);
                if (passesFilter){
                    highlightedSummaries.push(summary);
                }
            } catch(e){
                if (!loggedError){
                    console.error(e);
                    loggedError = true;
                }
            }
        }
        summaries = summaries.filter(z => !highlightedSummaries.includes(z));
    }
    scatterplotInput.value = {
        summaries: summaries,
        highlightedSummaries: highlightedSummaries
    }
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
        <div style="flex: 1; padding-right: 8px;" >
            <label>Filter Portfolios by Expression</label>
            <br>
            <input v-model="filterExpr" style="width: 100%">
        </div>
        <div style="flex: 1; padding-right: 8px;" >
            <label>Highlight Portfolios by Expression</label>
            <br>
            <input v-model="highlightExpr" style="width: 100%">
        </div>
        <button @click="generate">Generate</button>
    </div>
    <ScatterplotChart :scatterplotInput="scatterplotInput"></ScatterplotChart>
</template>

<style scoped></style>
