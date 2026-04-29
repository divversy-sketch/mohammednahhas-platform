@echo off
chcp 65001 >nul
echo جاري تشغيل build وحفظ الخطأ الكامل...
echo لا تغلق النافذة...
echo.

npm run build > build-error-full.txt 2>&1

echo.
echo تم إنشاء الملف:
echo %cd%\build-error-full.txt
echo.
echo ===== أول أسطر فيها ERROR =====
findstr /n /i "error failed expected could not unresolved syntax jsx import export" build-error-full.txt
echo.
echo افتح الملف الآن...
notepad build-error-full.txt
pause
