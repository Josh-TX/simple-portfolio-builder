<script setup lang="ts">

import LineChart from './LineChart.vue';
import TickerInputComponent from './TickerInputComponent.vue';
import { tickerInputs } from '../services/tickerInputService';
import { Ref, ref, toRaw, watch } from 'vue'
import { localSettingsService } from '../services/localSettingsService';
import { callWorker } from '../services/workerCaller';
import { GetChartDataRequest, GetWeightsRequest, Portfolio, PortfolioSummary } from '../models/models';
import { getPriceHistory } from '../services/priceLoader';
import { PortfolioBuilder } from '../services/portfolioBuilder';
import ScatterplotChart from './ScatterplotChart.vue';
import { Parser } from 'expr-eval';
import { debounce } from '../services/debouncer';
import { ChartData } from '../services/chartDataBuilder';
import { selectedPortfolioService } from '../services/selectedPortfolioService';
import { getSD, getSum } from '../services/helpers';
import { getCorrelationMatrix } from '../services/matrix-helper';


var segmentCount = ref(localSettingsService.getValue("segmentCount") || 5);
var filterExpr = ref(localSettingsService.getValue("filterExpr") || "");
var highlightExpr = ref(localSettingsService.getValue("highlightExpr") || "");
var selectedSummary: Ref<PortfolioSummary | null> = ref(null);
var selectedChartData: Ref<ChartData | null> = ref(null);
var selectedPortfolio: Ref<Portfolio | null> = ref(null);
var allSummaries: PortfolioSummary[] | null = null;
var highlightedIndexes: Ref<number[]> = ref([]);

watch(segmentCount, () => {
    localSettingsService.setValue("segmentCount", segmentCount.value);
});
watch(filterExpr, () => {
    localSettingsService.setValue("filterExpr", filterExpr.value);
});
watch(highlightExpr, () => {
    localSettingsService.setValue("highlightExpr", highlightExpr.value);
    debounce("highlightExpr", 1000, updateHighlightedIndexes)
});
async function generate() {
    selectedSummary.value = null;
    var tickerArray = tickerInputs.tickers.split(/[^a-zA-Z$]+/).filter(z => !!z);
    var request: GetWeightsRequest = {
        tickers: tickerArray,
        segmentCount: segmentCount.value,
        filterExpr: filterExpr.value
    };
    var weightss = await callWorker(request);
    var promises = tickerArray.map(z => getPriceHistory(z));
    var dayPricess = await Promise.all(promises);
    var getChartDataRequest: GetChartDataRequest = {
        dayPricess: dayPricess,
        tickers: tickerArray,
        filterDays: tickerInputs.filterDays,
        returnDays: tickerInputs.returnDays,
        smoothDays: tickerInputs.smoothDays
    };
    var chartData = await callWorker(getChartDataRequest);
    var builder = new PortfolioBuilder();
    allSummaries = builder.applyPortfolioSummaries(chartData, weightss);
    updateHighlightedIndexes();
}

function updateHighlightedIndexes() {
    if (!allSummaries) {
        return;
    }
    highlightedIndexes.value = [];
    var tickerArray = tickerInputs.tickers.split(/[^a-zA-Z$]+/).filter(z => !!z);
    if (highlightExpr.value) {
        var fixedExprStr = highlightExpr.value.toLowerCase().replace(/(?<![<>!=])=(?![=])/g, '==').replace(/&&?/g, ' and ').replace(/\|\|?/g, ' or ').replace("$", ' moneymarket ');
        var parsedExpr = new Parser().parse(fixedExprStr);
        var lowercaseTickers = tickerArray.map(z => z.toLowerCase()).map(z => z == "$" ? "moneymarket" : z);
        var loggedError = false;
        for (var i = 0; i < allSummaries.length; i++) {
            var summary = allSummaries[i];
            var exprData: { [ticker: string]: number } = {};
            for (var j = 0; j < lowercaseTickers.length; j++) {
                exprData[lowercaseTickers[j]] = summary.weights[j];
            }
            try {
                var passesFilter = parsedExpr.evaluate(exprData);
                if (passesFilter) {
                    highlightedIndexes.value.push(i);
                }
            } catch (e) {
                if (!loggedError) {
                    console.error(e);
                    loggedError = true;
                }
            }
        }
    }
}

