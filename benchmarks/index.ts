import jsxBenchmark from './jsx';
import { performance } from 'perf_hooks';
import { Readable } from 'stream';

const SAMPLES = 1000;

const formatNumber = (input: number) => String(input.toFixed(2)).padStart(6);
const printStats = (label: string, timings: number[]) => {
  const min = formatNumber(Math.min(...timings));
  const max = formatNumber(Math.max(...timings));
  const mean = formatNumber(timings.reduce((sum, cur) => sum + cur, 0) / SAMPLES);
  console.log(`${label}\t mean:${mean}\t min:${min}\t max:${max}`);
};

const executeBenchmark = async (label: string, benchmark: () => Readable) => {
  const timeToFirstByte = [];
  const timeToLastByte = [];

  for (let i = 1; i <= SAMPLES; i++) {
    const start = performance.now();
    const stream = benchmark();
    stream.once('data', () => timeToFirstByte.push(performance.now() - start));
    await new Promise((resolve) => stream.on('end', resolve));
    timeToLastByte.push(performance.now() - start);
  }
  console.log(`==== ${label} ==========================================`);
  printStats('TTFB', timeToFirstByte);
  printStats('TTLB', timeToLastByte);
};

const executeBenchmarks = async () => {
  await executeBenchmark('JSX', jsxBenchmark);
};

executeBenchmarks();
