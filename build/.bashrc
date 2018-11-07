#!/bin/bash

_CLOC_VERSION=1.80



if [ -f ~/.bashrc ]; then
    . ~/.bashrc;
fi

if node --version >/dev/null; then
    export NodeJsHomePath=$(dirname "$(which node)")
fi
if git --version >/dev/null; then
    export GitHomePath=$(dirname "$(which git)")
fi

if [ ! -d .tmp ]; then mkdir .tmp; fi
if [ ! -f $(pwd)/.tmp/cloc.pl ]; then
    wget -nv --show-progress -O .tmp/cloc.pl https://github.com/AlDanial/cloc/releases/download/v$_CLOC_VERSION/cloc-$_CLOC_VERSION.pl
fi

if [ -f ./.env ]; then
    # xargs does not support the -d option on BSD (MacOS X)
    export $(grep -a -v -e '^#' -e '^[[:space:]]*$' .env | tr '\n' '\0' | xargs -0 )
    grep -a -v -e '^#' -e '^[[:space:]]*$' .env | tr '\n' '\0' | xargs -0 printf "\$%s\n"
    echo
fi

echo \$NodeJsHomePath=$NodeJsHomePath
echo \$GitHomePath=$GitHomePath
echo
