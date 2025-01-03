<script setup lang="ts">
import { Chart, registerables, ScatterDataPoint } from 'chart.js';
import { onMounted, toRaw, watch } from 'vue'
import zoomPlugin from 'chartjs-plugin-zoom';
import {  ScatterplotDataContainer, ScatterplotPoint } from '../models/models';
import * as MathHelpers from '../services/math-helpers';

Chart.register(zoomPlugin);
Chart.register(...registerables);

var props = defineProps<{ dataContainer: ScatterplotDataContainer | null, highlightedIndexes: number[] }>();
var emits = defineEmits(['point-clicked'])
var _chart: Chart<"scatter", ScatterDataPoint[], string> | null = null;
var selectedWeightss: number[][] = [];
var selectedPointTickers: string[] = [];

var _points: ScatterplotPoint[][] = [];

watch(() => props.dataContainer, async () => {
    if (props.dataContainer) {
        if (JSON.stringify(selectedPointTickers) != JSON.stringify(props.dataContainer.seriesLabels)){
            selectedWeightss = [];
        }
        else if (selectedWeightss.length && MathHelpers.getSum(selectedWeightss[0]) != MathHelpers.getSum(props.dataContainer.points[0].weights)){
            selectedWeightss = [];
        }
        selectedPointTickers = props.dataContainer.seriesLabels;
        _tryRenderChart();
    }
});

watch(() => props.highlightedIndexes, async () => {
    if (_chart) {
        updateDatasetData();
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
            clickedPoints.forEach(z => {
                var point = _points[z.datasetIndex][z.index];
                selectedWeightss.push(point.weights);
            });
        } else {
            selectedWeightss = clickedPoints.map(z => {
                var point = _points[z.datasetIndex][z.index];
                return point.weights;
            });
        }
        emits('point-clicked', selectedWeightss);
        updateDatasetData();
    } else {
        if (selectedWeightss.length && !event.ctrlKey) {
            selectedWeightss = [];
            emits('point-clicked', []);
            updateDatasetData();
        }
    }

}

function updateDatasetData(){
    setupPoints();
    for(var i = 0; i <=3; i++){
        _chart!.data.datasets[i].data = _points[i].map(z => ({x: z.x, y: z.y}));
    }
    _chart!.update();
}

function getMatchIndexOf(selectedPointWeights: number[][], weights: number[]): number{
    if (!selectedPointWeights.length){
        return -1;
    }
    for (var i = 0; i < selectedPointWeights.length; i++){
        var match = true;
        for (var j = 0; j < weights.length; j++){
            if (selectedPointWeights[i][j] != weights[j]){
                match = false;
                break;
            }
        }
        if (match){
            return i;
        }
    }
    return -1;
}

function setupPoints() {
    _points = [[],[],[],[]];
    var remainingSelectedPointWeights = [...selectedWeightss]
    for (var i = 0; i < props.dataContainer!.points.length; i++){
        var point = toRaw(props.dataContainer!.points[i]);
        var selectedIndex = getMatchIndexOf(remainingSelectedPointWeights, point.weights)
        if (selectedIndex >= 0){
            _points[0].push(point);
            remainingSelectedPointWeights.splice(selectedIndex, 1)
        } else if (props.highlightedIndexes.includes(i)){
            _points[1].push(point);
        } else if (point.weights.filter(z => z).length == 1){
            _points[2].push(point);
        }else {
            _points[3].push(point);
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
    setupPoints();
    _chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: "selected",
                    data: _points[0].map(z => ({x: z.x, y: z.y})),
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    backgroundColor: "#00bb4f",
                },
                {
                    label: "highlighted",
                    data: _points[1].map(z => ({x: z.x, y: z.y})),
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    backgroundColor: "#c7c100bb"
                },
                {
                    label: "pure",
                    data: _points[2].map(z => ({x: z.x, y: z.y})),
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: '#7744ff',
                    backgroundColor: "#7744ff"
                },
                {
                    label: "main",
                    data: _points[3].map(z => ({x: z.x, y: z.y})),
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: "#0077fd",
                    backgroundColor: "#0077fdbb"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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
                            var weights = _points[context.datasetIndex][context.dataIndex].weights;
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
    <canvas id="test-canvas" role="img" style="width: 100%; height: 100%;"></canvas>
</template>

<style scoped></style>
