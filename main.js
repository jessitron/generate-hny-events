console.log("jess is here");

const datasetName = "jess-test";
const writeKey =
  "hcaik_01jkbc0h1k1fgtnk1k4dzvx11hey4zy2nadezp80k4sg55en4krz8b8m9j";

const events = [
  {
    time: new Date().toISOString(),
    name: "test event",
  },
];
fetch(`https://api.honeycomb.io/1/batch/${datasetName}`, {
  method: "POST",
  headers: {
    "X-Honeycomb-Team": writeKey,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(events),
}).then((response) => {
  console.log(response.status);
});

console.log("jess is done");
