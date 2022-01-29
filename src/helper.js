module.exports = {
  sortStringsFromObj(arrOfObjects, key) {
    arrOfObjects.sort((a, b) => (a[key] > b[key] ? 1 : -1));
  }
};
