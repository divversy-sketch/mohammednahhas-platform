@echo off
chcp 65001 >nul
echo ================================================
echo   بناء تطبيق منصة النحاس للأندرويد (APK)
echo ================================================
echo محتاج: Node.js 20+ و Android Studio متثبتين
echo.
call npm install
if errorlevel 1 goto :fail
call node scripts/android/build-apk.mjs
if errorlevel 1 goto :fail
echo.
echo الملف اتعمل باسم NahhasPlatform.apk جوه فولدر المشروع
pause
exit /b 0
:fail
echo.
echo حصل خطأ. ابعت الرسالة اللي فوق.
pause
exit /b 1
