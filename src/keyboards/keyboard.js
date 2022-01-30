const KB_BTNS = require('./buttons');
const keyboard = {
  admin(status) {
    return {
      keyboard: [
        [
          status < 2 ? KB_BTNS.TOTAL_FUEL_BALANCE : '',
          status === 0 ? KB_BTNS.GIVE_OUT_FUEL : ''
        ],
        [
          status < 3 ? KB_BTNS.ABOUT_CAR : '',
          status < 3 ? KB_BTNS.ABOUT_DRIVER : ''
        ],
        [status < 2 ? KB_BTNS.CAR_REFUEL_STAT : '']
      ],
      one_time_keyboard: true,
      resize_keyboard: true
    };
  },
  myCars() {
    return {
      keyboard: [[KB_BTNS.MY_CARS]],
      one_time_keyboard: true,
      resize_keyboard: true
    };
  }
};

module.exports = keyboard;
