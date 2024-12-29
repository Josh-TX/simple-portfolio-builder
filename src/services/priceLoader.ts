import { DayVal } from "../models/models";
import { localSettingsService } from "./localSettingsService";
import { moneyMarketPrices } from "./moneyMarketPrices";

var pricesMap: {[ticker: string]: DayVal[]} = {}

export async function getPriceHistory(ticker: string): Promise<DayVal[]> {
    if (pricesMap[ticker]){
        return pricesMap[ticker];
    }
    if (ticker == "$"){
        return getMoneyMarket();
    }
    var cachedPrices =  localSettingsService.getDayPrices(ticker);
    if (cachedPrices){
        return cachedPrices;
    }
    var dayPrices = await loadPriceHistoryFromAPI(ticker);
    dayPrices = dayPrices.filter(z => z.val != null);
    dayPrices.forEach(dayPrice => dayPrice.val = Number.parseFloat(dayPrice.val.toPrecision(9)))
    if (dayPrices.length > 0){
        localSettingsService.setDayPrices(ticker, dayPrices);
    }
    pricesMap[ticker] = dayPrices;
    return dayPrices;
}


async function loadPriceHistoryFromAPI(ticker: string): Promise<DayVal[]> {
    //proxy needed because yahoo finance has restrictive CORS headers
    //also, adding a &a=1 fixes some issues with the proxy (it was adding an = to the yahoo finanace request). 
    const proxiedUrl = getProxiedUrl(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=100y&interval=1d&a=1`)
    const httpResponse = await fetch(proxiedUrl);
    if (!httpResponse.ok) {
        throw new Error('Network response was not ok');
    }
    const response: YahooResponse = await httpResponse.json();
    var item = response.chart.result[0];
    var adjCloses = item.indicators.adjclose[0].adjclose;
    var timestamps = item.timestamp;
    var output: DayVal[] = [];
    for (var i = 0; i < adjCloses.length && i < timestamps.length; i++){
        output.push({
            val: adjCloses[i],
            dayNumber: Math.floor(timestamps[i] / 86400)
        });
    }
    return output;
}

function getMoneyMarket(): DayVal[]{
    return moneyMarketPrices.map(z => ({
        dayNumber: z[0],
        val: z[1]
    }));
}

function getProxiedUrl(targetUrl: string){
    return 'https://corsproxy.io/?' + encodeURIComponent(targetUrl);
}

type YahooResponse = {
    chart: {
        result: [YahooItem]
    }
}

type YahooItem = {
    timestamp: number[],
    indicators: {
        quote: any,
        adjclose: AdjClose[]
    }
}

type AdjClose = {
    adjclose: number[]
}