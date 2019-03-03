const spi = require('spi-device');
const { delay } = require('./utils');
const { resistanceToTemperature, rawToResistance } = require('./math');

const CONFIG_REG = 0x00;
const CONFIG_BIAS = 0x80;
const CONFIG_MODEAUTO = 0x40;
const CONFIG_1SHOT = 0x20;
const CONFIG_3WIRE = 0x10;
const CONFIG_FAULTSTAT = 0x02;
const RTDMSB_REG = 0x01;
const FAULTSTAT_REG = 0x07;
const FAULT_HIGHTHRESH = 0x80;
const FAULT_LOWTHRESH = 0x40;
const FAULT_REFINLOW = 0x20;
const FAULT_REFINHIGH = 0x10;
const FAULT_RTDINLOW = 0x08;
const FAULT_OVUV = 0x04;

class MAX31865 {
  /**
   * @param {Number} bus spi bus to use
   * @param {Number} device spi bus to use
   * @param {Object} options
   * @param {Number} options.rtdNominal nominal resistance of sensor
   * @param {Number} options.refResistor reference resistance on board
   * @param {Number} options.wires wire count for sensor (2, 3 or 4)
   */
  constructor(bus = 0, device = 0, {
    rtdNominal = 100,
    refResistor = 430,
    wires = 2,
  } = {}) {
    this.rtdNominal = rtdNominal;
    this.refResistor = refResistor;

    if (wires !== 2 && wires !== 3 && wires !== 4) {
      throw Error('Wires must be a value of 2, 3, or 4.');
    }
    this.wires = wires;

    this.device = spi.openSync(bus, device, {
      mode: spi.MODE1, // Supports MODE1 and MODE3
      maxSpeedHz: 500000,
    });

    this.transfer = message => (
      new Promise((resolve, reject) => {
        this.device.transfer(message, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      })
    );
  }

  /**
   * Initialize device
   * @returns {Promise<void>}
   */
  async init() {
    // Set wire config to register
    let config = await this.readU8(CONFIG_REG);
    if (this.wires === 3) {
      config |= CONFIG_3WIRE;
    } else {
      config &= ~CONFIG_3WIRE;
    }
    await this.writeU8(CONFIG_REG, config);

    // Default to no bias and no auto conversion
    await this.setBias(false);
    await this.setAutoConvert(false);
  }

  /**
   * Read an 8-bit unsigned value from the specified 8-bit address
   * @param {number} address
   * @returns {Promise<number>}
   */
  async readU8(address) {
    address &= 0x7F;
    const message = [{
      sendBuffer: Buffer.from([address, 0x00]),
      receiveBuffer: Buffer.alloc(2),
      byteLength: 2,
    }];
    await this.transfer(message);
    return message[0].receiveBuffer[1];
  }

  /**
   * Read an 16-bit unsigned value from the specified 8-bit address.
   * @param {number} address
   * @returns {Promise<number>}
   */
  async readU16(address) {
    address &= 0x7F;
    const message = [{
      sendBuffer: Buffer.from([address, 0x00, 0x00]),
      receiveBuffer: Buffer.alloc(3),
      byteLength: 3,
    }];
    await this.transfer(message);
    const [, msb, lsb] = message[0].receiveBuffer;
    return (msb << 8) | lsb;
  }

  /**
   * Write an 8-bit unsigned value to the specified 8-bit address.
   * @param {number} address
   * @param {number} byte
   * @returns {Promise<number>}
   */
  async writeU8(address, byte) {
    address |= 0x80;
    const message = [{
      sendBuffer: Buffer.from([address, byte]),
      byteLength: 2,
    }];
    await this.transfer(message);
  }

  /**
   * The fault state of the sensor.  Use `clearFaults()` to clear the
   * fault state
   * @returns {Promise<Object>}
   */
  async getFaults() {
    const faults = await this.readU8(FAULTSTAT_REG);
    return {
      highthresh: Boolean(faults & FAULT_HIGHTHRESH),
      lowthresh: Boolean(faults & FAULT_LOWTHRESH),
      refinlow: Boolean(faults & FAULT_REFINLOW),
      refinhigh: Boolean(faults & FAULT_REFINHIGH),
      rtdinlow: Boolean(faults & FAULT_RTDINLOW),
      ovuv: Boolean(faults & FAULT_OVUV),
    };
  }

  /**
   * Clear any fault state previously detected by the sensor
   * @returns {Promise<void>}
   */
  async clearFaults() {
    let config = await this.readU8(CONFIG_REG);
    config &= ~0x2C;
    config |= CONFIG_FAULTSTAT;
    await this.writeU8(CONFIG_REG, config);
  }

  /**
   * Gets the current bias value
   * @returns {Promise<boolean>}
   */
  async getBias() {
    return Boolean(await this.readU8(CONFIG_REG) & CONFIG_BIAS);
  }

  /**
   * Sets the bias value
   * If bias is disabled, power is saved between one-shot measurements
   * Should be kept enabled in conversion mode
   * @param {boolean} enable
   * @returns Promise<void>
   */
  async setBias(enable) {
    let config = await this.readU8(CONFIG_REG);
    if (enable === true) {
      config |= CONFIG_BIAS;
    } else {
      config &= ~CONFIG_BIAS;
    }
    await this.writeU8(CONFIG_REG, config);
  }

  /**
   * Gets the current auto convert value
   * @returns Promise<boolean>
   */
  async getAutoConvert() {
    return Boolean(await this.readU8(CONFIG_REG) & CONFIG_MODEAUTO);
  }

  /**
   * Sets the auto convert value
   * If enabled conversions occur continuously at a 50/60Hz rate
   * @param {boolean} enable
   * @returns Promise<void>
   */
  async setAutoConvert(enable) {
    let config = await this.readU8(CONFIG_REG);
    if (enable === true) {
      config |= CONFIG_MODEAUTO;
    } else {
      config &= ~CONFIG_MODEAUTO;
    }
    await this.writeU8(CONFIG_REG, config);
  }

  /**
   * Perform a raw reading of the thermocouple and return its 15-bit
   * value. You'll need to manually convert this to temperature using the
   * nominal value of the resistance-to-digital conversion and some math.
   * @returns {Promise<number>}
   */
  async readRtd() {
    await this.clearFaults();
    await this.setBias(true);
    await delay(100);
    let config = await this.readU8(CONFIG_REG);
    config |= CONFIG_1SHOT;
    await this.writeU8(CONFIG_REG, config);
    await delay(650);
    let rtd = await this.readU16(RTDMSB_REG);
    rtd >>= 1; // Remove fault bit
    return rtd;
  }

  /**
   * Read the resistance of the RTD and return its value in Ohms.
   * @returns {Promise<number>}
   */
  async getResistance() {
    const rtd = await this.readRtd();
    return rawToResistance(rtd, this.refResistor);
  }

  /**
   * Read the temperature of the sensor and return its value in degrees Celsius
   * @returns {Promise<number>}
   */
  async getTemperature() {
    const resistance = await this.getResistance();
    return resistanceToTemperature(resistance, this.rtdNominal);
  }
}

module.exports = {
  MAX31865,
};
