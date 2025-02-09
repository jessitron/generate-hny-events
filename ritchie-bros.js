const uuid = require("uuid");
const runId = uuid.v4();

function generateEvents() {
  // generate events over 60 days to represent a rising count of personal checks being accepted.
  // 1. generate a random number of checks accepted per day:
  const checksAcceptedPerDay = [
    0, 0, 0, 0, 0, 95, 71, 0, 116, 81, 116, 94, 110, 108, 0, 103, 127, 116, 121,
    147, 113, 0, 145, 139, 139, 139, 132, 105, 0, 145, 177, 149, 177, 180, 143,
    0, 169, 181, 159, 155, 176, 167, 0, 160, 203, 189, 216, 216, 155, 0, 209,
    202, 193, 199, 171, 169, 0, 231, 191, 258, 273,
  ];
  //const checksAcceptedPerDay = [1];

  function timeOfDayAdjustment() {
    // plus or minus 4 hours
    const fourHours = 4 * 60 * 60 * 1000;
    const result = Math.floor(Math.random() * fourHours * 2) - fourHours;
    return result;
  }

  const now = new Date().getTime();
  function generateEventsForTheDay(params) {
    const { daysAgo, numberOfChecksAccepted } = params;
    const events = [];
    for (let i = 0; i < numberOfChecksAccepted; i++) {
      const timeOfDay = timeOfDayAdjustment();
      const unixDate = now - daysAgo * 24 * 60 * 60 * 1000 + timeOfDay;
      const formattedDate = new Date(unixDate).toISOString();
      events.push({
        time: formattedDate,
        data: {
          name: "check accepted",
          amount: 100000 * Math.random(),
          runId,
          timeOfDay,
          daysAgo,
          now,
          formattedDate,
        },
      });
    }
    return events;
  }

  const events = checksAcceptedPerDay
    .map((checksAccepted, index) => {
      return generateEventsForTheDay({
        daysAgo: 61 - index, // it's ok to throw out some future events
        numberOfChecksAccepted: checksAccepted,
      });
    })
    .flat();
  return events;
}

const queryDefinition = {
  time_range: 5184000,
  granularity: 86400,
  calculations: [
    {
      op: "COUNT",
    },
  ],
  filters: [
    {
      column: "runId",
      op: "=",
      value: runId,
    },
  ],
  orders: [],
  havings: [],
  limit: 100,
};

module.exports = {
  generateEvents,
  queryDefinition,
};
