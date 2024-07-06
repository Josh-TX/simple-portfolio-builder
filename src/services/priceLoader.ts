import { DayPrice } from "../models/models";
import { localSettingsService } from "./localSettingsService";
import { moneyMarketPrices } from "./moneyMarketPrices";

var pricesMap: {[ticker: string]: DayPrice[]} = {}

export async function getPriceHistory(ticker: string): Promise<DayPrice[]> {
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
    dayPrices = dayPrices.filter(z => z.price != null);
    dayPrices.forEach(dayPrice => dayPrice.price = Number.parseFloat(dayPrice.price.toPrecision(9)))
    if (dayPrices.length > 0){
        localSettingsService.setDayPrices(ticker, dayPrices);
    }
    pricesMap[ticker] = dayPrices;
    return dayPrices;
}


async function loadPriceHistoryFromAPI(ticker: string): Promise<DayPrice[]> {
    //proxy needed because yahoo finance has restrictive CORS headers
    const proxiedUrl = getProxiedUrl(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=100y&interval=1d`)
    const httpResponse = await fetch(proxiedUrl);
    if (!httpResponse.ok) {
        throw new Error('Network response was not ok');
    }
    const response: YahooResponse = await httpResponse.json();
    var item = response.chart.result[0];
    var adjCloses = item.indicators.adjclose[0].adjclose;
    var timestamps = item.timestamp;
    var output: DayPrice[] = [];
    for (var i = 0; i < adjCloses.length && i < timestamps.length; i++){
        output.push({
            price: adjCloses[i],
            timestamp: timestamps[i]
        });
    }
    return output;
}

function getMoneyMarket(): DayPrice[]{
    return moneyMarketPrices.map(z => ({
        timestamp: z[0],
        price: z[1]
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