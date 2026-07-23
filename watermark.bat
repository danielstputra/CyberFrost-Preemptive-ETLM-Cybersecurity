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
set COUNT=0
set BACKUP_DIR=watermark-backup_%YEAR%%MONTH%%DAY%

echo =============================================
echo   CyberFrost Watermark Tool
echo   Adding developer watermark to source files
echo =============================================
echo.
echo Backup folder: %BACKUP_DIR%
echo.

for /r %%F in (
    *.ts *.tsx *.js *.jsx *.mjs *.cjs *.mts *.cts
    *.css *.scss *.sass *.less
    *.html *.htm *.xml *.vue *.svelte *.md *.svg
    *.json *.prettierrc *.editorconfig
    *.py *.yml *.yaml *.sh *.bash *.zsh *.ps1
    *.java *.kt *.go *.php *.rb *.rs *.swift *.pl
    *.sql *.lua
    *.gradle
    *.bat *.cmd
    *.env *.gitignore *.npmrc *.prisma *.tf
    *.txt *.graphql *.gql *.proto
) do (
    setlocal enabledelayedexpansion
    set REL=%%F
    set REL=!REL:%CD%\=!
    set DESC=Source file
    set EXT=%%~xF

    rem Skip node_modules, .git, dll
    echo !REL! | findstr /I "\node_modules\" >nul && goto NXT
    echo !REL! | findstr /I "\.git\" >nul && goto NXT
    echo !REL! | findstr /I "\.next\" >nul && goto NXT
    echo !REL! | findstr /I "\out\" >nul && goto NXT
    echo !REL! | findstr /I "\dist\" >nul && goto NXT
    echo !REL! | findstr /I "\android\" >nul && goto NXT
    echo !REL! | findstr /I "\coverage\" >nul && goto NXT
    echo !REL! | findstr /I "\pnpm-store\" >nul && goto NXT
    echo !REL! | findstr /I "\\.vercel\" >nul && goto NXT

    rem Cek watermark sudah ada
    findstr /M /C:"REMOVING OR MODIFYING THE DEVELOPER" "%%F" >nul 2>&1
    if !errorlevel! equ 0 goto NXT

    rem Deteksi deskripsi dari folder
    echo !REL! | findstr /I "\routes\" >nul && set DESC=Route handler
    echo !REL! | findstr /I "\services\" >nul && set DESC=Business logic service
    echo !REL! | findstr /I "\models\" >nul && set DESC=Database model
    echo !REL! | findstr /I "\middleware\" >nul && set DESC=Middleware
    echo !REL! | findstr /I "\hooks\" >nul && set DESC=React hook
    echo !REL! | findstr /I "\components\" >nul && set DESC=React component
    echo !REL! | findstr /I "\store\" >nul && set DESC=State store
    echo !REL! | findstr /I "\providers\" >nul && set DESC=React provider
    echo !REL! | findstr /I "\config\" >nul && set DESC=Configuration
    echo !REL! | findstr /I "\utils\" >nul && set DESC=Utility function
    echo !REL! | findstr /I "\types\" >nul && set DESC=TypeScript definition
    echo !REL! | findstr /I "\lib\" >nul && set DESC=Library utility
    echo !REL! | findstr /I "\app\" >nul && set DESC=Next.js app page
    echo !REL! | findstr /I "\pages\" >nul && set DESC=Page component
    echo !REL! | findstr /I "\queue\" >nul && set DESC=Message queue
    echo !REL! | findstr /I "\jobs\" >nul && set DESC=Cron job / scheduled task

    rem Buat watermark + konten asli
    call :ADD_WATERMARK "%%F" "!REL!" "!DESC!" "!EXT!"
    if !errorlevel! equ 0 set /a COUNT+=1

:NXT
    endlocal
)

echo.
echo =============================================
echo   Selesai! %COUNT% files watermarked.
echo =============================================
pause
exit /b

rem ===== SUB: ADD_WATERMARK =====
:ADD_WATERMARK
set FILE=%~1
set REL=%~2
set DESC=%~3
set EXT=%~4

rem Buat folder backup + copy file asli
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%" >nul 2>&1
set BACKUP_DEST=%BACKUP_DIR%\%REL:\=\%
if not exist "%BACKUP_DEST%" (
    copy "%~1" "%BACKUP_DEST%.bak" >nul 2>&1
)

