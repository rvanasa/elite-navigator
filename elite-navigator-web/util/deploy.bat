cd %~dp0..\..\elite-navigator-galaxy || exit /B 1
call npm start || exit /B 1

cd %~dp0..
call npm run deploy-static || exit /B 1

cd %~dp0..\..\elite-navigator-uplink || exit /B 1
call npm deploy || exit /B 1
