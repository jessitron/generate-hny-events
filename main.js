const printHoneycombLink = require("./honeycomb_whoami.js");

// CHANGE THIS to use a different generator
//const { generateEvents, queryDefinition } = require("./a-gearset-trace.js");
const { generateEvents, queryDefinition } = require("./ritchie-bros.js");

console.log("jess is here");

const datasetName = process.env["DATASET_NAME"] || "jess-test2";
const writeKey =
  process.env["HONEYCOMB_API_KEY"] ||
  (function () {
    throw new Error("HONEYCOMB_API_KEY is required");
  })();

const events = generateEvents();
const jsonString = JSON.stringify(events);
console.log("how many events: " + events.length);
if (events.length === 0) {
  console.log("No events to send");
  return;
}
fetch(`https://api.honeycomb.io/1/batch/${datasetName}`, {
  method: "POST",
  headers: {
    "X-Honeycomb-Team": writeKey,
    "Content-Type": "application/json",
  },
  body: jsonString,
})
  .then((response) => {
    console.log("Response status: " + response.status);
    if (response.status !== 200) {
      console.log("Error: " + response.statusText);
      return response.text().then((text) => {
        console.log(text);
        throw new Error("Error: " + response.statusText);
      });
    }
    // print the content of the body
    return response.json();
  })
  .then((bodyJson) => {
    // console.log(bodyJson);
    console.log("responses received for " + bodyJson.length + " events");
    bodyJson.forEach((singleResponse, i) => {
      if (singleResponse.status !== 202) {
        console.log(singleResponse);
        console.log(events[i]);
      }
    });
  });

printHoneycombLink(writeKey, datasetName, queryDefinition);

console.log("jess is done");