if /I "%EXT%"==".html" goto :STYLE_HTML
if /I "%EXT%"==".htm" goto :STYLE_HTML
if /I "%EXT%"==".xml" goto :STYLE_HTML
if /I "%EXT%"==".vue" goto :STYLE_HTML
if /I "%EXT%"==".svelte" goto :STYLE_HTML
if /I "%EXT%"==".md" goto :STYLE_HTML
if /I "%EXT%"==".py" goto :STYLE_PYTHON
if /I "%EXT%"==".yml" goto :STYLE_HASH
if /I "%EXT%"==".yaml" goto :STYLE_HASH
if /I "%EXT%"==".sh" goto :STYLE_HASH
if /I "%EXT%"==".bash" goto :STYLE_HASH
if /I "%EXT%"==".zsh" goto :STYLE_HASH
if /I "%EXT%"==".ps1" goto :STYLE_HASH
if /I "%EXT%"==".env" goto :STYLE_HASH
if /I "%EXT%"==".gitignore" goto :STYLE_HASH
if /I "%EXT%"==".npmrc" goto :STYLE_HASH
if /I "%EXT%"==".prisma" goto :STYLE_HASH
if /I "%EXT%"==".tf" goto :STYLE_HASH
if /I "%EXT%"==".graphql" goto :STYLE_HASH
if /I "%EXT%"==".gql" goto :STYLE_HASH
if /I "%EXT%"==".sql" goto :STYLE_SQL
if /I "%EXT%"==".lua" goto :STYLE_SQL
if /I "%EXT%"==".json" goto :STYLE_JSON
if /I "%EXT%"==".prettierrc" goto :STYLE_JSON
if /I "%EXT%"==".editorconfig" goto :STYLE_JSON
if /I "%EXT%"==".gradle" goto :STYLE_JAVA
if /I "%EXT%"==".proto" goto :STYLE_JAVA
if /I "%EXT%"==".bat" goto :STYLE_BAT
if /I "%EXT%"==".cmd" goto :STYLE_BAT
goto :STYLE_BLOCK

:STYLE_BLOCK
type NUL > "%FILE%.tmp"
>> "%FILE%.tmp" echo /*=============================================================================
>> "%FILE%.tmp" echo  * %APP_NAME% - %APP_DESC%
>> "%FILE%.tmp" echo  * =============================================================================
>> "%FILE%.tmp" echo  * Project      : %PROJECT%
>> "%FILE%.tmp" echo  * Developer    : %DEV_NAME% ^(%DEV_EMAIL%^)
>> "%FILE%.tmp" echo  * Website      : %URL%
>> "%FILE%.tmp" echo  * License      : %ORG%
>> "%FILE%.tmp" echo  * File         : %FILE%
>> "%FILE%.tmp" echo  * Description  : %DESC%
>> "%FILE%.tmp" echo  * Last Updated : %DATE_ID%
>> "%FILE%.tmp" echo  *
>> "%FILE%.tmp" echo  * IMPORTANT NOTE:
>> "%FILE%.tmp" echo  * Modification of this code is permitted for development purposes only.
>> "%FILE%.tmp" echo  * REMOVING OR MODIFYING THE DEVELOPER NAME IS STRICTLY PROHIBITED.
>> "%FILE%.tmp" echo  *
>> "%FILE%.tmp" echo  * LEGAL WARNING:
>> "%FILE%.tmp" echo  * Unauthorized distribution or modification of authorship information
>> "%FILE%.tmp" echo  * is subject to legal action under Indonesian Law:
>> "%FILE%.tmp" echo  * - UU No. 28 Tahun 2014 tentang Hak Cipta.
>> "%FILE%.tmp" echo  * - UU No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik ^(UU ITE^).
>> "%FILE%.tmp" echo  *============================================================================*/
>> "%FILE%.tmp" echo.
type "%FILE%" >> "%FILE%.tmp"
move /Y "%FILE%.tmp" "%FILE%" >nul
echo     ADD %REL%  ^({%EXT%}^)
exit /b 0

