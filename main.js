const printHoneycombLink = require("./honeycomb_whoami.js");

console.log("jess is here");

// generate an ID for this run
const uuid = require("uuid");
const runId = uuid.v4();

const datasetName = process.env["DATASET_NAME"] || "jess-test2";
const writeKey =
  process.env["HONEYCOMB_API_KEY"] ||
  "hcaik_01jkbc0h1k1fgtnk1k4dzvx11hey4zy2nadezp80k4sg55en4krz8b8m9j";

// generate events over 60 days to represent a rising count of personal checks being accepted.
// 1. generate a random number of checks accepted per day:
const checksAcceptedPerDay = [
  0, 0, 0, 0, 0, 95, 71, 0, 116, 81, 116, 94, 110, 108, 0, 103, 127, 116, 121,
  147, 113, 0, 145, 139, 139, 139, 132, 105, 0, 145, 177, 149, 177, 180, 143, 0,
  169, 181, 159, 155, 176, 167, 0, 160, 203, 189, 216, 216, 155, 0, 209, 202,
  193, 199, 171, 169, 0, 231, 191, 258, 273,
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

// const events = [{ data: { name: "check_accepted", amount: 100 } }];

const jsonString = JSON.stringify(events);
console.log("how many events: " + events.length);
fetch(`https://api.honeycomb.io/1/batch/${datasetName}`, {
  method: "POST",
  headers: {
    "X-Honeycomb-Team": writeKey,
    "Content-Type": "application/json",
  },
  body: jsonString,
})
  .then((response) => {
    console.log(response.status);
    // print the content of the body
    return response.json();
  })
  .then((bodyJson) => {
    // console.log(bodyJson);
    bodyJson.forEach((singleResponse, i) => {
      if (singleResponse.status !== 202) {
        console.log(singleResponse);
        console.log(events[i]);
      }
    });
  });

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
printHoneycombLink(writeKey, datasetName, queryDefinition);

console.log("jess is done");
