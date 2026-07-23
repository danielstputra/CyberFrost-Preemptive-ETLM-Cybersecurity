@echo off
title CyberFrost Watermark Tool
cd /d "%~dp0"

set APP_NAME=CyberFrost
set APP_DESC=Preemptive ETLM Cybersecurity Platform
set PROJECT=CyberFrost-Preemptive-ETLM-Cybersecurity
set DEV_NAME=Daniels Trysyahputra
set DEV_EMAIL=danielstputra@gmail.com
set URL=https://cyberfrost.vercel.app
set ORG=CyberFrost Security

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set DT=%%I
set YEAR=%DT:~0,4%
set MONTH=%DT:~4,2%
set DAY=%DT:~6,2%

if %MONTH%==01 set MONTH_NAME=Januari
if %MONTH%==02 set MONTH_NAME=Pebruari
if %MONTH%==03 set MONTH_NAME=Maret
if %MONTH%==04 set MONTH_NAME=April
if %MONTH%==05 set MONTH_NAME=Mei
if %MONTH%==06 set MONTH_NAME=Juni
if %MONTH%==07 set MONTH_NAME=Juli
if %MONTH%==08 set MONTH_NAME=Agustus
if %MONTH%==09 set MONTH_NAME=September
if %MONTH%==10 set MONTH_NAME=Oktober
if %MONTH%==11 set MONTH_NAME=Nopember
if %MONTH%==12 set MONTH_NAME=Desember

set DATE_ID=%DAY% %MONTH_NAME% %YEAR%

set SKIP_DIRS=node_modules .next out dist .git android .pnpm-store coverage __pycache__

echo =============================================
echo   CyberFrost Watermark Tool
echo   Adding developer watermark to source files
echo =============================================
echo.

set COUNT=0