function getPorfolioName(tickers: string[], weights: number[]){
    var name = "";
    var totalWeight = getSum(weights);
    for (var i = 0; i < tickers.length; i++){
        if (weights[i] > 0){
            name += `${tickers[i]} ${Math.round(weights[i] / totalWeight * 1000) / 10}%,`;
        }
    }
    return name.replace(/,+$/, '');
}

async function pointClicked(summary: PortfolioSummary | null) {
    selectedSummary.value = summary;
    if (!summary) {
        return;
    }

    var tickerArray = tickerInputs.tickers.split(/[^a-zA-Z$]+/).filter(z => !!z);
    var promises = tickerArray.map(z => getPriceHistory(z));
    var dayPricess = await Promise.all(promises);
    var request: GetChartDataRequest = {
        dayPricess: dayPricess,
        tickers: tickerArray,
        filterDays: tickerInputs.filterDays,
        returnDays: tickerInputs.returnDays,
        smoothDays: tickerInputs.smoothDays
    };
    var chartData = await callWorker(request);
    selectedChartData.value = chartData;
    var averages: number[] = [];
    var sds: number[] = [];
    for (var i = 0; i < chartData.dataColumns[0].length; i++){
        var nums = chartData.dataColumns.map(z => z[i]).filter(z => z != null);
        var avg = getSum(nums) / nums.length;
        var sd = getSD(nums)!;
        averages.push(avg);
        sds.push(sd);
    }
    var portfolio: Portfolio = {
        name: getPorfolioName(tickerArray, summary.weights),
        smoothDays: tickerInputs.smoothDays,
        returnDays: tickerInputs.returnDays,
        tickers: tickerArray,
        weights: summary.weights,
        averages: averages,
        stddevs: sds,
        correlationMatrix: getCorrelationMatrix(chartData.dataColumns)
    };
    selectedPortfolio.value = portfolio;
}

function simulatePortfolio(){
    selectedPortfolioService.addPortfolio(toRaw(selectedPortfolio.value!));
}

</script>

<template>
    <TickerInputComponent />
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
        <div style="flex: 1; padding-right: 8px;">
            <label>Filter Portfolios by Expression</label>
            <br>
            <input v-model="filterExpr" style="width: 100%">
        </div>
        <div style="flex: 1; padding-right: 8px;">
            <label>Highlight Portfolios by Expression</label>
            <br>
            <input v-model="highlightExpr" style="width: 100%">
        </div>
        <button @click="generate">Generate</button>
    </div>
    <ScatterplotChart :summaries="allSummaries" :highlightedIndexes="highlightedIndexes" @point-clicked="pointClicked">
    </ScatterplotChart>
    <div v-if="selectedSummary && selectedPortfolio">you chose {{ selectedSummary.weights }}
        <div style="display: flex; gap: 16px;">
            <div style="flex: 1; padding-right: 8px;" >
                <label>Selected Portfolio Name</label>
                <br>
                <input v-model="selectedPortfolio!.name" style="width: 100%">
            </div>
            <button @click="simulatePortfolio()">Simulate Porfolio</button>
            <button @click="simulatePortfolio()">View Simulations</button>
        </div>
        <div style="height: 50vh; position: relative; width: 100%;">
            <LineChart :chartData="selectedChartData" />
        </div>
    </div>
    <div v-else-if="!allSummaries">Click "Generate" to compute possible portfolios</div>
    <div v-else="!scatterplotInput">No point selected. Click on a point to select it</div>
</template>

<style scoped></style>
