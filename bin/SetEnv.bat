@ECHO OFF

:: -------------------------------------------------------------------
:: Set environment variables
:: -------------------------------------------------------------------
CALL :SetGitHomePathHelper > nul 2>&1
IF ERRORLEVEL 1 GOTO ERROR_GIT
ECHO SET GitHomePath=%GitHomePath%

CALL :SetNodeJsHomePathHelper > nul 2>&1
IF ERRORLEVEL 1 GOTO ERROR_NODEJS
ECHO SET NodeJsHomePath=%NodeJsHomePath%

SET PATH=%CD%\bin;%CD%\node_modules\.bin;%NodeJsHomePath%;%APPDATA%\npm;%GitHomePath%\bin;%PATH%
GOTO END



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