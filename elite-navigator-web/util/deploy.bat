cd %~dp0
call npm run build || exit /B 1

cd %~dp0\..\elite-navigator-uplink
call npm run build || exit /B 1
move /Y build %~dp0\build\public || exit /B 1

cd %~dp0
call npm run gh-pages
