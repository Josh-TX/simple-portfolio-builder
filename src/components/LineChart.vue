<script setup lang="ts">
import { Chart, ChartDataset, registerables } from 'chart.js';
import { onMounted, watch } from 'vue'
import { ChartData } from '../services/chartDataBuilder';
import zoomPlugin from 'chartjs-plugin-zoom';

Chart.register(zoomPlugin);
Chart.register(...registerables);

var props = defineProps<{ chartData: ChartData | null }>();
var _chart: Chart<"line", number[], string> | null = null;

watch(() => props.chartData, async () => {
    if (props.chartData) {
        _tryRenderChart();
    }
});

onMounted(() => {
    _tryRenderChart();
});

function _tryRenderChart() {
    if (!props.chartData) {
        return;
    }
    var labels = props.chartData.timestamps.map(z => new Date(z * 1000).toISOString().split('T')[0]);
    var datasets: ChartDataset<any, number[]>[] = [];
    for (var i = 0; i < props.chartData.seriesLabels.length; i++) {
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
    _chart = new Chart("line-chart-canvas", {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                y: {
                    ticks: {
                        // Include a dollar sign in the ticks
                        callback: function(value) {
                            var dec = Math.pow(2, value as number) - 1
                            return Math.round(dec * 1000) / 10 + "%";
                        }
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true,
                            modifierKey: "ctrl"
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x',
                    },
                    pan: {
                        enabled: true,
                        mode: 'x',
                    }
                },
                filler: {
                    propagate: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                var dec = Math.pow(2, context.parsed.y as number) - 1
                                label += Math.round(dec * 1000) / 10 + "%";
                            }
                            return label;
                        }
                    }
                }
            }
        }
    })
}

</script>

<template>
    <canvas id="line-chart-canvas" role="img" style="width: 100%; height: 100%;"></canvas>
</template>

<style scoped></style>
