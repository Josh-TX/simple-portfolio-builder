<script setup lang="ts">
import { Chart, registerables, ScatterDataPoint, ScriptableContext } from 'chart.js';
import { onMounted, watch } from 'vue'
import zoomPlugin from 'chartjs-plugin-zoom';
import {  ScatterplotDataContainer } from '../models/models';

Chart.register(zoomPlugin);
Chart.register(...registerables);

var props = defineProps<{ dataContainer: ScatterplotDataContainer | null, highlightedIndexes: number[] }>();
var emits = defineEmits(['point-clicked'])
var _chart: Chart<"scatter", ScatterDataPoint[], string> | null = null;
var selectedIndexes = new Set<number>();
var prevPointCount: number | null;

watch(() => props.dataContainer, async () => {
    if (props.dataContainer) {
        if (prevPointCount != props.dataContainer.points.length){
            selectedIndexes = new Set();
        }
        prevPointCount = props.dataContainer.points.length
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

function getDisplayValue(value: string | number, axis: "x" | "y"): string{
    var mode = axis == "x" ? props.dataContainer!.axisInputsX.mode : props.dataContainer!.axisInputsY.mode;
    if (mode == "maxDrawdown"){
        return Math.round((value as number) * 1000) / 10 + "%";
    } else {
        var dec = Math.pow(2, value as number) - 1
        return Math.round(dec * 1000) / 10 + "%";
    }
}

function clickHandler(event: MouseEvent) {
    var clickedPoints = _chart!.getElementsAtEventForMode(event, "nearest", { intersect: true }, true);
    if (clickedPoints.length) {
        if (event.ctrlKey){
            clickedPoints.forEach(z => selectedIndexes.add(z.index));
        } else {
            selectedIndexes = new Set(clickedPoints.map(z => z.index));
        }
        var points = Array.from(selectedIndexes).map(z => props.dataContainer!.points[z])
        emits('point-clicked', points);
        _chart!.update();
    } else {
        if (selectedIndexes.size && !event.ctrlKey) {
            selectedIndexes = new Set();
            emits('point-clicked', null);
            _chart!.update();
        }
    }

}

function _tryRenderChart() {
    if (!props.dataContainer) {
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
                    data: props.dataContainer.points.map(point => ({ y: point.y, x: point.x })),
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    backgroundColor: function (context: ScriptableContext<'line'>) {
                        if (selectedIndexes.has(context.dataIndex)) {
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
                        callback: function (value) {
                            return getDisplayValue(value, "x");
                        }
                    },
                },
                y: {
                    ticks: {
                        callback: function (value) {
                            return getDisplayValue(value, "y");
                        }
                    },
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
                        mode: 'xy',
                    },
                    limits: {
                        x: {min: 'original', max: 'original'},
                        y: {min: 'original', max: 'original'}
                    }
                },
                filler: {
                    propagate: false
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            var label = "";
                            var weights = props.dataContainer!.points[context.dataIndex].weights;
                            var series = props.dataContainer!.seriesLabels;
                            for (var i = 0; i < props.dataContainer!.seriesLabels.length; i++){
                                if (weights[i] > 0){
                                    label += series[i] + ": " + weights[i] + ", ";
                                }
                            }
                            label = label.substring(0, label.length - 2);
                            props.dataContainer?.seriesLabels
                            return [
                                "X: " + getDisplayValue(context.parsed.x, "x"), 
                                "Y: " + getDisplayValue(context.parsed.y, "y"),
                                label
                            ];
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
