<script setup lang="ts">

//import LineChart from './LineChart.vue';
import TickerInputComponent from './TickerInputComponent.vue';
import { tickerInputs } from '../services/tickerInputService';
import { Reactive, reactive, ref, shallowRef, ShallowRef, watch } from 'vue'
import { localSettingsService } from '../services/localSettingsService';
import { PortfolioSummary, ScatterplotAxisInputs, ScatterplotDataContainer } from '../models/models';
import { getPriceHistory } from '../services/priceLoader';
import ScatterplotChart from './ScatterplotChart.vue';
import { debounce } from '../services/debouncer';
import { getScatterplotDataContainer } from '../services/scatterplotBuilder';
import { Parser } from 'expr-eval';
import ScatterplotInputComponent from './ScatterplotInputComponent.vue';


var segmentCount = ref(localSettingsService.getValue("segmentCount") || 5);
var filterExpr = ref(localSettingsService.getValue("filterExpr") || "");
var highlightExpr = ref(localSettingsService.getValue("highlightExpr") || "");
var dataContainer = ref<ScatterplotDataContainer | null>(null);
var newestTicker = ref<string | null>(null);
var newestTickerStart = ref<string | null>(null);

var axisInputsX: Reactive<ScatterplotAxisInputs> = reactive(localSettingsService.getValue("scatterplotAxisInputsX") || { mode: "return", returnDays: 30, smoothDays: 5, drawdownDays: 1, riskAdjSD: -0.5});
var axisInputsY: Reactive<ScatterplotAxisInputs> = reactive(localSettingsService.getValue("scatterplotAxisInputsY") || { mode: "logReturnSD", returnDays: 30, smoothDays: 5, drawdownDays: 1, riskAdjSD: -0.5});

//var selectedSummary: Ref<PortfolioSummary | null> = ref(null);
//var selectedChartData: Ref<ChartData | null> = ref(null);
//var selectedPortfolio: Ref<Portfolio | null> = ref(null);
var highlightedIndexes: ShallowRef<number[]> = shallowRef([]);

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
watch(axisInputsX, () => {
    localSettingsService.setValue("scatterplotAxisInputsX", axisInputsX)
});
watch(axisInputsY, () => {
    localSettingsService.setValue("scatterplotAxisInputsY", axisInputsY)
});

async function generate() {
    var tickerArray = tickerInputs.tickers.split(/[^a-zA-Z$]+/).filter(z => !!z);
    var promises = tickerArray.map(z => getPriceHistory(z));
    var fundDatas = await Promise.all(promises);
    var newestIndex = fundDatas.reduce((index, fundData, i) => fundData.startDayNumber > fundDatas[index].startDayNumber ? i : index, 0);
    newestTicker.value = tickerArray[newestIndex];
    newestTickerStart.value = new Date(fundDatas[newestIndex].startDayNumber * 86400000).toISOString().split('T')[0];
    dataContainer.value =  await getScatterplotDataContainer(tickerArray, fundDatas, segmentCount.value, filterExpr.value, axisInputsX, axisInputsY);
    updateHighlightedIndexes();
}