for /r %%F in (*.ts *.tsx *.js *.jsx *.css *.html *.py *.yml *.yaml *.java *.kt *.sql *.sh *.xml *.json *.gradle *.prisma *.go *.php *.rb *.rs *.swift) do (
    setlocal enabledelayedexpansion
    set FILE=%%F
    set REL=%%F
    set REL=!REL:%CD%\=!
    set DESC=Source file

    :: Skip folders
    set SKIP=0
    for %%D in (%SKIP_DIRS%) do (
        echo !REL! | findstr /I /C:"\%%D\" >nul && set SKIP=1
        echo !REL! | findstr /I /C:"\%%D" >nul && if "%%D"=="!REL!" set SKIP=1
    )
    if !SKIP!==1 goto NEXT_FILE

    :: Cek watermark sudah ada
    findstr /M /C:"REMOVING OR MODIFYING THE DEVELOPER" "%%F" >nul 2>&1
    if !errorlevel! equ 0 (
        echo     OK  !REL!
        goto NEXT_FILE
    )

    :: Deteksi tipe file dari folder
    echo !REL! | findstr /I "\\routes\\" >nul && set DESC=Route handler
    echo !REL! | findstr /I "\\services\\" >nul && set DESC=Business logic service
    echo !REL! | findstr /I "\\models\\" >nul && set DESC=Database model
    echo !REL! | findstr /I "\\middleware\\" >nul && set DESC=Middleware
    echo !REL! | findstr /I "\\hooks\\" >nul && set DESC=React hook
    echo !REL! | findstr /I "\\components\\" >nul && set DESC=React component
    echo !REL! | findstr /I "\\store\\" >nul && set DESC=State store
    echo !REL! | findstr /I "\\providers\\" >nul && set DESC=React provider
    echo !REL! | findstr /I "\\config\\" >nul && set DESC=Configuration
    echo !REL! | findstr /I "\\utils\\" >nul && set DESC=Utility function
    echo !REL! | findstr /I "\\types\\" >nul && set DESC=TypeScript definition
    echo !REL! | findstr /I "\\lib\\" >nul && set DESC=Library utility
    echo !REL! | findstr /I "\\app\\" >nul && set DESC=Next.js app page
    echo !REL! | findstr /I "\\pages\\" >nul && set DESC=Page component
    echo !REL! | findstr /I "\\queue\\" >nul && set DESC=Message queue
    echo !REL! | findstr /I "\\jobs\\" >nul && set DESC=Cron job / scheduled task

    :: Tentukan comment style berdasarkan ekstensi
    set EXT=%%~xF
    set COMMENT_STYLE=BLOCK_SINGLE     :: /* */ untuk .ts .js .tsx .jsx .css .java .kt .swift .go .php .rs
    if /I "!EXT!"==".html" set COMMENT_STYLE=HTML
    if /I "!EXT!"==".py" set COMMENT_STYLE=PYTHON
    if /I "!EXT!"==".yml" set COMMENT_STYLE=HASH
    if /I "!EXT!"==".yaml" set COMMENT_STYLE=HASH
    if /I "!EXT!"==".sh" set COMMENT_STYLE=HASH
    if /I "!EXT!"==".sql" set COMMENT_STYLE=SQL
    if /I "!EXT!"==".prisma" set COMMENT_STYLE=HASH
    if /I "!EXT!"==".rb" set COMMENT_STYLE=HASH
    if /I "!EXT!"==".gradle" set COMMENT_STYLE=JAVA
    if /I "!EXT!"==".xml" set COMMENT_STYLE=HTML
    if /I "!EXT!"==".json" set COMMENT_STYLE=JSON

    :: Buat watermark + konten asli
    (
        if "!COMMENT_STYLE!"=="HTML" (
            echo ^<!--=============================================================================
            echo   %APP_NAME% - %APP_DESC%
            echo   =============================================================================
            echo   Project      : %PROJECT%
            echo   Developer    : %DEV_NAME% ^(%DEV_EMAIL%^)
            echo   Website      : %URL%
            echo   License      : %ORG%
            echo   File         : %%F
            echo   Description  : !DESC!
            echo   Last Updated : %DATE_ID%
            echo.
            echo   IMPORTANT NOTE:
            echo   Modification of this code is permitted for development purposes only.
            echo   REMOVING OR MODIFYING THE DEVELOPER NAME IS STRICTLY PROHIBITED.
            echo.
            echo   LEGAL WARNING:
            echo   Unauthorized distribution or modification of authorship information
            echo   is subject to legal action under Indonesian Law:
            echo   - UU No. 28 Tahun 2014 tentang Hak Cipta.
            echo   - UU No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik ^(UU ITE^).
            echo  ============================================================================--^>
        ) else if "!COMMENT_STYLE!"=="PYTHON" (
            echo # =============================================================================
            echo # %APP_NAME% - %APP_DESC%
            echo # =============================================================================
            echo # Project      : %PROJECT%
            echo # Developer    : %DEV_NAME% ^(%DEV_EMAIL%^)
            echo # Website      : %URL%
            echo # License      : %ORG%
            echo # File         : %%F
            echo # Description  : !DESC!
            echo # Last Updated : %DATE_ID%
            echo #
            echo # IMPORTANT NOTE:
            echo # Modification of this code is permitted for development purposes only.
            echo # REMOVING OR MODIFYING THE DEVELOPER NAME IS STRICTLY PROHIBITED.
            echo #
            echo # LEGAL WARNING:
            echo # Unauthorized distribution or modification of authorship information
            echo # is subject to legal action under Indonesian Law:
            echo # - UU No. 28 Tahun 2014 tentang Hak Cipta.
            echo # - UU No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik ^(UU ITE^).
            echo # =============================================================================
        ) else if "!COMMENT_STYLE!"=="HASH" (
            echo # =============================================================================
            echo # %APP_NAME% - %APP_DESC%
            echo # =============================================================================
            echo # Project      : %PROJECT%
            echo # Developer    : %DEV_NAME% ^(%DEV_EMAIL%^)
            echo # Website      : %URL%
            echo # License      : %ORG%
            echo # File         : %%F
            echo # Description  : !DESC!
            echo # Last Updated : %DATE_ID%
            echo #
            echo # IMPORTANT NOTE:
            echo # Modification of this code is permitted for development purposes only.
            echo # REMOVING OR MODIFYING THE DEVELOPER NAME IS STRICTLY PROHIBITED.
            echo #
            echo # LEGAL WARNING:
            echo # Unauthorized distribution or modification of authorship information
            echo # is subject to legal action under Indonesian Law:
            echo # - UU No. 28 Tahun 2014 tentang Hak Cipta.
            echo # - UU No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik ^(UU ITE^).
            echo # =============================================================================
        ) else if "!COMMENT_STYLE!"=="JSON" (
            echo // =============================================================================
            echo // %APP_NAME% - %APP_DESC%
            echo // =============================================================================
            echo // Project      : %PROJECT%
            echo // Developer    : %DEV_NAME% ^(%DEV_EMAIL%^)
            echo // Website      : %URL%
            echo // License      : %ORG%
            echo // File         : %%F
            echo // Description  : !DESC!
            echo // Last Updated : %DATE_ID%
            echo //
            echo // IMPORTANT NOTE:
            echo // Modification of this code is permitted for development purposes only.
            echo // REMOVING OR MODIFYING THE DEVELOPER NAME IS STRICTLY PROHIBITED.
            echo //
            echo // LEGAL WARNING:
            echo // Unauthorized distribution or modification of authorship information
            echo // is subject to legal action under Indonesian Law:
            echo // - UU No. 28 Tahun 2014 tentang Hak Cipta.
            echo // - UU No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik ^(UU ITE^).
            echo // =============================================================================
        ) else (
            echo /*=============================================================================
            echo  * %APP_NAME% - %APP_DESC%
            echo  * =============================================================================
            echo  * Project      : %PROJECT%
            echo  * Developer    : %DEV_NAME% ^(%DEV_EMAIL%^)
            echo  * Website      : %URL%
            echo  * License      : %ORG%
            echo  * File         : %%F
            echo  * Description  : !DESC!
            echo  * Last Updated : %DATE_ID%
            echo  *
            echo  * IMPORTANT NOTE:
            echo  * Modification of this code is permitted for development purposes only.
            echo  * REMOVING OR MODIFYING THE DEVELOPER NAME IS STRICTLY PROHIBITED.
            echo  *
            echo  * LEGAL WARNING:
            echo  * Unauthorized distribution or modification of authorship information
            echo  * is subject to legal action under Indonesian Law:
            echo  * - UU No. 28 Tahun 2014 tentang Hak Cipta.
            echo  * - UU No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik ^(UU ITE^).
            echo  *============================================================================*/
        )
        echo.
        type "%%F"
    ) > "%%F.tmp"

    move /Y "%%F.tmp" "%%F" >nul
    set /a COUNT+=1
    echo     ADD !REL!  ^(!COMMENT_STYLE!^)

:NEXT_FILE
    endlocal
)

echo.
echo =============================================
echo   Selesai! %COUNT% files watermarked.
echo =============================================
pause
