// https://stackoverflow.com/questions/40593875/using-filesystem-in-node-js-with-async-await
const { promises: fs } = require('fs');
const xmlParser = require('fast-xml-parser');
const { plot, stack, clear, Plot } = require('nodeplotlib');
const moment = require('moment');

// The directory we should pull data in from.
//
// NOTE: You must include the trailing '/' on the directory
//    GOOD: './data/'
//    BAD : '/data'
const dataDirectory = './data/';

// Top level await PLSSS
(async () => {
  // Pull all the items from the data directory
  const files = await fs.readdir(dataDirectory);

  if(files.length === 0) return console.warn('No files found in the data directory.');

  // The objects that represent the data inside of each file
  let workouts = [];

  // Loop through all the file names
  for(const fileName of files) {
    // Read file
    let data = await fs.readFile(`${dataDirectory}${fileName}`);

    // Turn the raw file data into a string so it can be parsed as XML
    data = data.toString();

    // Parse the data from the file as XML
    const parsedXML = xmlParser.parse(data);

    if(!parsedXML) return console.warn('Found unparsed XML file', fileName, parsedXML);

    // The workout data pulled from the parsed XML
    const workoutData = parsedXML.TrainingCenterDatabase.Activities.Activity;

    if(workoutData.Notes !== 'Biking') {
      console.log('This workout is not a biking workout');

      continue;
    };

    console.log(workoutData);

    // Push the workout to the workouts array
    workouts.push(workoutData);
  };

  console.log(workouts.length);

  // X and Y axis for the chart
  let chartDataX = [];
  let chartDataY = [];

  // The total number of all Y axis measurements added up
  let totalYAxis = 0;

  // Now that we have all the parsed data, run through the parsed data and plot the points
  for(const workout of workouts) {
    // If the workout is less than or equal to 100 seconds, just skip it. I found that Google Fit was
    // recording random workouts during the day for no reason and causes the graph to look weird
    if(workout.TotalTimeSeconds <= 100) continue;

    // Parse the time when this workout happened
    const time = moment.utc(workout.Id).format('LLL');

    // if(!workout.Lap.AverageHeartRateBpm) continue;
    // if(!workout.Lap.AverageHeartRateBpm) continue;

    // This gets plotted on the Y axis.
    const valueOfInterest = workout.Lap.DistanceMeters * 0.000621371;
    // const valueOfInterest = (workout.Lap.AverageHeartRateBpm.Value + workout.Lap.AverageHeartRateBpm.Value) / 2;

    if(valueOfInterest <= .05) continue;

    totalYAxis += valueOfInterest;

    // Push the time to the X axis
    chartDataX.push(time);

    // Push this variable to the Y axis
    chartDataY.push(valueOfInterest);
  };

  console.log(`Parsed ${workouts.length} workouts, all Y-Axis values added together equal ${totalYAxis}, averaging to ${(totalYAxis / workouts.length).toFixed(2)} per workout.`);

  const chartData = [
    {
      x: chartDataX,
      y: chartDataY,
      type: 'line',
    },
  ];

  stack(chartData);
  plot();
})();