:STYLE_HTML
type NUL > "%FILE%.tmp"
>> "%FILE%.tmp" echo ^<!--=============================================================================
>> "%FILE%.tmp" echo   %APP_NAME% - %APP_DESC%
>> "%FILE%.tmp" echo   =============================================================================
>> "%FILE%.tmp" echo   Project      : %PROJECT%
>> "%FILE%.tmp" echo   Developer    : %DEV_NAME% ^(%DEV_EMAIL%^)
>> "%FILE%.tmp" echo   Website      : %URL%
>> "%FILE%.tmp" echo   License      : %ORG%
>> "%FILE%.tmp" echo   File         : %FILE%
>> "%FILE%.tmp" echo   Description  : %DESC%
>> "%FILE%.tmp" echo   Last Updated : %DATE_ID%
>> "%FILE%.tmp" echo.
>> "%FILE%.tmp" echo   IMPORTANT NOTE:
>> "%FILE%.tmp" echo   Modification of this code is permitted for development purposes only.
>> "%FILE%.tmp" echo   REMOVING OR MODIFYING THE DEVELOPER NAME IS STRICTLY PROHIBITED.
>> "%FILE%.tmp" echo.
>> "%FILE%.tmp" echo   LEGAL WARNING:
>> "%FILE%.tmp" echo   Unauthorized distribution or modification of authorship information
>> "%FILE%.tmp" echo   is subject to legal action under Indonesian Law:
>> "%FILE%.tmp" echo   - UU No. 28 Tahun 2014 tentang Hak Cipta.
>> "%FILE%.tmp" echo   - UU No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik ^(UU ITE^).
>> "%FILE%.tmp" echo  ============================================================================--^>
>> "%FILE%.tmp" echo.
type "%FILE%" >> "%FILE%.tmp"
move /Y "%FILE%.tmp" "%FILE%" >nul
echo     ADD %REL%  ^({%EXT%}^)
exit /b 0

:STYLE_PYTHON
type NUL > "%FILE%.tmp"
>> "%FILE%.tmp" echo # =============================================================================
>> "%FILE%.tmp" echo # %APP_NAME% - %APP_DESC%
>> "%FILE%.tmp" echo # =============================================================================
>> "%FILE%.tmp" echo # Project      : %PROJECT%
>> "%FILE%.tmp" echo # Developer    : %DEV_NAME% ^(%DEV_EMAIL%^)
>> "%FILE%.tmp" echo # Website      : %URL%
>> "%FILE%.tmp" echo # License      : %ORG%
>> "%FILE%.tmp" echo # File         : %FILE%
>> "%FILE%.tmp" echo # Description  : %DESC%
>> "%FILE%.tmp" echo # Last Updated : %DATE_ID%
>> "%FILE%.tmp" echo #
>> "%FILE%.tmp" echo # IMPORTANT NOTE:
>> "%FILE%.tmp" echo # Modification of this code is permitted for development purposes only.
>> "%FILE%.tmp" echo # REMOVING OR MODIFYING THE DEVELOPER NAME IS STRICTLY PROHIBITED.
>> "%FILE%.tmp" echo #
>> "%FILE%.tmp" echo # LEGAL WARNING:
>> "%FILE%.tmp" echo # Unauthorized distribution or modification of authorship information
>> "%FILE%.tmp" echo # is subject to legal action under Indonesian Law:
>> "%FILE%.tmp" echo # - UU No. 28 Tahun 2014 tentang Hak Cipta.
>> "%FILE%.tmp" echo # - UU No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik ^(UU ITE^).
>> "%FILE%.tmp" echo # =============================================================================
>> "%FILE%.tmp" echo.
type "%FILE%" >> "%FILE%.tmp"
move /Y "%FILE%.tmp" "%FILE%" >nul
echo     ADD %REL%  ^({%EXT%}^)
exit /b 0

