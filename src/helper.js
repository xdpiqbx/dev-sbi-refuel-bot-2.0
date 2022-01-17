module.exports = {
  logStart() {
    console.log('Bot has been satarted ....');
  },
  sortStringsFromObj(arrOfObjects, key) {
    arrOfObjects.sort((a, b) => (a[key] > b[key] ? 1 : -1));
  }
};
