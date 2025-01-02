<script setup lang="ts">

import LineChart from './LineChart.vue';
import TickerInputComponent from './TickerInputComponent.vue';
import LineChartInputComponent from './LineChartInputComponent.vue';
import { tickerInputs } from '../services/tickerInputService';
import { reactive, Reactive, Ref, ref, ShallowRef, watch } from 'vue'
import { debounce } from '../services/debouncer';
import { LineChartDataInputs, LineDataContainer } from '../models/models';
import { getPriceHistory } from '../services/priceLoader';
import { getLineDataContainer } from '../services/chartDataBuilder'
import { localSettingsService } from '../services/localSettingsService';

var lineDataContainer: ShallowRef<LineDataContainer | null> = ref(null);
var tickerArray: Ref<string[] | null> = ref(null);
var renderFrequency = ref(localSettingsService.getValue("renderFrequency") || 7);

var lineInputs1: Reactive<LineChartDataInputs> = reactive(localSettingsService.getValue("lineChartInputs1") || { mode: "price", equalPrice: true, returnDays: 30, smoothDays: 5, extrapolateDays: 365, drawdownDays: 1});
var lineInputs2: Reactive<LineChartDataInputs> = reactive(localSettingsService.getValue("lineChartInputs2") || { mode: "logReturns", equalPrice: true, returnDays: 30, smoothDays: 5, extrapolateDays: 365, drawdownDays: 1});

async function updateData(){
    var tempTickerArray = tickerInputs.tickers.split(/[^a-zA-Z$]+/).filter(z => !!z);
    tickerArray.value = tempTickerArray;
    var priceHistoryPromises = tempTickerArray.map(z => getPriceHistory(z));
    var fundDatas = await Promise.all(priceHistoryPromises);
    lineDataContainer.value = getLineDataContainer(tempTickerArray, fundDatas, lineInputs1, lineInputs2, renderFrequency.value)
}

watch(lineInputs1, () => {
    debounce("a", 500, () => updateData());
    localSettingsService.setValue("lineChartInputs1", lineInputs1)
});
watch(lineInputs2, () => {
    debounce("a", 500, () => updateData());
    localSettingsService.setValue("lineChartInputs2", lineInputs2)
});
watch(renderFrequency, () => {
    debounce("a", 500, () => updateData());
    localSettingsService.setValue("renderFrequency", renderFrequency.value)
});

watch(() => tickerInputs.tickers, () => {
    debounce("a", 1000, () => updateData());
});

updateData();
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
            <div style="position: absolute; top: 2px; right: 0;">
                render 
                <select v-model="renderFrequency">
                    <option :value="1">every day</option>
                    <option :value="2">every other day</option>
                    <option :value="3">every 3rd day</option>
                    <option :value="7">every 7th day</option>
                    <option :value="14">every 14th day</option>
                </select>
            </div>
            <LineChart :dataContainer="lineDataContainer"/> 
        </div>
    </div>
</template>

<style scoped>
</style>
