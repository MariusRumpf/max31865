const { resistanceToTemperature, rawToResistance } = require('../src/math');

describe('MAX31865 Math', () => {
  it('converts resistances to temperatures', () => {
    expect(resistanceToTemperature(18.52)).toBe(-200);
    expect(resistanceToTemperature(29.22)).toBe(-175);
    expect(resistanceToTemperature(39.72)).toBe(-150.008);
    expect(resistanceToTemperature(50.06)).toBe(-125.001);
    expect(resistanceToTemperature(60.26)).toBe(-99.9905);
    expect(resistanceToTemperature(100)).toBe(0);
    expect(resistanceToTemperature(103.9)).toBe(9.99352);
    expect(resistanceToTemperature(107.79)).toBe(19.991);
    expect(resistanceToTemperature(111.67)).toBe(29.9924);
    expect(resistanceToTemperature(123.24)).toBe(59.9951);
    expect(resistanceToTemperature(203.11)).toBe(274.997);
    expect(resistanceToTemperature(297.49)).toBe(550.009);
  });

  it('converts raw to resistance', () => {
    const refRes = 400;
    expect(rawToResistance(1517, refRes)).toBe(18.5181);
    expect(rawToResistance(2394, refRes)).toBe(29.2236);
    expect(rawToResistance(3254, refRes)).toBe(39.7217);
  });
});
