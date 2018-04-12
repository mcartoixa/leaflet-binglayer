@ECHO OFF

:: Reset ERRORLEVEL
VERIFY OTHER 2>nul
SETLOCAL ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION
IF ERRORLEVEL 1 GOTO ERROR_EXT

SET NO_PAUSE=0
SET TARGET=build
SET VERBOSITY=notice
GOTO ARGS



:: -------------------------------------------------------------------
:: Builds the project
:: -------------------------------------------------------------------
:BUILD
IF "%TARGET%"=="clean" (
    ::Yeah, really: https://github.com/isaacs/npm/issues/3697
    CALL rimraf.cmd node_modules
    CALL rimraf.cmd tmp
) ELSE (
    ECHO.
    CALL npm.cmd install --no-package-lock --no-shrinkwrap --loglevel info --cache .tmp\npm-cache
    IF ERRORLEVEL 1 GOTO END_ERROR
    ECHO.
    CALL npm.cmd run-script %TARGET% --loglevel %VERBOSITY%
    IF ERRORLEVEL 1 GOTO END_ERROR
)

GOTO END



:: -------------------------------------------------------------------
:: Parse command line argument values
:: Note: Currently, last one on the command line wins (ex: /rebuild /clean == /clean)
:: -------------------------------------------------------------------
:ARGS
IF "%PROCESSOR_ARCHITECTURE%"=="x86" (
    "C:\Windows\Sysnative\cmd.exe" /C "%0 %*"

    IF ERRORLEVEL 1 EXIT /B 1
    EXIT /B 0
)
::IF NOT "x%~5"=="x" GOTO ERROR_USAGE

:ARGS_PARSE
IF /I "%~1"=="/clean"      SET TARGET=clean& SHIFT & GOTO ARGS_PARSE
IF /I "%~1"=="/build"      SET TARGET=build& SHIFT & GOTO ARGS_PARSE
IF /I "%~1"=="/release"    SET TARGET=release& SHIFT & GOTO ARGS_PARSE
IF /I "%~1"=="/debug"      SET TARGET=debug& SHIFT & GOTO ARGS_PARSE
IF /I "%~1"=="/test"       SET TARGET=test& SHIFT & GOTO ARGS_PARSE
IF /I "%~1"=="/log"        SET VERBOSITY=verbose& SHIFT & GOTO ARGS_PARSE
IF /I "%~1"=="/NoPause"    SET NO_PAUSE=1& SHIFT & GOTO ARGS_PARSE
IF /I "%~1"=="/?"          GOTO ERROR_USAGE
IF    "%~1" EQU ""         GOTO ARGS_DONE
ECHO Unknown command-line switch: %~1
GOTO ERROR_USAGE

:ARGS_DONE



:: -------------------------------------------------------------------
:: Set environment variables
:: -------------------------------------------------------------------
:SETENV
CALL bin\SetEnv.bat
IF ERRORLEVEL 1 GOTO END_ERROR
GOTO BUILD


:: -------------------------------------------------------------------
:: Errors
:: -------------------------------------------------------------------
:ERROR_EXT
ECHO [31mCould not activate command extensions[0m
GOTO END_ERROR

:ERROR_USAGE
GOTO END_ERROR



:: -------------------------------------------------------------------
:: End
:: -------------------------------------------------------------------
:END_ERROR
ECHO.
ECHO [41m                                                                                [0m
ECHO [41;1mThe build failed                                                                [0m
ECHO [41m                                                                                [0m

:END
@IF NOT "%NO_PAUSE%"=="1" PAUSE
ENDLOCAL
