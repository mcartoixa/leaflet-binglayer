#!/bin/bash
set -e

if [ -d .tmp ]; then rm -Rfd .tmp; fi
if [ -d node_modules ]; then rm -Rfd node_modules; fi
if [ -d tmp ]; then rm -Rfd tmp; fi

if [ -f build.log ]; then rm -f build.log; fi
