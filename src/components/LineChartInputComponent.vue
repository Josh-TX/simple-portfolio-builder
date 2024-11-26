<script setup lang="ts">

import { LineChartDataInputs } from "../models/models";

const inputs = defineModel<LineChartDataInputs>("inputs", {required: true})



</script>

<template>
    <div style="display: flex; gap: 16px;">
        <div>
            <label>Line Type</label>
            <br>
            <select v-model="inputs.mode">
                <option value="price">Price</option>
                <option value="returns">Returns</option>
                <option value="logReturns">LogReturns</option>
                <option value="portfolioHoldings">Portfolio Holdings</option>
                <option value="none">None</option>
            </select>
        </div>
        <div v-if="inputs.mode == 'returns' || inputs.mode == 'logReturns'">
            <label>Return Period</label>
            <br>
            <input v-model.number="inputs.returnDays">
        </div>
        <div v-if="inputs.mode == 'returns' || inputs.mode == 'logReturns'">
            <label>Smooth N Days</label>
            <br>
            <input v-model.number="inputs.smoothDays">
        </div>
        <div style="padding-top: 24px;" v-if="inputs.mode == 'price'"> 
            <input type="checkbox" v-model.boolean="inputs.equalPrice">
            <label>Equalize Starting Price</label>
        </div>
        <div style="padding-top: 24px;" v-if="inputs.mode == 'portfolioHoldings'"> 
            <input type="checkbox" v-model.boolean="inputs.showRebalance">
            <label>Show Rebalance Lines (causes severe lag)</label>
        </div>
        <div v-if="inputs.mode == 'returns' || inputs.mode == 'logReturns'">
            <label>Return Extrapolation</label>
            <br>
            <input v-model.number="inputs.extrapolateDays">
        </div>
    </div>
</template>

<style scoped></style>
