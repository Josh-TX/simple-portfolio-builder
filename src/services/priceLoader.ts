import { DayPrice } from "../models/models";

var pricesMap: {[ticker: string]: DayPrice[]} = {}

export async function getPriceHistory(ticker: string): Promise<DayPrice[]> {
    if (pricesMap[ticker]){
        return pricesMap[ticker];
    }
    var cachedJson = localStorage[ticker];
    if (cachedJson){
        var cached: CachedDayPrices = JSON.parse(cachedJson);
        var msDiff = (new Date().getTime() / 1000)  - cached.insertTime;
        var cachedHours = 48;
        if (msDiff / (1000 & 60 * 60 * cachedHours)) {
            pricesMap[ticker] = cached.prices;
            return cached.prices;
        }
    }
    var prices = await loadPriceHistoryFromAPI(ticker);
    if (prices.length > 0){
        var toCache: CachedDayPrices = {
            insertTime: new Date().getTime() / 1000,
            prices: prices
        };
        localStorage[ticker] = JSON.stringify(toCache);
    }
    pricesMap[ticker] = prices;
    return prices;
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

function getProxiedUrl(targetUrl: string){
    return 'https://corsproxy.io/?' + encodeURIComponent(targetUrl);
}

type CachedDayPrices = {
    insertTime: number,
    prices: DayPrice[]
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