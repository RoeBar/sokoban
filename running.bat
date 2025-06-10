@echo off
REM Change the file names below to match yours
SET NODE_SERVER=./detectSpellModule/spell-api-server.mjs

REM Start the Node.js server in a new window
ECHO Starting Node.js server...
start "Node Server" cmd /k "node %NODE_SERVER%"

ECHO Done.