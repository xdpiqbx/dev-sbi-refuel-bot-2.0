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
    // делать выборку чеков за последние 3 месяца
    // return await Check.find({ carId }).select('date litres driverId');
    return await Check.find({
      carId,
      date: {
        $gte: `${year}`,
        $lte: `${year + 1}`
      }
    }).select('date');
  },
  getChecksByCarIdForSpecificMonth: async (carId, month, year) => {
    const startDate = new Date();
    const endDate = new Date();

    const firstDay = 1;
    const utc_offset = Math.abs(endDate.getTimezoneOffset());

    startDate.setHours(0);
    startDate.setMinutes(utc_offset);
    startDate.setSeconds(0);
    startDate.setDate(firstDay);
    startDate.setMonth(month);
    startDate.setFullYear(year);

    const lastDay = lastDayOfMonth(startDate).getDate();

    endDate.setHours(23);
    endDate.setMinutes(59);
    endDate.setSeconds(59);
    endDate.setDate(lastDay);
    endDate.setMonth(month);
    endDate.setFullYear(year);

    endDate.setMinutes(endDate.getMinutes() + utc_offset);

    return await Check.find({
      carId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).select('date litres checkImageUrl driverId');
  }
};
