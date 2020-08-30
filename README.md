# google-fit-analyzer
A small node script to analyze data exported from Google Fit. 

### Instructions:
 - Clone this repo onto your machine
 - Navigate your terminal/cmd to the directory where you cloned this repo
 - Run `npm i` to install dependencies
 - Export all your Google Fit data from [Google Takeout](https://takeout.google.com/)
 - Unzip the Google Fit data export and move the unzipped `./Takeout/Fit/Activities/*.tcx` files over to this project's `./data` directory
 - Modify the script as needed. By default, it will only analyze the distance of `Biking` type workouts. To analyze all workouts, set the `workoutTypeToAnalyze` variable to `'*'`. To analyze a different workout metric, change the `valueOfInterest` variable.
