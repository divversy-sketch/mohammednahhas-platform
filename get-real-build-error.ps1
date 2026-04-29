Write-Host "جاري تشغيل build وحفظ الخطأ الكامل..."
npm run build *> build-error-full.txt
Write-Host ""
Write-Host "تم إنشاء الملف: $PWD\build-error-full.txt"
Write-Host ""
Write-Host "===== الأسطر المهمة ====="
Select-String -Path build-error-full.txt -Pattern "error|failed|expected|could not|unresolved|syntax|jsx|import|export" -CaseSensitive:$false
notepad build-error-full.txt
