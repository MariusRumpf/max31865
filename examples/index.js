const MAX31865 = require('../index');

const sensor = new MAX31865();

async function startReading() {
  const raw = await sensor.readRtd();
  console.log(`Raw rtd value: ${raw}`);

  const resistance = await sensor.getResistance();
  console.log(`Resistance: ${resistance} Ω`);

  const tempC = await sensor.getTemperature();
  console.log(`Temperature: ${tempC} °C`);

  const faults = await sensor.getFaults();
  console.log('Faults: ', faults);
}

async function main() {
  await sensor.init();
  await startReading();
  setInterval(startReading, 20000);
}

main()
  .then(console.log)
  .catch(console.error);
