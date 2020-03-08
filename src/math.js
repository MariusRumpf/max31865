const RTD_A = 3.9083e-3;
const RTD_B = -5.775e-7;

/**
 * Round a number to digits
 * @param {number} number
 * @param {number} digits
 * @returns {number}
 */
const round = (number, digits) => (Number(number.toPrecision(digits)));

/**
 * Converts the given resistance value to a temperature value
 * @param {number} resistance
 * @returns {number}
 */
const resistanceToTemperature = (resistance, nominalResistance = 100) => {
  //  This math originates from: http://www.analog.com/media/en/technical-documentation/application-notes/AN709_0.pdf
  const z1 = -RTD_A;
  const z2 = RTD_A * RTD_A - (4 * RTD_B);
  const z3 = (4 * RTD_B) / nominalResistance;
  const z4 = 2 * RTD_B;
  let temp = z2 + (z3 * resistance);
  temp = (Math.sqrt(temp) + z1) / z4;
  if (temp >= 0) {
    return round(temp, 6);
  }

  let rpoly = resistance;
  // For the following math to work, nominal RTD resistance must be normalized to 100 ohms
  rpoly /= nominalResistance;
  rpoly *= 100;

  temp = -242.02;
  temp += 2.2228 * rpoly;
  rpoly *= resistance; // square
  temp += 2.5859e-3 * rpoly;
  rpoly *= resistance; // ^3
  temp -= 4.8260e-6 * rpoly;
  rpoly *= resistance; // ^4
  temp -= 2.8183e-8 * rpoly;
  rpoly *= resistance; // ^5
  temp += 1.5243e-10 * rpoly;
  return round(temp, 6);
};

/**
 *
 * @param {number} rawValue
 * @param {number} referenceResistor
 * @returns {number}
 */
const rawToResistance = (rawValue, referenceResistor = 430) => {
  let resistance = rawValue / 32768;
  resistance *= referenceResistor;
  return round(resistance, 6);
};

module.exports = {
  rawToResistance,
  resistanceToTemperature,
};
