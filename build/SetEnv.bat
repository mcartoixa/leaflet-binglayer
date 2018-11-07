@ECHO OFF

:: Reset ERRORLEVEL
VERIFY OTHER 2>nul

SET _CLOC_VERSION=1.80



:: -------------------------------------------------------------------
:: Set environment variables
:: -------------------------------------------------------------------
::CALL :SetRubyPathHelper > nul 2>&1
::IF ERRORLEVEL 1 (
::    ECHO [92mCould not find Ruby 2.4[0m
::) ELSE (
::    ECHO SET RUBYPATH=%RUBYPATH%
::    CALL "%RUBYPATH%bin\setrbvars.cmd" > nul
::)

CALL :SetNodeJsHomePathHelper > nul 2>&1
IF ERRORLEVEL 1 GOTO ERROR_NODEJS
ECHO SET NodeJsHomePath=%NodeJsHomePath%

CALL :SetGitHomePathHelper > nul 2>&1
IF ERRORLEVEL 1 GOTO ERROR_GIT
ECHO SET GitHomePath=%GitHomePath%

IF NOT EXIST "%CD%\.tmp\cloc.exe" (
    IF NOT EXIST .tmp MKDIR .tmp
    powershell.exe -NoLogo -NonInteractive -ExecutionPolicy ByPass -Command "& { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest https://github.com/AlDanial/cloc/releases/download/v$Env:_CLOC_VERSION/cloc-$Env:_CLOC_VERSION.exe -OutFile .tmp\cloc.exe; }"
    IF ERRORLEVEL 1 GOTO ERROR_CLOC
)

CALL :SetLocalEnvHelper 2>nul

SET PATH=%CD%\node_modules\.bin;%NodeJsHomePath%;%APPDATA%\npm;%GitHomePath%\bin;%PATH%
GOTO END



:SetLocalEnvHelper
IF EXIST .env (
    ECHO.
    FOR /F "eol=# tokens=1* delims==" %%i IN (.env) DO (
        SET "%%i=%%j"
        ECHO SET %%i=%%j
    )
)
EXIT /B 0



:SetRubyPathHelper
SET RUBYPATH=
FOR /F "tokens=1,2*" %%i in ('REG QUERY HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Uninstall\RubyInstaller-2.4-x64-mingw32_is1 /V InstallLocation') DO (
    IF "%%i"=="InstallLocation" (
        SET "RUBYPATH=%%k"
    )
)
IF "%RUBYPATH%"=="" EXIT /B 1
EXIT /B 0



:SetNodeJsHomePathHelper
SET NodeJsHomePath=
FOR /F "tokens=1,2*" %%i in ('REG QUERY HKEY_CURRENT_USER\Software\Node.js /V InstallPath') DO (
    IF "%%i"=="InstallPath" (
        SET "NodeJsHomePath=%%k"
    )
)
IF "%NodeJsHomePath%"=="" (
    FOR /F "tokens=1,2*" %%i in ('REG QUERY HKEY_LOCAL_MACHINE\SOFTWARE\Node.js /V InstallPath') DO (
        IF "%%i"=="InstallPath" (
            SET "NodeJsHomePath=%%k"
        )
    )
)
IF "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
    IF "%NodeJsHomePath%"=="" (
        FOR /F "tokens=1,2*" %%i in ('REG QUERY HKEY_CURRENT_USER\Software\Wow6432Node\Node.js /V InstallPath') DO (
            IF "%%i"=="InstallPath" (
                SET "NodeJsHomePath=%%k"
            )
        )
    )
    IF "%NodeJsHomePath%"=="" (
        FOR /F "tokens=1,2*" %%i in ('REG QUERY HKEY_LOCAL_MACHINE\SOFTWARE\Wow6432Node\Node.js /V InstallPath') DO (
            IF "%%i"=="InstallPath" (
                SET "NodeJsHomePath=%%k"
            )
        )
    )
)
IF "%NodeJsHomePath%"=="" EXIT /B 1
EXIT /B 0



:SetGitHomePathHelper
SET GitHomePath=
FOR /F "tokens=1,2*" %%i in ('REG QUERY HKEY_CURRENT_USER\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Git_is1 /V InstallLocation') DO (
    IF "%%i"=="InstallLocation" (
        SET "GitHomePath=%%k"
    )
)
IF "%GitHomePath%"=="" (
    FOR /F "tokens=1,2*" %%i in ('REG QUERY HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Git_is1 /V InstallLocation') DO (
        IF "%%i"=="InstallLocation" (
            SET "GitHomePath=%%k"
        )
    )
)
IF "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
    IF "%GitHomePath%"=="" (
        FOR /F "tokens=1,2*" %%i in ('REG QUERY HKEY_CURRENT_USER\SOFTWARE\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\Git_is1 /V InstallLocation') DO (
            IF "%%i"=="InstallLocation" (
                SET "GitHomePath=%%k"
            )
        )
    )
    IF "%GitHomePath%"=="" (
        FOR /F "tokens=1,2*" %%i in ('REG QUERY HKEY_LOCAL_MACHINE\SOFTWARE\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\Git_is1 /V InstallLocation') DO (
            IF "%%i"=="InstallLocation" (
                SET "GitHomePath=%%k"
            )
        )
    )
)
IF "%GitHomePath%"=="" EXIT /B 1
EXIT /B 0



:ERROR_NODEJS
ECHO [31mCould not find node.js[0m
GOTO END

:ERROR_GIT
ECHO [31mCould not find Git[0m
GOTO END



:END