cd %~dp0..\..\elite-navigator-util || exit /B 1
call npm start || exit /B 1

cd %~dp0..\..\elite-navigator-uplink || exit /B 1
call npm run build || exit /B 1

cd %~dp0..\
call npm run gh-pages || exit /B 1
