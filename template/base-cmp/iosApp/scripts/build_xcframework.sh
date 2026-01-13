#!/bin/sh

set -euo pipefail

PROJECT_DIR="$SRCROOT"
ROOT_DIR="$PROJECT_DIR/.."
FRAMEWORK_NAME="__FRAMEWORK_NAME__"

CONFIGURATION_NAME="${CONFIGURATION:-Debug}"
CONFIGURATION_LOWER="$(printf '%s' "$CONFIGURATION_NAME" | tr '[:upper:]' '[:lower:]')"

if [ "$CONFIGURATION_NAME" = "Release" ]; then
    TASK=":library:assemble${FRAMEWORK_NAME}ReleaseXCFramework"
else
    TASK=":library:assemble${FRAMEWORK_NAME}DebugXCFramework"
fi

echo "[KMP] Building XCFramework via Gradle task: $TASK"
(cd "$ROOT_DIR" && ./gradlew "$TASK")

SRC_XCFRAMEWORK="$ROOT_DIR/library/build/XCFrameworks/$CONFIGURATION_LOWER/$FRAMEWORK_NAME.xcframework"
if [ ! -d "$SRC_XCFRAMEWORK" ]; then
    SRC_XCFRAMEWORK="$ROOT_DIR/library/build/XCFrameworks/$CONFIGURATION_NAME/$FRAMEWORK_NAME.xcframework"
fi

if [ ! -d "$SRC_XCFRAMEWORK" ]; then
    echo "[KMP] XCFramework not found at:"
    echo "  $ROOT_DIR/library/build/XCFrameworks/$CONFIGURATION_LOWER/$FRAMEWORK_NAME.xcframework"
    echo "  $ROOT_DIR/library/build/XCFrameworks/$CONFIGURATION_NAME/$FRAMEWORK_NAME.xcframework"
    exit 1
fi

DEST_DIR="$PROJECT_DIR/Frameworks/$FRAMEWORK_NAME.xcframework"
rm -rf "$DEST_DIR"
cp -R "$SRC_XCFRAMEWORK" "$DEST_DIR"

echo "[KMP] XCFramework ready: $DEST_DIR"
