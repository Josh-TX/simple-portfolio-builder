<script setup lang="ts">
import { Chart, ChartDataset, registerables } from 'chart.js';
import { onMounted, watch } from 'vue'
import zoomPlugin from 'chartjs-plugin-zoom';
import { ScatterplotInput } from '../models/models';

Chart.register(zoomPlugin);
Chart.register(...registerables);

var props = defineProps<{ scatterplotInput: ScatterplotInput | null }>();
var _chart: Chart<"scatter", {x: number, y: number}[], string> | null = null;

watch(() => props.scatterplotInput, async () => {
    if (props.scatterplotInput) {
        _tryRenderChart();
    }
});

onMounted(() => {
    _tryRenderChart();
});

function _tryRenderChart() {
    if (!props.scatterplotInput) {
        return;
    }
    if (_chart) {
        _chart.destroy();
    }
    var datasets: ChartDataset<any, number[]>[] = [
        {
            label: "main",
            data: props.scatterplotInput.summaries.map(z => ({ y: z.avg, x: z.sd })),
            pointRadius: 4,
        }
    ];
    if ( props.scatterplotInput.highlightedSummaries.length){
        datasets.push({
            label: "highlighted",
            data: props.scatterplotInput.highlightedSummaries.map(z => ({ y: z.avg, x: z.sd })),
            pointRadius: 4,
        })
    }
    _chart = new Chart("test-canvas", {
        type: 'scatter',
        data: {
            datasets: datasets
        },
        options: {
            scales: {
                x: {
                    ticks: {
                        // Include a dollar sign in the ticks
                        callback: function(value) {
                            var dec = Math.pow(2, value as number) - 1
                            return Math.round(dec * 1000) / 10 + "%";
                        }
                    }
                },
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
                        mode: 'xy',
                        
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
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                var dec = Math.pow(2, context.parsed.y as number) - 1
                                label += Math.round(dec * 1000) / 10 + "%";
                            }
                            var summaries = context.datasetIndex == 0 ? props.scatterplotInput!.summaries : props.scatterplotInput!.highlightedSummaries
                            return [label, summaries[context.dataIndex].weights.toString()];
                            return label + "<br>test";
                        }
                    }
                }
            }
        }
    })
}

</script>

<template>
    <canvas id="test-canvas" role="img" style="max-height: 90vh;"></canvas>
</template>

<style scoped></style>
