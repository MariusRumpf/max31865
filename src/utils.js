module.exports = {
  delay: (timeout) => (new Promise((resolve) => { setTimeout(resolve, timeout); })),
};
