#!/bin/bash

source build/.bashrc


_TARGET=build
_VERBOSITY=notice

usage() {
    cat <<EOF

Usage: $0 [TARGET] [OPTION]
    TARGET          analysis|build|clean|compile|debug|package|rebuild|test
    OPTION
        --log       Creates an extensive build.log file
        --help      Shows this help
EOF
}

error() {
    echo
    echo -e "\033[0;31m${1}\033[0m ${2}"
}

failed() {
    echo
    echo -e "\033[41m                                                                                \033[0m"
    echo -e "\033[1;41mThe build failed                                                                \033[0m"
    echo -e "\033[41m                                                                                \033[0m"

    exit 1
}

# Parse command line argument values
# Note: Currently, last one on the command line wins (ex: rebuild clean == clean)
for i in "$@"; do
    case $1 in
        analysis|build|clean|compile|debug|package|rebuild|test) _TARGET=$1 ;;
        -l|--log) _VERBOSITY=verbose ;;
        --help) usage; exit 0 ;;
        *) error "Unknown option" "$1"; usage; failed ;;
    esac
    shift
done

echo
npm install --no-package-lock --no-shrinkwrap --loglevel info --cache .tmp/npm-cache
if [ $? -ne 0 ]; then
    failed
fi

echo
npm run-script $_TARGET --loglevel $_VERBOSITY
if [ $? -ne 0 ]; then
    failed
fi
