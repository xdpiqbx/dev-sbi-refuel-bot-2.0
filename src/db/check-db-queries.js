const lastDayOfMonth = require('date-fns/lastDayOfMonth');

const Check = require('./model/check.model');

module.exports = {
  saveCheckToDb: check => {
    new Check(check).save();
  },
  getAllChecks: async () => {
    return await Check.find({});
  },
  getChecksByCarId: async (carId, year) => {
    return await Check.find({
      carId,
      date: {
        $gte: `${year}`,
        $lte: `${year + 1}`
      }
    }).select('date');
  },
  getChecksByCarIdForSpecificMonth: async (carId, month, year) => {
    const startDate = new Date(year, month, 1);

    const lastDay = lastDayOfMonth(startDate).getDate();
    const endDate = new Date(year, month, lastDay);

    const utc_offset = Math.abs(endDate.getTimezoneOffset());

    startDate.setMinutes(utc_offset);

    endDate.setHours(23);
    endDate.setMinutes(utc_offset);
    endDate.setSeconds(59);

    console.log({ startDate, endDate, utc_offset });

    return await Check.find({
      carId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).select('date litres checkImageUrl driverId');
  }
};
