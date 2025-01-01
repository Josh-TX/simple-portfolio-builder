<script setup lang="ts">

import { ScatterplotAxisInputs } from "../models/models";

const inputs = defineModel<ScatterplotAxisInputs>("inputs", {required: true})



</script>

<template>
    <div style="display: flex; gap: 16px;">
        <div>
            <label>Type</label>
            <br>
            <select v-model="inputs.mode">
                <option value="return">Return</option>
                <option value="logReturnSD">Log Return SD</option>
                <option value="logLossRMS">Log Loss RMS</option>
                <option value="maxDrawdown">Max Drawdown</option>
                <option value="riskAdjReturn">Risk-Adj Return</option>
            </select>
        </div>
        <div v-if="inputs.mode == 'logReturnSD' || inputs.mode == 'logLossRMS' || inputs.mode == 'riskAdjReturn'">
            <label>Return Period</label>
            <br>
            <input v-model.number="inputs.returnDays">
        </div>
        <div v-if="inputs.mode == 'logReturnSD' || inputs.mode == 'logLossRMS' || inputs.mode == 'riskAdjReturn'">
            <label>Smooth N Days</label>
            <br>
            <input v-model.number="inputs.smoothDays">
        </div>
        <div v-if="inputs.mode == 'maxDrawdown'">
            <label>peak & trough days maintained</label>
            <br>
            <input v-model.number="inputs.drawdownDays">
        </div>
        <div v-if="inputs.mode == 'riskAdjReturn'">
            <label>Std Dev adjustment (must be between -2 & 0)</label>
            <br>
            <input v-model.number="inputs.riskAdjSD" max="0" min="-2">
        </div>
    </div>
</template>

<style scoped></style>
