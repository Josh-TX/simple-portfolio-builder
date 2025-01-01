<script setup lang="ts">
import { Chart, registerables } from 'chart.js';
import { onMounted, watch } from 'vue'
import zoomPlugin from 'chartjs-plugin-zoom';
import { HistogramContainer } from '../models/models';

Chart.register(zoomPlugin);
Chart.register(...registerables);

var props = defineProps<{ histogram: HistogramContainer | null }>();
var emits = defineEmits(['point-clicked'])
var _chart: Chart<"bar", number[], number> | null = null;

watch(() => props.histogram, async () => {
    if (props.histogram) {
        _tryRenderChart();
    }
});

onMounted(() => {
    _tryRenderChart();
});



function _tryRenderChart() {
    if (!props.histogram) {
        return;
    }
    if (_chart) {
        _chart.destroy();
    }
    var backgrounds = ["red", "blue", "green"];
    var datasets = props.histogram.datasets.map((z, i) => ({
        label: "histogram",
        data: z.bins,
        backgroundColor: backgrounds[i % backgrounds.length],
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
    }))

    const ctx: HTMLCanvasElement = <any>document.getElementById("bar-canvas");
    _chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: props.histogram.binAvgs,
            datasets: datasets
        },
        options: {
            animation: {
                duration: 0
            },
            scales: {
                // x: {
                //     ticks: {
                //         callback: function (value) {
                //             return labels![value as number] + "%";
                //         }
                //     }
                // },
                // y: {
                //     ticks: {
                //         callback: function (value) {
                //             var portion = (value as number) / props.nums!.length
                //             return Math.round(portion * 1000) / 10 + "%";
                //         }
                //     }
                // }
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
                            return context.dataIndex + ""
                        }
                    }
                }
            }
        }
    });
}

</script>

<template>
    <canvas id="bar-canvas" role="img" style="max-height: 90vh;"></canvas>
</template>

<style scoped></style>
