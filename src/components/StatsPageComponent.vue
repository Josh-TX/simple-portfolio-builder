<script setup lang="ts">

import TickerInputComponent from './TickerInputComponent.vue';
import { tickerInputs } from '../services/tickerInputService';
import { reactive, Reactive, Ref, ref, watch } from 'vue'
import { debounce } from '../services/debouncer';
import { FundData, StatInputs } from '../models/models';
import { getPriceHistory } from '../services/priceLoader';
import { localSettingsService } from '../services/localSettingsService';
import * as PriceHelpers from '../services/price-helpers';
import * as MathHelpers from '../services/math-helpers';
import * as MatrixHelpers from '../services/matrix-helpers';
import { getSD } from '../services/math-helpers';

type TickerStats = {
    ticker: string,
    return: number,
    maxDrawdown: string,
    sd: number,
    rms: number
}

var tickerArray: Ref<string[] | null> = ref(null);
var inputs: Reactive<StatInputs> = reactive(localSettingsService.getValue("statInputs") || { mode: "logReturns", returnDays: 30, smoothDays: 5, extrapolateDays: 365, drawdownDays: 1});
var tickerStats: Ref<TickerStats[]> = ref([]);
var sdMatrix: Ref<number[][]> = ref([]);
var rmsMatrix: Ref<number[][]> = ref([]);


async function updateData(){
    var tempTickerArray = tickerInputs.tickers.split(/[^a-zA-Z$]+/).filter(z => !!z);
    tickerArray.value = tempTickerArray;
    var priceHistoryPromises = tempTickerArray.map(z => getPriceHistory(z));
    var fundDatas = await Promise.all(priceHistoryPromises);
    var tickerStatsArray: TickerStats[] = [];
    var logReturns: FundData[] = [];
    var logLosses: FundData[] = [];
    for (var i = 0; i < fundDatas.length; i++){
        var fundData = fundDatas[i]
        var afr = PriceHelpers.getAvgAfr(fundData);
        var maxDrawdown = PriceHelpers.getMaxDrawdown(fundData, inputs.drawdownDays)?.drawdown;
        fundData = PriceHelpers.getReturns(fundData, inputs.returnDays);
        fundData = PriceHelpers.getExtrapolatedReturns(fundData, inputs.returnDays, inputs.extrapolateDays);
        fundData = PriceHelpers.getLogReturns(fundData);
        fundData = PriceHelpers.getSmoothData(fundData, inputs.smoothDays);
        logReturns.push(fundData);
        var sd = getSD(Array.from(fundData.values));
        var fundDataLosses = PriceHelpers.getLosses(fundData);
        logLosses.push(fundDataLosses)
        var rms = MathHelpers.getRMS(Array.from(fundDataLosses.values));
        tickerStatsArray.push({
            ticker: tempTickerArray[i],
            return: afr,
            sd: (sd || 0),
            rms: (rms || 0),
            maxDrawdown: maxDrawdown != null ? (Math.round(maxDrawdown * 1000) / 10) + "%" : "(none)",
        });
    }
    tickerStats.value = tickerStatsArray;
    sdMatrix.value = MatrixHelpers.getCorrelationMatrix(logReturns)
    rmsMatrix.value = MatrixHelpers.getCorrelationMatrix(logLosses, true);
}

watch(() => tickerInputs.tickers, () => {
    debounce("a", 1000, () => updateData());
});

watch(inputs, () => {
    debounce("a", 500, () => updateData());
    localSettingsService.setValue("statInputs", inputs)
});

updateData();

function roundTo2 (num: number) { 
    return num == 1 ? 1 : num.toFixed(2) 
}
function afrToPercent (afr: number) { 
    return (Math.round((afr - 1) * 1000) / 10) + "%"
}
function logAfrToPerecent (logAfr: number) {
    return (Math.round((2**logAfr - 1) * 1000) / 10) + "%"
}

function getColorOpacity(r: number): string {
    return "--cell-opacity: " + Math.abs(r);
}
function getCosineColorOpacity(r: number): string {
    return "--cell-opacity: " + Math.abs(r - 0.5) * 2;
}
</script>

<template>
    <div style="padding: 4px 12px;">
        <TickerInputComponent/>
        <div style="display: flex; gap: 16px;">
            <div>
                <label>Return Period</label>
                <br>
                <input v-model.number="inputs.returnDays">
            </div>
            <div>
                <label>Smooth N Days</label>
                <br>
                <input v-model.number="inputs.smoothDays">
            </div>
            <div>
                <label>Return Extrapolation</label>
                <br>
                <input v-model.number="inputs.extrapolateDays">
            </div>
            <div>
                <label>drawdown days maintained</label>
                <br>
                <input v-model.number="inputs.drawdownDays">
            </div>
        </div>
        <div style="display: flex; gap: 48px;">
            <table v-if="tickerStats.length">
                <tr>
                    <td style="padding: 0 12px;">Ticker</td>
                    <td style="padding: 0 12px;">Avg return</td>
                    <td style="padding: 0 12px;">Std Dev</td>
                    <td style="padding: 0 12px;">Loss RMS</td>
                    <td style="padding: 0 12px;">Max Drawdown</td>
                </tr>
                <tr v-for="(tickerStat) in tickerStats">
                    <td style="padding: 0 12px;">{{ tickerStat.ticker }}</td>
                    <td style="padding: 0 12px;">{{ afrToPercent(tickerStat.return) }}</td>
                    <td style="padding: 0 12px;">{{ logAfrToPerecent(tickerStat.sd) }}</td>
                    <td style="padding: 0 12px;">{{ logAfrToPerecent(tickerStat.rms) }}</td>
                    <td style="padding: 0 12px;">{{ tickerStat.maxDrawdown }}</td>
                </tr>
            </table>
            <table v-if="sdMatrix">
                <tr>
                    <td style="padding: 0 4px;"></td>
                    <td style="padding: 0 4px;" v-for="ticker in tickerArray">{{ ticker }}</td>
                </tr>
                <tr v-for="(ticker, index) in tickerArray">
                    <td style="padding: 0 4px;">{{ ticker }}</td>
                    <td style="padding: 0 4px;" v-for="(r) in sdMatrix![index]" :style="getColorOpacity(r)"
                        :class="{'bad-cell': r > 0, 'good-cell': r < 0}" >{{ roundTo2(r) }}</td>
                </tr>
            </table>
            <table v-if="rmsMatrix">
                <tr>
                    <td style="padding: 0 4px;"></td>
                    <td style="padding: 0 4px;" v-for="ticker in tickerArray">{{ ticker }}</td>
                </tr>
                <tr v-for="(ticker, index) in tickerArray">
                    <td style="padding: 0 4px;">{{ ticker }}</td>
                    <td style="padding: 0 4px;" v-for="r in rmsMatrix![index]" :style="getCosineColorOpacity(r)"
                    :class="{'bad-cell': r > 0.5, 'good-cell': r < 0.5}">{{ roundTo2(r) }}</td>
                </tr>
            </table>
        </div>

    </div>

</template>

<style scoped>
.bad-cell {
  background-color: rgba(117, 25, 25, var(--cell-opacity)) !important;
}

.good-cell {
  background-color: rgba(40, 100, 40, var(--cell-opacity)) !important;
}

</style>
