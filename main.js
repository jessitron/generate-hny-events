const printHoneycombLink = require("./honeycomb_whoami.js");
const { generateEvents, queryDefinition } = require("./ritchie-bros.js");

console.log("jess is here");

const datasetName = process.env["DATASET_NAME"] || "jess-test2";
const writeKey =
  process.env["HONEYCOMB_API_KEY"] ||
  "hcaik_01jkbc0h1k1fgtnk1k4dzvx11hey4zy2nadezp80k4sg55en4krz8b8m9j";

const events = generateEvents();
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
    bodyJson.forEach((singleResponse, i) => {
      if (singleResponse.status !== 202) {
        console.log(singleResponse);
        console.log(events[i]);
      }
    });
  });

printHoneycombLink(writeKey, datasetName, queryDefinition);

console.log("jess is done");