:STYLE_HASH
type NUL > "%FILE%.tmp"
>> "%FILE%.tmp" echo # =============================================================================
>> "%FILE%.tmp" echo # %APP_NAME% - %APP_DESC%
>> "%FILE%.tmp" echo # =============================================================================
>> "%FILE%.tmp" echo # Project      : %PROJECT%
>> "%FILE%.tmp" echo # Developer    : %DEV_NAME% ^(%DEV_EMAIL%^)
>> "%FILE%.tmp" echo # Website      : %URL%
>> "%FILE%.tmp" echo # License      : %ORG%
>> "%FILE%.tmp" echo # File         : %FILE%
>> "%FILE%.tmp" echo # Description  : %DESC%
>> "%FILE%.tmp" echo # Last Updated : %DATE_ID%
>> "%FILE%.tmp" echo #
>> "%FILE%.tmp" echo # IMPORTANT NOTE:
>> "%FILE%.tmp" echo # Modification of this code is permitted for development purposes only.
>> "%FILE%.tmp" echo # REMOVING OR MODIFYING THE DEVELOPER NAME IS STRICTLY PROHIBITED.
>> "%FILE%.tmp" echo #
>> "%FILE%.tmp" echo # LEGAL WARNING:
>> "%FILE%.tmp" echo # Unauthorized distribution or modification of authorship information
>> "%FILE%.tmp" echo # is subject to legal action under Indonesian Law:
>> "%FILE%.tmp" echo # - UU No. 28 Tahun 2014 tentang Hak Cipta.
>> "%FILE%.tmp" echo # - UU No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik ^(UU ITE^).
>> "%FILE%.tmp" echo # =============================================================================
>> "%FILE%.tmp" echo.
type "%FILE%" >> "%FILE%.tmp"
move /Y "%FILE%.tmp" "%FILE%" >nul
echo     ADD %REL%  ^({%EXT%}^)
exit /b 0

:STYLE_JSON
type NUL > "%FILE%.tmp"
>> "%FILE%.tmp" echo // =============================================================================
>> "%FILE%.tmp" echo // %APP_NAME% - %APP_DESC%
>> "%FILE%.tmp" echo // =============================================================================
>> "%FILE%.tmp" echo // Project      : %PROJECT%
>> "%FILE%.tmp" echo // Developer    : %DEV_NAME% ^(%DEV_EMAIL%^)
>> "%FILE%.tmp" echo // Website      : %URL%
>> "%FILE%.tmp" echo // License      : %ORG%
>> "%FILE%.tmp" echo // File         : %FILE%
>> "%FILE%.tmp" echo // Description  : %DESC%
>> "%FILE%.tmp" echo // Last Updated : %DATE_ID%
>> "%FILE%.tmp" echo //
>> "%FILE%.tmp" echo // IMPORTANT NOTE:
>> "%FILE%.tmp" echo // Modification of this code is permitted for development purposes only.
>> "%FILE%.tmp" echo // REMOVING OR MODIFYING THE DEVELOPER NAME IS STRICTLY PROHIBITED.
>> "%FILE%.tmp" echo //
>> "%FILE%.tmp" echo // LEGAL WARNING:
>> "%FILE%.tmp" echo // Unauthorized distribution or modification of authorship information
>> "%FILE%.tmp" echo // is subject to legal action under Indonesian Law:
>> "%FILE%.tmp" echo // - UU No. 28 Tahun 2014 tentang Hak Cipta.
>> "%FILE%.tmp" echo // - UU No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik ^(UU ITE^).
>> "%FILE%.tmp" echo // =============================================================================
>> "%FILE%.tmp" echo.
type "%FILE%" >> "%FILE%.tmp"
move /Y "%FILE%.tmp" "%FILE%" >nul
echo     ADD %REL%  ^({%EXT%}^)
exit /b 0

:STYLE_SQL
type NUL > "%FILE%.tmp"
>> "%FILE%.tmp" echo -- =============================================================================
>> "%FILE%.tmp" echo -- %APP_NAME% - %APP_DESC%
>> "%FILE%.tmp" echo -- =============================================================================
>> "%FILE%.tmp" echo -- Project      : %PROJECT%
>> "%FILE%.tmp" echo -- Developer    : %DEV_NAME% ^(%DEV_EMAIL%^)
>> "%FILE%.tmp" echo -- Website      : %URL%
>> "%FILE%.tmp" echo -- License      : %ORG%
>> "%FILE%.tmp" echo -- File         : %FILE%
>> "%FILE%.tmp" echo -- Description  : %DESC%
>> "%FILE%.tmp" echo -- Last Updated : %DATE_ID%
>> "%FILE%.tmp" echo --
>> "%FILE%.tmp" echo -- IMPORTANT NOTE:
>> "%FILE%.tmp" echo -- Modification of this code is permitted for development purposes only.
>> "%FILE%.tmp" echo -- REMOVING OR MODIFYING THE DEVELOPER NAME IS STRICTLY PROHIBITED.
>> "%FILE%.tmp" echo --
>> "%FILE%.tmp" echo -- LEGAL WARNING:
>> "%FILE%.tmp" echo -- Unauthorized distribution or modification of authorship information
>> "%FILE%.tmp" echo -- is subject to legal action under Indonesian Law:
>> "%FILE%.tmp" echo -- - UU No. 28 Tahun 2014 tentang Hak Cipta.
>> "%FILE%.tmp" echo -- - UU No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik ^(UU ITE^).
>> "%FILE%.tmp" echo -- =============================================================================
>> "%FILE%.tmp" echo.
type "%FILE%" >> "%FILE%.tmp"
move /Y "%FILE%.tmp" "%FILE%" >nul
echo     ADD %REL%  ^({%EXT%}^)
exit /b 0

