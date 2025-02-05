console.log("jess is here");

const datasetName = "jess-test2";
const writeKey =
  "hcaik_01jkbc0h1k1fgtnk1k4dzvx11hey4zy2nadezp80k4sg55en4krz8b8m9j";

const events = [
  {
    // time: new Date().toISOString(),
    data: {
      name: "test event",
      poo: 3,
    },
  },
  {},
  {
    time: "2025-01-02T15:04:05.99Z",
    data: {
      some_other_key: "value",
      duration_ms: 40,
    },
  },
];
fetch(`https://api.honeycomb.io/1/batch/${datasetName}`, {
  method: "POST",
  headers: {
    "X-Honeycomb-Team": writeKey,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(events),
})
  .then((response) => {
    console.log(response.status);
    // print the content of the body
    return response.json();
  })
  .then((bodyJson) => {
    console.log(bodyJson);
  });

console.log("jess is done");
