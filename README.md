# MAX31865

> Node.js module for the MAX31865 thermocouple amplifier using [spi-device](https://github.com/fivdi/spi-device#readme).

<a href="https://github.com/MariusRumpf/max31865"><img alt="GitHub Actions status" src="https://github.com/MariusRumpf/max31865/workflows/CI/badge.svg"></a>

## Install
```sh
$ npm install --save max31865
```

## Usage
```js
const MAX31865 = require('max31865');
const sensor = new MAX31865(0, 0); // For /dev/spidev0.0

async function main() {
  await sensor.init();
  
  const tempC = await sensor.getTemperature();
};

main()
  .catch(console.error);
```

See `examples/index.js` for a full usage example.

## API

### Options
You can configure the used sensor using the following
options for the constructor. This example shows the
default values. 

```js
const sensor = new MAX31865(
  0, // bus - first digit in /dev/spidev0.0
  0, // device - second digit in /dev/spidev0.0
  {
    rtdNominal: 100, // nominal resistance of sensor
    refResistor: 430, // reference resistance on board
    wires: 2, // wires used for sensor (2, 3 or 4)
  }
);
```

### Methods
#### init()
Has to be called once before all other methods. It initilizes the
library and sensor for futher usage. 

Returns a promise.

Usage example: 
```js
sensor.init()
  .then(() => {
    // Work with sensor
  });
```

#### getTemperature()
Reads the resistance of the sensor and returns the temperature in
degree celsius.

Returns a promise resolving with the temperature value.

Usage example: 
```js
sensor.getTemperature()
  .then((temperature) => {
    console.log(`Temperature: ${temperature} °C`);
  });
```

#### getResistance()
Read the resistance value from the RTD in Ω.

Returns a promise resolving with the resistance value.

Usage example: 
```js
sensor.getResistance()
  .then((resistance) => {
    console.log(`Resistance: ${resistance} Ω`);
  });
```

#### getFaults()
Read out the integrated fault detection.

Returns a promise resolving with an object of faults and
if they have been detected.

Usage example:  
```js
sensor.getFaults()
  .then((faults) => {
    console.log('Faults', faults);
  });
```

#### readRtd()
Reads the raw ADC convertered value from the RTD sensor.

Returns a promise resolving with the raw RTD value.

Usage example:  
```js
sensor.readRtd()
  .then((raw) => {
    console.log(`Raw RTD value: ${raw}`);
  });
```

## Resources
- [Adafruit Python Library for MAX31865](https://github.com/adafruit/Adafruit_CircuitPython_MAX31865)
