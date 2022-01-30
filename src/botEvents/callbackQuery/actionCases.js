const format = require('date-fns/format');
const { uk } = require('date-fns/locale');

const botMessages = require('../../botMessages');

const {
  getCarByIdWithoutDriversIds,
  getInfoAboutCarWithDriversNames
} = require('../../db/car-db-queries');

const {
  getChecksByCarId,
  getChecksByCarIdForSpecificMonth
} = require('../../db/check-db-queries');

const {
  getAllDriversWithoutChatId,
  getDriverByIdWithCars,
  getDriverByIdWithoutCars,
  getDriverStatusByChatId,
  setTlgChatIdToDriver,
  setTempCarIdForDriver,
  setGiveOutOrRefuel,
  getTempCarId
} = require('../../db/driver-db-queries');
const Driver = require('../../entityСlasses/Driver');

/*
TASK:
  case ACTION.GET_STATS_FOR_MONTH:
*/
const actionCases = {
  async candidateYesNo(chatId, dataFromQuery, sendMessage, action) {
    const candidateChatId = dataFromQuery.id;
    if (!dataFromQuery.val) {
      botMessages.newUserRejected(sendMessage, candidateChatId);
    } else {
      const driversWithoutChatId = await getAllDriversWithoutChatId();
      botMessages.addOrNotNewUserToDb(
        sendMessage,
        chatId,
        candidateChatId,
        driversWithoutChatId,
        action
      );
    }
  },
  async carsForRefuel(chatId, dataFromQuery, sendMessage, status) {
    try {
      const carForRefuel = await getCarByIdWithoutDriversIds(dataFromQuery.id);
      await setGiveOutOrRefuel(chatId, false); // giveOutOrRefuel = false;
      await setTempCarIdForDriver(chatId, carForRefuel._id);
      botMessages.howMuchDoWeFill(sendMessage, chatId, carForRefuel, status);
    } catch (error) {
      console.log(error);
    }
  },
  async giveOutFuel(chatId, dataFromQuery, sendMessage) {
    try {
      const carForGiveOut = await getCarByIdWithoutDriversIds(dataFromQuery.id);
      await setTempCarIdForDriver(chatId, carForGiveOut._id);
      botMessages.autoIsSelectedForGiveOutGasoline(
        sendMessage,
        chatId,
        carForGiveOut
      );
    } catch (error) {
      console.log(error);
    }
  },
  async addNewDriverToDb(creatorChatId, dataFromQuery, sendMessage) {
    try {
      const { acknowledged, modifiedCount } = await setTlgChatIdToDriver(
        dataFromQuery._id,
        dataFromQuery.id //candidateChatId
      );
      if (acknowledged && modifiedCount === 1) {
        const driver = new Driver(
          await getDriverByIdWithoutCars(dataFromQuery._id)
        );
        botMessages.reportDriverChatIdIsAddedToDb(
          sendMessage,
          creatorChatId,
          dataFromQuery.id,
          driver.name
        );
      } else {
        // Если не добавился в базу
        botMessages.failedToAddChatIdToDb(
          sendMessage,
          creatorChatId,
          dataFromQuery.id //candidateChatId
        );
      }
    } catch (error) {
      console.log(error);
    }
  },
  async infoAboutCar(chatId, dataFromQuery, sendMessage, status) {
    try {
      const car = await getInfoAboutCarWithDriversNames(dataFromQuery.id);
      botMessages.fullInfoAboutCar(sendMessage, chatId, car, status);
    } catch (error) {
      console.log(error);
    }
  },
  async infoAboutDriver(chatId, dataFromQuery, sendMessage) {
    try {
      const driver = await getDriverByIdWithCars(dataFromQuery.id);
      botMessages.fullInfoAboutDriver(sendMessage, chatId, driver);
    } catch (error) {
      console.log(error);
    }
  },
  async carStatistic(chatId, dataFromQuery, sendMessage, action) {
    try {
      await setTempCarIdForDriver(chatId, dataFromQuery.id);
      const carForStat = await getCarByIdWithoutDriversIds(dataFromQuery.id);
      const years = [2021, 2022];
      botMessages.getListOfYearsInline(
        sendMessage,
        chatId,
        years,
        carForStat,
        action
      );
    } catch (error) {
      console.log(error);
    }
  },
  async getListOfyears(chatId, dataFromQuery, sendMessage, action) {
    try {
      const carId = await getTempCarId(chatId);
      const checksByCarId = await getChecksByCarId(
        carId.temp_carId,
        dataFromQuery.year
      );

      const carForStatRes = await getCarByIdWithoutDriversIds(carId.temp_carId);

      const getAllMonthses = checks => {
        const arrAllDates = checks.map(check => check.date);
        return arrAllDates.map(date => ({
          month: date.getMonth(),
          label: format(date, 'LLLL', { locale: uk })
        }));
      };

      const allMonthses = getAllMonthses(checksByCarId);

      const unicMonthsesNums = [
        ...new Set(allMonthses.map(item => item.month))
      ].sort((a, b) => a - b);

      const allUnicMonthses = unicMonthsesNums.map(monNum => {
        return allMonthses.find(m => m.month === monNum);
      });
      // вывести inline месяца в которых заправлялась машина
      botMessages.getListOfMonthesInline(
        sendMessage,
        chatId,
        allUnicMonthses,
        dataFromQuery.year,
        carForStatRes,
        action
      );
    } catch (error) {
      console.log(error);
    }
  },
  async getStatsForMonth(chatId, dataFromQuery, sendMessage) {
    try {
      const car = await getTempCarId(chatId);
      const checksByCarIdForSpecificMonth =
        await getChecksByCarIdForSpecificMonth(
          car.temp_carId,
          dataFromQuery.month,
          dataFromQuery.year
        );
      const unicDates = [
        ...new Set(
          checksByCarIdForSpecificMonth.map(item => item.date.getDate())
        )
      ].sort((a, b) => a - b);
      const checksByDate = unicDates.map(date => {
        return checksByCarIdForSpecificMonth.filter(
          check => check.date.getDate() === date
        );
      });
      const resultArr = checksByDate.map(checksArr => {
        return {
          date: checksArr[0].date,
          litres: checksArr.reduce((acc, check) => (acc += check.litres), 0),
          imgsAndDrivers: checksArr.reduce((acc, check) => {
            acc.push({
              litres: check.litres,
              img: check.checkImageUrl,
              driver: check.driverId
            });
            return acc;
          }, [])
        };
      });
      const carForFinalStat = await getCarByIdWithoutDriversIds(car.temp_carId);
      const monthTotalStat = {
        car: {
          model: carForFinalStat.model,
          number: carForFinalStat.number
        },
        monthLabel: format(resultArr[0].date, 'LLLL', { locale: uk }),
        data: resultArr
      };
      await setTempCarIdForDriver(chatId, null);
      botMessages.refuelStatForCarInSpecMonth(
        sendMessage,
        chatId,
        monthTotalStat
      );
    } catch (error) {
      console.log(error);
    }
  }
};

module.exports = actionCases;
