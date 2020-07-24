cd %~dp0..\..\elite-navigator-galaxy || exit /B 1
call npm start || exit /B 1

cd %~dp0..
call npm run deploy-static || exit /B 1

echo ~~~ Make sure to deploy new Uplink version if necessary ~~~
