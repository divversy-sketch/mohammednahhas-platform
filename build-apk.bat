@echo off
echo ================================================
echo   Building Nahhas Platform Android APK
echo ================================================
echo Needs: Node.js 20+ and Android Studio installed.
echo.
call npm install
if errorlevel 1 goto fail
call node scripts/android/build-apk.mjs
if errorlevel 1 goto fail
echo.
echo Done. NahhasPlatform.apk is in the project folder.
pause
exit /b 0
:fail
echo.
echo Something failed. Send the message above.
pause
exit /b 1