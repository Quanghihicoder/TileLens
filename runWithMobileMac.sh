#!/bin/bash

./environment_setup.sh

# Get the current directory (escaped for AppleScript)
CURRENT_DIR=$(printf '%q' "$(pwd)")

# Open new terminal and run Docker (and bring it to front)
osascript <<EOF
tell application "Terminal"
    activate
    do script "cd $CURRENT_DIR && docker-compose up --build"
end tell
EOF

# Open another new terminal and run mobile setup (and bring it to front)
osascript <<EOF
tell application "Terminal"
    activate
    do script "cd $CURRENT_DIR/mobile && npm install && cd ios && pod install && cd .. && npm run ios"
end tell
EOF