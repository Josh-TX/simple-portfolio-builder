<script setup lang="ts">

import { tickerInputs } from "../services/tickerInputService"


</script>

<template>
    <div style="display: flex; gap: 16px;">
        <div style="flex: 1; padding-right: 8px;" >
            <label>Tickers (use $ for money market)</label>
            <br>
            <input v-model="tickerInputs.tickers" style="width: 100%">
        </div>
        <div>
            <label>N Day Return</label>
            <br>
            <input v-model.number="tickerInputs.returnDays">
        </div>
        <div>
            <label>Smooth N Days</label>
            <br>
            <input v-model.number="tickerInputs.smoothDays">
        </div>
        <div style="padding-top: 24px;"> 
            <input id="sync" type="checkbox" v-model.boolean="tickerInputs.syncDays">
            <label for="sync">sync</label>
        </div>
        <div>
            <label>Filter Days</label>
            <br>
            <select v-model="tickerInputs.filterDays">
                <option value="MTWTF">All Weekdays</option>
                <option value="MWF">Mon, Wed, Fri</option>
                <option value="F">Just Friday</option>
            </select>
        </div>
    </div>
</template>

<style scoped></style>
