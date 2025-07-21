#!/bin/bash

# Prompt the user for input
read -p "Do you want to run with mobile? (Make sure you are using a Mac and iOS simulators are available) [y/yes or any other key to skip]: " answer

# Convert the answer to lowercase for case-insensitive comparison
answer_lower=$(echo "$answer" | tr '[:upper:]' '[:lower:]')

# Check if the answer is 'y' or 'yes'
if [[ "$answer_lower" == "y" || "$answer_lower" == "yes" ]]; then
    echo "Running with mobile..."
    ./runWithMobileMac.sh
else
    echo "Skipping mobile, running without..."
    ./runWithoutMobile.sh
fi