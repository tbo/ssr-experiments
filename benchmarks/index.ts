import { performance } from 'perf_hooks';
import { Readable, Stream } from 'stream';
import jsxBenchmark from './jsx';
import reactBenchmark from './react';
import simpleTemplateTagBenchmark from './simple-template-tag';
import advancedTemplateTagBenchmark from './advanced-template-tag';

const SAMPLES = 1000;

// const toString = async (stream: Readable) => {
//   let buffer = '';
//   stream.on('data', (data: string) => (buffer += data));
//   return new Promise((resolve) => stream.on('end', () => resolve(buffer)));
// };

const formatNumber = (input: number) => String(input.toFixed(2)).padStart(6);
const printStats = (label: string, timings: number[]) => {
  const min = formatNumber(Math.min(...timings));
  const max = formatNumber(Math.max(...timings));
  const mean = formatNumber(timings.reduce((sum, cur) => sum + cur, 0) / SAMPLES);
  console.log(`${label}\t mean:${mean}\t min:${min}\t max:${max}`);
};

const executeBenchmark = async (label: string, benchmark: () => Promise<Readable> | Readable | Promise<string>) => {
  const timeToFirstByte = [];
  const timeToLastByte = [];

  for (let i = 1; i <= 1000; i++) {
    await benchmark();
  }
  for (let i = 1; i <= SAMPLES; i++) {
    const start = performance.now();
    const response = await benchmark();
    if (response instanceof Stream) {
      response.once('data', () => timeToFirstByte.push(performance.now() - start));
      await new Promise((resolve) => response.on('end', resolve));
    } else {
      timeToFirstByte.push(performance.now() - start);
    }
    timeToLastByte.push(performance.now() - start);
  }
  console.log(`==== ${label} `.padEnd(51, '='));
  printStats('TTFB', timeToFirstByte);
  printStats('TTLB', timeToLastByte);
};

const executeBenchmarks = async () => {
  // await executeBenchmark('JSX', jsxBenchmark);
  // await executeBenchmark('React', reactBenchmark);
  await executeBenchmark('Simple Template Tag', simpleTemplateTagBenchmark);
  await executeBenchmark('Advanced Template Tag', advancedTemplateTagBenchmark);
};

executeBenchmarks();
