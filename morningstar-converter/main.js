import https from 'https';
import fs from 'fs';

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'node.js'
      }
    };

    https.get(url, options, (res) => {
      let data = '';

      // A chunk of data has been received.
      res.on('data', (chunk) => {
        data += chunk;
      });

      // The whole response has been received.
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });

    }).on('error', (e) => {
      reject(e);
    });
  });
}

function getYahooTimestamps(){
	const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/VWELX?range=100y&interval=1d`;
	return httpGet(targetUrl)
	  .then((response) => {
		var timestamps = response.chart.result[0].timestamp;
		return timestamps;
	  });
  
}

function readJsonFile(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      try {
        const json = JSON.parse(data);
        resolve(json);
      } catch (error) {
        reject(error);
      }
    });
  });
}

function writeJsonFile(filename, obj) {
    const jsonContent = JSON.stringify(obj);
    fs.writeFile(filename, jsonContent,  (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return;
        }
        console.log('File has been written successfully');
    });
}


  
async function main(){
	var timestamps = await getYahooTimestamps();
	var morningStar = await readJsonFile("input.json");
	var data = morningStar[0].series.map(z => ({time: new Date(z.date).getTime() / 1000, price: z.totalReturn}));
	data = data.filter(z => z.time > timestamps[0]);
	timestamps = timestamps.filter(z => z > 946684800);//limit to jan 1st 2000
	var output = [];
	for (var timestamp of timestamps){
		var i = data.findIndex(z => z.time > timestamp);
		if (i <= 0){
			continue;
		}
		var amount = Number.parseFloat(data[i - 1].price.toPrecision(7));
		output.push([timestamp, amount]);
	}
	
	var lastIndex = 0;
	var lastPrice = output[0][1];
	for (var i = 1; i < output.length; i++){
		if (output[i][1] != lastPrice){
			var totalIterations = i - 1 - lastIndex; 
			for (var j = lastIndex + 1; j < i; j++){
				var currentIteration = j - lastIndex;
				var ratio = (totalIterations + 1) / currentIteration;
				var smoothedAmount = lastPrice + (output[i][1] - lastPrice) * ((j - lastIndex)/ (i - lastIndex));
				output[j][1] = Number.parseFloat(smoothedAmount.toPrecision(7));
			}
			lastIndex = i;
			lastPrice = output[i][1];
		}
	}
	
	writeJsonFile("output.json", output);
}

main();