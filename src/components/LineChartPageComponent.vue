<script setup lang="ts">

import LineChart from './LineChart.vue';
import TickerInputComponent from './TickerInputComponent.vue';
import LineChartInputComponent from './LineChartInputComponent.vue';
import { tickerInputs } from '../services/tickerInputService';
import { onMounted, reactive, Reactive, Ref, ref, ShallowRef, watch } from 'vue'
import { debounce } from '../services/debouncer';
import { LineChartDataInputs, LineDataContainer } from '../models/models';
import { getPriceHistory } from '../services/priceLoader';
import { getLineDataContainer } from '../services/chartDataBuilder'
import { localSettingsService } from '../services/localSettingsService';

var lineDataContainer: ShallowRef<LineDataContainer | null> = ref(null);
var tickerArray: Ref<string[] | null> = ref(null);

var lineInputs1: Reactive<LineChartDataInputs> = reactive(localSettingsService.getValue("lineChartInputs1") || { mode: "price", equalPrice: true, returnDays: 30, smoothDays: 5, extrapolateDays: 365, drawdownDays: 1});
var lineInputs2: Reactive<LineChartDataInputs> = reactive(localSettingsService.getValue("lineChartInputs2") || { mode: "logReturns", equalPrice: true, returnDays: 30, smoothDays: 5, extrapolateDays: 365, drawdownDays: 1});

async function updateData(){
    var tempTickerArray = tickerInputs.tickers.split(/[^a-zA-Z$]+/).filter(z => !!z);
    tickerArray.value = tempTickerArray;
    var priceHistoryPromises = tempTickerArray.map(z => getPriceHistory(z));
    var fundDatas = await Promise.all(priceHistoryPromises);
    lineDataContainer.value = getLineDataContainer(tempTickerArray, fundDatas, lineInputs1, lineInputs2)
}

watch(lineInputs1, () => {
    debounce("a", 500, () => updateData());
    localSettingsService.setValue("lineChartInputs1", lineInputs1)
});
watch(lineInputs2, () => {
    debounce("a", 500, () => updateData());
    localSettingsService.setValue("lineChartInputs2", lineInputs2)
});

watch(() => tickerInputs.tickers, () => {
    debounce("a", 1000, () => updateData());
});

updateData();

onMounted(() => {
    console.log("line page mounted")
})
</script>

<template>
    <div style="display: flex; flex-direction: column; height: 100%; box-sizing: border-box; padding: 4px 12px;">
        <TickerInputComponent/>
        <div style="display: flex; width: 100%; margin-top: 8px; gap: 12px;">
            <div style="width: 100%; background: #333; padding: 8px; border-radius: 4px; box-shadow: 1px 1px 3px #00000055;">
                <div style="line-height: 1rem; margin-bottom: 2px;">SOLID LINE</div>
                <LineChartInputComponent v-model:inputs="lineInputs1"></LineChartInputComponent>
            </div>
            <div style="width: 100%; background: #333; padding: 8px; border-radius: 4px; box-shadow: 1px 1px 3px #00000055;">
                <div style="line-height: 1rem; margin-bottom: 2px;">DOTTED LINE</div>
                <LineChartInputComponent v-model:inputs="lineInputs2"></LineChartInputComponent>
            </div>
        </div>
        <div style="flex: 1 1 0; position: relative; min-height: 350px;" >
            <LineChart :dataContainer="lineDataContainer"/> 
        </div>
    </div>
    <!-- <div style="display: flex; gap: 48px;">
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
    </div> -->

</template>

<style scoped></style>