:STYLE_JAVA
type NUL > "%FILE%.tmp"
>> "%FILE%.tmp" echo // =============================================================================
>> "%FILE%.tmp" echo // %APP_NAME% - %APP_DESC%
>> "%FILE%.tmp" echo // =============================================================================
>> "%FILE%.tmp" echo // Project      : %PROJECT%
>> "%FILE%.tmp" echo // Developer    : %DEV_NAME% ^(%DEV_EMAIL%^)
>> "%FILE%.tmp" echo // Website      : %URL%
>> "%FILE%.tmp" echo // License      : %ORG%
>> "%FILE%.tmp" echo // File         : %FILE%
>> "%FILE%.tmp" echo // Description  : %DESC%
>> "%FILE%.tmp" echo // Last Updated : %DATE_ID%
>> "%FILE%.tmp" echo //
>> "%FILE%.tmp" echo // IMPORTANT NOTE:
>> "%FILE%.tmp" echo // Modification of this code is permitted for development purposes only.
>> "%FILE%.tmp" echo // REMOVING OR MODIFYING THE DEVELOPER NAME IS STRICTLY PROHIBITED.
>> "%FILE%.tmp" echo //
>> "%FILE%.tmp" echo // LEGAL WARNING:
>> "%FILE%.tmp" echo // Unauthorized distribution or modification of authorship information
>> "%FILE%.tmp" echo // is subject to legal action under Indonesian Law:
>> "%FILE%.tmp" echo // - UU No. 28 Tahun 2014 tentang Hak Cipta.
>> "%FILE%.tmp" echo // - UU No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik ^(UU ITE^).
>> "%FILE%.tmp" echo // =============================================================================
>> "%FILE%.tmp" echo.
type "%FILE%" >> "%FILE%.tmp"
move /Y "%FILE%.tmp" "%FILE%" >nul
echo     ADD %REL%  ^({%EXT%}^)
exit /b 0

:STYLE_BAT
type NUL > "%FILE%.tmp"
>> "%FILE%.tmp" echo REM =============================================================================
>> "%FILE%.tmp" echo REM %APP_NAME% - %APP_DESC%
>> "%FILE%.tmp" echo REM =============================================================================
>> "%FILE%.tmp" echo REM Project      : %PROJECT%
>> "%FILE%.tmp" echo REM Developer    : %DEV_NAME% ^(%DEV_EMAIL%^)
>> "%FILE%.tmp" echo REM Website      : %URL%
>> "%FILE%.tmp" echo REM License      : %ORG%
>> "%FILE%.tmp" echo REM File         : %FILE%
>> "%FILE%.tmp" echo REM Description  : %DESC%
>> "%FILE%.tmp" echo REM Last Updated : %DATE_ID%
>> "%FILE%.tmp" echo REM
>> "%FILE%.tmp" echo REM IMPORTANT NOTE:
>> "%FILE%.tmp" echo REM Modification of this code is permitted for development purposes only.
>> "%FILE%.tmp" echo REM REMOVING OR MODIFYING THE DEVELOPER NAME IS STRICTLY PROHIBITED.
>> "%FILE%.tmp" echo REM
>> "%FILE%.tmp" echo REM LEGAL WARNING:
>> "%FILE%.tmp" echo REM Unauthorized distribution or modification of authorship information
>> "%FILE%.tmp" echo REM is subject to legal action under Indonesian Law:
>> "%FILE%.tmp" echo REM - UU No. 28 Tahun 2014 tentang Hak Cipta.
>> "%FILE%.tmp" echo REM - UU No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik ^(UU ITE^).
>> "%FILE%.tmp" echo REM =============================================================================
>> "%FILE%.tmp" echo.
type "%FILE%" >> "%FILE%.tmp"
move /Y "%FILE%.tmp" "%FILE%" >nul
echo     ADD %REL%  ^({%EXT%}^)
exit /b 0
