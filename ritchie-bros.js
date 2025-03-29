const uuid = require("uuid");
const runId = uuid.v4();

const EMAIL_DOMAIN = "legitimatebusiness.com";
const CANADA_EMAIL_DOMAIN = "legitimatebusiness.ca";

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

  const storeWeights = {
    Albuquerque: 5,
    Atlanta: 10,
    Calgary: 8,
    "Chicago Aurora": 12,
    Dallas: 30,
    "Denver East": 7,
    Victoria: 3,
    Indianapolis: 6,
    Edmonton: 4,
    "Quebec City": 50,
    Montreal: 9,
    Toronto: 11,
    Vancouver: 10,
    Seattle: 8,
    Phoenix: 6,
    "Los Angeles": 14,
    "San Francisco": 13,
    "San Diego": 5,
    "Las Vegas": 7,
    "Houston South": 12,
    Miami: 9,
    Newark: 6,
    Boston: 8,
    Philadelphia: 10,
    Baltimore: 5,
    Washington: 7,
    Detroit: 6,
    Cleveland: 4,
    Pittsburgh: 3,
    Charlotte: 60,
  };

  const stores = Object.keys(storeWeights);

  function isInCanada(store) {
    return (
      store === "Calgary" ||
      store === "Edmonton" ||
      store === "Quebec City" ||
      store === "Montreal" ||
      store === "Toronto" ||
      store === "Victoria" ||
      store === "Vancouver"
    );
  }

  const weightedStores = Object.entries(storeWeights).flatMap(
    ([store, weight]) => Array(weight).fill(store)
  );

  const randomStore = () => {
    return weightedStores[Math.floor(Math.random() * weightedStores.length)];
  };

  const associateFirstNames = [
    "John",
    "Igor",
    "Rutu",
    "Alice",
    "Mike",
    "Mary",
    "Tom",
    "Pierre",
    "Chris",
    "Katie",
    "David",
    "Ranbir",
    "James",
    "Linda",
    "Sunidh",
    "Susan",
    "William",
    "Patricia",
    "Tomasz",
    "Jennifer",
    "Harold",
    "Elizabeth",
  ];

  const associateLastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Jones",
    "Nguyen",
    "Davis",
    "Sudiewicz",
    "Wilson",
    "Moore",
    "Tessier",
    "Crow",
    "Thomas",
    "Subramanian",
    "Erickson",
    "Jackson",
    "Martin",
  ];

  const randomAssociateName = () => {
    const firstName =
      associateFirstNames[
        Math.floor(Math.random() * associateFirstNames.length)
      ];
    const lastName =
      associateLastNames[Math.floor(Math.random() * associateLastNames.length)];
    return `${firstName}.${lastName}`;
  };

  function mergeObjects(arrayOfObjects) {
    return arrayOfObjects.reduce((acc, obj) => {
      return { ...acc, ...obj };
    }, {});
  }
  const ASSOCIATES_PER_STORE = 10;
  const associatesByStore = mergeObjects(
    stores.map((store) => {
      const associates = [];
      for (let i = 0; i < ASSOCIATES_PER_STORE; i++) {
        const domain = isInCanada(store) ? CANADA_EMAIL_DOMAIN : EMAIL_DOMAIN;
        const associateEmail = randomAssociateName() + "@" + domain;
        associates.push(associateEmail);
      }
      return { [store]: associates };
    })
  );

  function weightedProbability(values) {
    const weights = values.map((_, index) => Math.pow(2, index)); // Exponential decay
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const normalizedWeights = weights.map((weight) => weight / totalWeight);

    const random = Math.random();
    let cumulative = 0;

    for (let i = 0; i < normalizedWeights.length; i++) {
      cumulative += normalizedWeights[i];
      if (random < cumulative) {
        return values[i];
      }
    }
  }

  function randomAssociateForStore(store) {
    const storeAssociates = associatesByStore[store];
    // it is more likely to choose an associate at the beginning of the list
    return weightedProbability(storeAssociates);
  }

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
      const store = randomStore();
      const associate = randomAssociateForStore(store);
      events.push({
        time: formattedDate,
        data: {
          name: "accept payment",
          paymentType: "check",
          amount: 100000 * Math.random(),
          store: store,
          employee: associate,
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
