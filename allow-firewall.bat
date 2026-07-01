@echo off
REM ==========================================================
REM  הגדרת רשת + פתיחת פורט 4500 עבור שיתוף הקבצים המקומי
REM  יש להריץ קובץ זה בלחיצה ימנית -> "הפעל כמנהל"
REM ==========================================================

echo מסמן את הרשת הנוכחית כ"פרטית"...
powershell -NoProfile -Command "Get-NetConnectionProfile | Where-Object { $_.NetworkCategory -eq 'Public' } | Set-NetConnectionProfile -NetworkCategory Private"

echo פותח את פורט 4500 בחומת האש...
netsh advfirewall firewall delete rule name="Local Share (port 4500)" >nul 2>&1
netsh advfirewall firewall add rule name="Local Share (port 4500)" dir=in action=allow protocol=TCP localport=4500 profile=private,domain

echo.
echo ============================================
echo  בוצע! הרשת סומנה כפרטית והפורט 4500 נפתח.
echo  כעת מחשבים אחרים ברשת יוכלו להתחבר.
echo ============================================
echo.
pause
