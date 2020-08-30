// https://stackoverflow.com/questions/40593875/using-filesystem-in-node-js-with-async-await
//
// Module Imports
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

// Which workouts should we analyze?
//
// NOTE: To analyze all workouts, make this '*'
//
// If you want to find which type a workout is, check the .TXC file for the <Notes></Notes> XML field.
// Some examples are: 'Biking', 'Walking'
const workoutTypeToAnalyze = 'Biking';

// I really need to update to node v14.3 for top-level await...
(async () => {
  // Pull all the items from the data directory
  const files = await fs.readdir(dataDirectory);

  if(files.length === 0) return console.warn('No files found in the data directory.');

  // The objects that represent the data inside of each file
  let workouts = [];

  // Loop through all the file names
  for(const fileName of files) {
    // Ignore the .gitignore file, since it's not the file type that we need!
    if(fileName === '.gitignore') continue;

    // Read the file
    let data = await fs.readFile(`${dataDirectory}${fileName}`);

    // Turn the raw file data into a string so it can be parsed as XML
    data = data.toString();

    // Parse the data from the file as XML
    const parsedXML = xmlParser.parse(data);

    if(!parsedXML) return console.warn('Found unparsed XML file', fileName, parsedXML);

    // The workouts data pulled from the parsed XML
    //
    // This data can be one of the following:
    //  - WorkoutObject
    //  - WorkoutObject[]
    let parsedWorkoutsData = parsedXML.TrainingCenterDatabase.Activities.Activity;

    // If the parsed workout Data is not an array (just a normal WorkoutObject), turn it into a single object array
    if(!Array.isArray(parsedWorkoutsData)) parsedWorkoutsData = [ parsedWorkoutsData ];

    // Loop through the parsedWorkoutsData array and analyze each workout individually
    for(const workoutData of parsedWorkoutsData) {
      // What workout type is this?
      const workoutType = workoutData.Notes;

      // Is the workout type the same type that we are targeting?
      // If the workout type to analyze is a '*', that means we want all workouts
      if(workoutTypeToAnalyze !== '*' && workoutType !== workoutTypeToAnalyze) {
        console.log(`This workout is not a ${workoutTypeToAnalyze} workout, it is a ${workoutType} workout.`);

        continue;
      };

      // Log the workout object for easier debugging
      // console.log(workoutData);

      // Push the workout to the workouts array
      workouts.push(workoutData);
    };
  };

  if(workouts.length === 0) return console.error('Unable to find any workouts to analyze.');

  console.log(`Found ${workouts.length} workouts to analyze!`);

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

    // Parse the date of when this workout happened
    const date = moment.utc(workout.Id).format('LLL');

    // This 'valueOfInterest' gets plotted on the Y axis.
    //
    // 1 meter to 1 mile === .000621371
    const valueOfInterest = workout.Lap.DistanceMeters * 0.000621371;
    // const valueOfInterest = (workout.Lap.AverageHeartRateBpm.Value + workout.Lap.AverageHeartRateBpm.Value) / 2;

    // Add the value of interest to the Y axis total
    totalYAxis += valueOfInterest;

    // Push the date to the X axis
    chartDataX.push(date);

    // Push the value of interest to the Y axis data
    chartDataY.push(valueOfInterest);
  };

  console.log(`Parsed ${workouts.length} workouts, all Y-Axis values added together equal ${totalYAxis}, averaging to ${(totalYAxis / workouts.length).toFixed(2)} per workout.`);

  // Chart data configuration. We want a line graph with x and y data.
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