function updateHighlightedIndexes() {
    if (!dataContainer.value) {
        return;
    }
    highlightedIndexes.value = [];
    var tickerArray = tickerInputs.tickers.split(/[^a-zA-Z$]+/).filter(z => !!z);
    if (highlightExpr.value) {
        var fixedExprStr = highlightExpr.value.toLowerCase().replace(/(?<![<>!=])=(?![=])/g, '==').replace(/&&?/g, ' and ').replace(/\|\|?/g, ' or ').replace("$", ' moneymarket ');
        var parsedExpr = new Parser().parse(fixedExprStr);
        var lowercaseTickers = tickerArray.map(z => z.toLowerCase()).map(z => z == "$" ? "moneymarket" : z);
        var loggedError = false;
        for (var i = 0; i < dataContainer.value.points.length; i++) {
            var point = dataContainer.value.points[i];
            var exprData: { [ticker: string]: number } = {};
            for (var j = 0; j < lowercaseTickers.length; j++) {
                exprData[lowercaseTickers[j]] = point.weights[j];
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

function getTitle(axis: "x" | "y"): string{
    var inputs = axis == "x" ? axisInputsX : axisInputsY;
    if (inputs.mode == "maxDrawdown"){
        return "Max Drawdown (" + inputs.drawdownDays + ")";
    } 
    if (inputs.mode == "return"){
        return `Return`;
    }
    if (inputs.mode == "logLossRMS"){
        return `Log Loss Root Mean Square (${inputs.returnDays}, ${inputs.smoothDays})`;
    }
    if (inputs.mode == "logReturnSD"){
        return `Log Return Standard Deviation (${inputs.returnDays}, ${inputs.smoothDays})`;
    }
    throw "unknown mode";
}

// function getPorfolioName(tickers: string[], weights: number[]){
//     var name = "";
//     var totalWeight = getSum(weights);
//     for (var i = 0; i < tickers.length; i++){
//         if (weights[i] > 0){
//             name += `${tickers[i]} ${Math.round(weights[i] / totalWeight * 1000) / 10}%,`;
//         }
//     }
//     return name.replace(/,+$/, '');
// }

async function pointClicked(summary: PortfolioSummary | null) {
    //selectedSummary.value = summary;
    if (!summary) {
        return;
    }
    //alert("not implemented")
    // var tickerArray = tickerInputs.tickers.split(/[^a-zA-Z$]+/).filter(z => !!z);
    // var promises = tickerArray.map(z => getPriceHistory(z));
    // var dayPricess = await Promise.all(promises);
    // var request: GetChartDataRequest = {
    //     dayPricess: dayPricess,
    //     tickers: tickerArray,
    //     filterDays: tickerInputs.filterDays,
    //     returnDays: tickerInputs.returnDays,
    //     smoothDays: tickerInputs.smoothDays
    // };
    // var chartData = getWeightsWorker.getWeights
    // selectedChartData.value = chartData;
    // var averages: number[] = [];
    // var sds: number[] = [];
    // for (var i = 0; i < chartData.dataColumns[0].length; i++){
    //     var nums = chartData.dataColumns.map(z => z[i]).filter(z => z != null).map(z => z!); //typescript being dumb
    //     var avg = getSum(nums) / nums.length;
    //     var sd = getSD(nums)!;
    //     averages.push(avg);
    //     sds.push(sd);
    // }
    // var portfolio: Portfolio = {
    //     name: getPorfolioName(tickerArray, summary.weights),
    //     smoothDays: tickerInputs.smoothDays,
    //     returnDays: tickerInputs.returnDays,
    //     tickers: tickerArray,
    //     weights: summary.weights,
    //     avgLogAfrs: averages,
    //     stdDevLogAfrs: sds,
    //     correlationMatrix: getCorrelationMatrix(chartData.dataColumns)
    // };
    // selectedPortfolio.value = portfolio;
}

// function simulatePortfolio(){
//     selectedPortfolioService.addPortfolio(toRaw(selectedPortfolio.value!));
// }

</script>

<template>
    <div style="display: flex; flex-direction: column; height: 100%; box-sizing: border-box; padding: 4px 12px;">
        <TickerInputComponent />
        <div style="display: flex; width: 100%; margin-top: 8px; gap: 12px;">
            <div style="width: 100%; background: #333; padding: 8px; border-radius: 4px; box-shadow: 1px 1px 3px #00000055;">
                <div style="line-height: 1rem; margin-bottom: 2px;">X-axis</div>
                <ScatterplotInputComponent v-model:inputs="axisInputsX"></ScatterplotInputComponent>
            </div>
            <div style="width: 100%; background: #333; padding: 8px; border-radius: 4px; box-shadow: 1px 1px 3px #00000055;">
                <div style="line-height: 1rem; margin-bottom: 2px;">Y-axis</div>
                <ScatterplotInputComponent v-model:inputs="axisInputsY"></ScatterplotInputComponent>
            </div>
        </div>
        <div style="display: flex; gap: 16px;">
            <div>
                <label>Segment Count</label>
                <br>
                <select v-model="segmentCount">
                    <option :value="4">4 (25% per segment)</option>
                    <option :value="5">5 (20% per segment)</option>
                    <option :value="6">6 (16.66% per segment)</option>
                    <option :value="8">8 (12.5% per segment)</option>
                    <option :value="10">10 (10% per segment)</option>
                    <option :value="12">12 (8.33% per segment)</option>
                    <option :value="16">16 (6.25% per segment)</option>
                    <option :value="20">20 (5% per segment)</option>
                </select>
            </div>
            <div style="flex: 1; padding-right: 8px;">
                <label>Filter Portfolios by Expression</label>
                <br>
                <input v-model="filterExpr" style="width: 100%">
            </div>
            <div style="flex: 0.5; padding-right: 8px;">
                <label>Highlight Portfolios by Expression</label>
                <br>
                <input v-model="highlightExpr" style="width: 100%">
            </div>
            <button @click="generate">Generate</button>
        </div>
        <div class="scatterplot-container">
            <ScatterplotChart :dataContainer="dataContainer" :highlightedIndexes="highlightedIndexes" @point-clicked="pointClicked">
            </ScatterplotChart>
            <div v-if="newestTicker" class="newest-ticker">{{ newestTicker }} began {{ newestTickerStart }}</div>
            <h2 v-if="!dataContainer" class="not-generated-msg">Click "Generate" to compute possible portfolios</h2>
            <div style="position: absolute; left: 0; width: 30px; top: 0; bottom: 30px;" class="y-label-container">
                <span class="color-label y-label-top good" v-if="axisInputsY.mode == 'return'">better</span>
                <span class="color-label y-label-top bad" v-else>worse</span>
                <span> {{ getTitle('y') }}</span>
                <span class="color-label y-label-bottom good" v-if="axisInputsY.mode != 'return'">better</span>
                <span class="color-label y-label-bottom bad" v-else>worse</span>
            </div>
            <div style="position: absolute; bottom: 0; height: 30px; left: 30px; right: 0;" class="x-label-container">
                <span class="color-label x-label-left good" v-if="axisInputsX.mode != 'return'">better</span>
                <span class="color-label x-label-left bad" v-else>worse</span>
                <span> {{ getTitle('x') }}</span>
                <span class="color-label x-label-right good" v-if="axisInputsX.mode == 'return'">better</span>
                <span class="color-label x-label-right bad" v-else>worse</span>
            </div>
        </div>
    </div>

    <!-- <div v-if="selectedSummary && selectedPortfolio">you chose {{ selectedSummary.weights }}
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
    </div> -->
    <!-- <div v-else="!scatterplotInput">No point selected. Click on a point to select it</div> -->
</template>

<style scoped>
.scatterplot-container{
    flex: 1 0 0; 
    min-height: 1px; 
    position: relative; 
    min-height: 350px; 
    padding-left: 30px; 
    padding-bottom: 30px;
}

.color-label {
  position: absolute;
  z-index: -1;
  opacity: 0.7;
}
.good{
    color: green;
}
.bad{
    color: red;
}

.y-label-container {
    position: relative;
    writing-mode: vertical-rl;
    transform: rotate(180deg); 
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 10px 0 50px 0;
}
.y-label-top {
    bottom: 0;
}
.y-label-bottom {
    top: 0;
}

.x-label-container {
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    margin: 0 10px 0 50px;
}
.x-label-left {
    left: 0;
}
.x-label-right {
    right: 0;
}

.not-generated-msg{
    position: absolute;
    top: 40%;
    text-align: center;
    left: 0;
    right: 0;
    opacity: 0.4;
}

.newest-ticker {
    position: absolute;
    top: 0;
    right: 0;
    opacity: 0.6;
}
</style>
