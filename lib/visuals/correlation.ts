// A deterministic, standardised point cloud with the selected sample correlation.
// Synthetic observations only; no market feed or society statistics are represented.
const COUNT = 96;
function normal(seed: number) {
  const unit = (n: number) => { const value = Math.sin(n * 127.1 + 311.7) * 43758.5453; return value - Math.floor(value); };
  return Math.sqrt(-2 * Math.log(Math.max(.0001, unit(seed)))) * Math.cos(2 * Math.PI * unit(seed + 157));
}
const seeds = Array.from({ length: COUNT }, (_, i) => [normal(i + 1), normal(i + 103), normal(i + 229), normal(i + 401)]);
function standardise(values: number[]) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const centred = values.map(value => value - mean);
  const deviation = Math.sqrt(centred.reduce((sum, value) => sum + value * value, 0) / values.length);
  return centred.map(value => value / deviation);
}
export function correlationPoints(correlation: number, phase = 0) {
  const rho = Math.max(-.95, Math.min(.95, correlation));
  const x = standardise(seeds.map(([a, b]) => a * Math.cos(phase) + b * Math.sin(phase)));
  const raw = standardise(seeds.map(([, , a, b]) => a * Math.cos(phase * .7) + b * Math.sin(phase * .7)));
  const projection = x.reduce((sum, value, i) => sum + value * raw[i], 0) / COUNT;
  const noise = standardise(raw.map((value, i) => value - projection * x[i]));
  return x.map((value, i) => ({ x: value, y: rho * value + Math.sqrt(1 - rho * rho) * noise[i] }));
}
export const plotX = (x: number) => 300 + x * 68;
export const plotY = (y: number) => 221 - y * 56;
export function correlationContour(rho: number, radius: number) {
  return Array.from({ length: 81 }, (_, i) => {
    const angle = i / 80 * Math.PI * 2;
    const x = radius * Math.cos(angle);
    const y = rho * x + Math.sqrt(1 - rho * rho) * radius * Math.sin(angle);
    return `${i ? "L" : "M"}${plotX(x).toFixed(2)},${plotY(y).toFixed(2)}`;
  }).join(" ") + " Z";
}
