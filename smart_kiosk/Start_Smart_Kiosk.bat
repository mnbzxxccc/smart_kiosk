@echo off
color 0b
title تشغيل البوابة الذكية (Valdis Smart Kiosk)

echo =========================================================
echo      مرحباً بك في نظام البوابة الذكية - كلية صدر العراق التقني
echo =========================================================
echo.
echo [1/3] جاري التحقق من الحزم والمتطلبات البرمجية لضمان عمل النظام...
echo قد يستغرق هذا بضع دقائق في المرة الأولى...

:: التحقق من وجود بايثون
python --version >nul 2>&1
if %errorlevel% neq 0 (
    py --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] لم يتم العثور على Python مثبت على هذا الجهاز!
        echo يرجى تثبيت Python 3.10 أو أعلى وإضافته للمسار (PATH).
        pause
        exit
    ) else (
        set PY_CMD=py
    )
) else (
    set PY_CMD=python
)

%PY_CMD% -m pip install -r requirements.txt
echo.

echo [2/3] جاري تشغيل سيرفر الذكاء الاصطناعي...
start "Valdis AI Server (Do Not Close)" %PY_CMD% server.py
echo.

echo [3/3] انتظر قليلاً ريثما يكتمل إعداد المحرك وفتح المتصفح...
timeout /t 6 >nul
start http://127.0.0.1:5000/
echo.

echo =========================================================
echo  تم إطلاق النظام بنجاح! 
echo  ملاحظة هامة: لا تقم بإغلاق النافذة السوداء الأخرى أثناء الاستخدام.
echo =========================================================
pause
