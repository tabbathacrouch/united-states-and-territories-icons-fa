#!/bin/sh
# Download the Census cartographic boundary file — the only geometry source.
set -eu

VINTAGE="${VINTAGE:-2025}"
NAME="cb_${VINTAGE}_us_state_500k"
MAPSHAPER="$(pwd)/node_modules/.bin/mapshaper"

mkdir -p pipeline/data
cd pipeline/data
[ -f "$NAME.zip" ] || curl -fO "https://www2.census.gov/geo/tiger/GENZ${VINTAGE}/shp/$NAME.zip"
unzip -o -q "$NAME.zip"
"$MAPSHAPER" -i "$NAME.shp" -info # expect 56 records
