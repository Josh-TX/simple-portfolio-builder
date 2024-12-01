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
	var morningStar = await readJsonFile("input.json");
	var data = morningStar[0].series.map(z => ({dayNumber: Math.floor(new Date(z.date + "T00:00").getTime() / 86400000), price: z.totalReturn}));
	data = data.filter(z => z.dayNumber >= 10957);//limit to jan 1st 2000
	var output = data.map(z => [z.dayNumber, Number.parseFloat(z.price.toPrecision(7))]);
  
	// var lastIndex = 0;
	// var lastPrice = output[0][1];
	// for (var i = 1; i < output.length; i++){
	// 	if (output[i][1] != lastPrice){
	// 		var totalIterations = i - 1 - lastIndex; 
	// 		for (var j = lastIndex + 1; j < i; j++){
	// 			// var currentIteration = j - lastIndex;
	// 			// var ratio = (totalIterations + 1) / currentIteration;
	// 			var smoothedAmount = lastPrice + (output[i][1] - lastPrice) * ((j - lastIndex)/ (i - lastIndex));
	// 			output[j][1] = Number.parseFloat(smoothedAmount.toPrecision(7));
	// 		}
	// 		lastIndex = i;
	// 		lastPrice = output[i][1];
	// 	}
	// }
	
	writeJsonFile("output.json", output);
}

main();