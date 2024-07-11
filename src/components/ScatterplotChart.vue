<script setup lang="ts">
import { Chart, registerables, ScatterDataPoint, ScriptableContext } from 'chart.js';
import { onMounted, watch } from 'vue'
import zoomPlugin from 'chartjs-plugin-zoom';
import { PortfolioSummary } from '../models/models';

Chart.register(zoomPlugin);
Chart.register(...registerables);

var props = defineProps<{ summaries: PortfolioSummary[] | null, highlightedIndexes: number[] }>();
var emits = defineEmits(['point-clicked'])
var _chart: Chart<"scatter", ScatterDataPoint[], string> | null = null;
var selectedIndex: number | null = null;

watch(() => props.summaries, async () => {
    if (props.summaries) {
        _tryRenderChart();
    }
});

watch(() => props.highlightedIndexes, async () => {
    if (_chart) {
        _chart.update();
    }
});

onMounted(() => {
    _tryRenderChart();
});

function clickHandler(event: Event) {
    var points = _chart!.getElementsAtEventForMode(event, "nearest", { intersect: true }, true);
    if (points.length) {
        var summary = props.summaries![points[0].index];
        if (selectedIndex != points[0].index) {
            selectedIndex = points[0].index;
            emits('point-clicked', summary);
            _chart!.update();
        }
    } else {
        if (selectedIndex != null) {
            selectedIndex = null;
            emits('point-clicked', null);
            _chart!.update();
        }
    }

}

function _tryRenderChart() {
    if (!props.summaries) {
        return;
    }
    if (_chart) {
        _chart.destroy();
    }
    const ctx: HTMLCanvasElement = <any>document.getElementById("test-canvas");
    ctx.onclick = clickHandler;
    _chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: "main",
                    data: props.summaries.map(z => ({ y: z.avgLogAfr, x: z.stdDevLogAfr })),
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    backgroundColor: function (context: ScriptableContext<'line'>) {
                        if (selectedIndex == context.dataIndex) {
                            return "#00bb4f";
                        }
                        if (props.highlightedIndexes.includes(context.dataIndex)) {
                            return "#c7c100"
                        }
                        return "#0077fd";
                    }
                }
            ]
        },
        options: {
            animation: {
                duration: 0
            },
            scales: {
                x: {
                    ticks: {
                        // Include a dollar sign in the ticks
                        callback: function (value) {
                            var dec = Math.pow(2, value as number) - 1
                            return Math.round(dec * 1000) / 10 + "%";
                        }
                    }
                },
                y: {
                    ticks: {
                        // Include a dollar sign in the ticks
                        callback: function (value) {
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
                            return [label, props.summaries![context.dataIndex].weights.toString()];
                            return label + "<br>test";
                        }
                    }
                }
            }
        }
    });
}

</script>

<template>
    <canvas id="test-canvas" role="img" style="max-height: 90vh;"></canvas>
</template>

<style scoped></style>
