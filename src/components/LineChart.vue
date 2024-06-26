<script setup lang="ts">
import { Chart, ChartDataset, registerables } from 'chart.js';
import { onMounted, watch } from 'vue'
import { ChartData } from '../services/chartService';
Chart.register(...registerables);

var props = defineProps<{ chartData: ChartData | null }>();
var _mounted = false;
var _chart: Chart<"line", number[], string> | null = null;

watch(() => props.chartData, async () => {
    if (props.chartData){
        _tryRenderChart();
    }
});

onMounted(() => {
    _mounted = true;
    _tryRenderChart();
});

function _tryRenderChart(){
    if (!props.chartData){
        return;
    }
    var labels = props.chartData.timestamps.map(z => new Date(z * 1000).toISOString().split('T')[0]);
    var datasets: ChartDataset<any, number[]>[] = [] ;
    for (var i = 0; i < props.chartData.seriesLabels.length; i++){
        datasets.push({
            label: props.chartData.seriesLabels[i],
            data: props.chartData.dataColumns.map(column => column[i]),
            borderWidth: 1,
            pointRadius: 0,
        })
    }
    if (_chart) {
        _chart.destroy();
    }
    _chart = new Chart("test-canvas", {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            interaction: {
                mode: 'index',
                intersect: false,
            },
        }
    })
}

</script>

<template>
    <canvas id="test-canvas" role="img" style="max-height: 90vh;"></canvas>
</template>

<style scoped></style>
