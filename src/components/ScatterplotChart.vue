<script setup lang="ts">
import { Chart, registerables } from 'chart.js';
import { onMounted, watch } from 'vue'
import zoomPlugin from 'chartjs-plugin-zoom';
import { PortfolioSummary } from '../services/portfolioBuilder';

Chart.register(zoomPlugin);
Chart.register(...registerables);

var props = defineProps<{ portfolioSummaries: PortfolioSummary[] | null }>();
var _chart: Chart<"scatter", {x: number, y: number}[], string> | null = null;

watch(() => props.portfolioSummaries, async () => {
    if (props.portfolioSummaries) {
        _tryRenderChart();
    }
});

onMounted(() => {
    _tryRenderChart();
});

function _tryRenderChart() {
    if (!props.portfolioSummaries) {
        return;
    }
    var pointsData = props.portfolioSummaries.map(z => ({ y: z.avg, x: z.sd }));
    if (_chart) {
        _chart.destroy();
    }
    _chart = new Chart("test-canvas", {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: "main dataset",
                    data: pointsData,
                    pointRadius: 5,
                }
            ]
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
                            return [label, props.portfolioSummaries![context.dataIndex].weights.toString()];
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
