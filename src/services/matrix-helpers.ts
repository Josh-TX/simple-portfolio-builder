import * as MathHelpers from "./math-helpers";


export function transpose<T>(matrix: T[][]): T[][] {
    const transposed: T[][] = [];
    for (let i = 0; i < matrix[0].length; i++) {
        transposed[i] = [];
        for (let j = 0; j < matrix.length; j++) {
            transposed[i][j] = matrix[j][i];
        }
    }
    return transposed;
}

function multiply(matrixA: number[][], matrixB: number[][]): number[][] {
    const rowsA = matrixA.length;
    const colsA = matrixA[0].length;
    const rowsB = matrixB.length;
    const colsB = matrixB[0].length;
    if (colsA !== rowsB) {
        console.warn("provided matrices: ", matrixA, matrixB);
        throw "The 2 provided matrices can't be multiplied"
    }
    const result: number[][] = Array.from({ length: rowsA }, () => Array(colsB).fill(0));
    for (let i = 0; i < rowsA; i++) {
        for (let j = 0; j < colsB; j++) {
            for (let k = 0; k < colsA; k++) {
                result[i][j] += matrixA[i][k] * matrixB[k][j];
            }
        }
    }

    return result;
}

function generateStandardNormalSamples(columnCount: number, columnSize: number): number[][] {
    const samples: number[][] = [];
    for (let i = 0; i < columnCount; i++) {
        const sample: number[] = [];
        for (let j = 0; j < columnSize; j++) {
            sample.push(Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random()));
        }
        samples.push(sample);
    }
    return samples;
}

export function choleskyDecomposition(matrix: number[][]): number[][] | null {
    const n = matrix.length;
    const L: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
        for (let j = 0; j <= i; j++) {
            let sum = 0;
            for (let k = 0; k < j; k++) {
                sum += L[i][k] * L[j][k];
            }
            if (i === j) {
                if (matrix[i][i] - sum < 0){
                    return null;
                }
                L[i][j] = Math.sqrt(matrix[i][i] - sum);
            } else {
                L[i][j] = (matrix[i][j] - sum) / L[j][j];
            }
        }
    }
    return L;
}

export function generateData(
    means: number[], 
    stdDevs: number[], 
    correlationMatrix: number[][], 
    columnCount: number
): number[][] {
    const standardNormalSamples = generateStandardNormalSamples(columnCount, means.length);
    const choleskyDecomp = choleskyDecomposition(correlationMatrix);
    if (choleskyDecomp == null){
        throw "correlation matrix is not positive semi-definite";
    }
    const transformedSamples = multiply(standardNormalSamples, transpose(choleskyDecomp!));
    for (const sample of transformedSamples as number[][]) {
        for (let i = 0; i < sample.length; i++) {
            sample[i] = means[i] + stdDevs[i] * sample[i];
        }
    }
    return transformedSamples;
}

export function getCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const meanX = MathHelpers.getSum(x) / n;
    const meanY = MathHelpers.getSum(y) / n;
    const covariance = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0) / n;
    const varianceX = x.reduce((sum, xi) => sum + (xi - meanX) ** 2, 0) / n;
    const varianceY = y.reduce((sum, yi) => sum + (yi - meanY) ** 2, 0) / n;
    const denominator = Math.sqrt(varianceX * varianceY);
    return denominator === 0 ? 0 : covariance / denominator;
}