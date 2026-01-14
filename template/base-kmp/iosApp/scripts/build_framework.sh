#!/bin/sh

set -euo pipefail

if [ "YES" = "${OVERRIDE_KOTLIN_BUILD_IDE_SUPPORTED:-NO}" ]; then
    echo "Skipping Gradle build task invocation due to OVERRIDE_KOTLIN_BUILD_IDE_SUPPORTED environment variable set to \"YES\""
    exit 0
fi

PROJECT_DIR="$SRCROOT"
ROOT_DIR="$PROJECT_DIR/.."
FRAMEWORK_NAME="__FRAMEWORK_NAME__"

TARGET_BUILD_DIR="${TARGET_BUILD_DIR:?TARGET_BUILD_DIR not set}"

SDK_NAME_VALUE="${SDK_NAME:-}"
CONFIGURATION_NAME="${CONFIGURATION:-Debug}"
CONFIGURATION_LOWER="$(printf '%s' "$CONFIGURATION_NAME" | tr '[:upper:]' '[:lower:]')"

if echo "$SDK_NAME_VALUE" | grep -qi "simulator"; then
    KOTLIN_TARGET="iosSimulatorArm64"
else
    KOTLIN_TARGET="iosArm64"
fi

if [ "$CONFIGURATION_NAME" = "Release" ]; then
    if [ "$KOTLIN_TARGET" = "iosSimulatorArm64" ]; then
        TASK=":library:linkReleaseFrameworkIosSimulatorArm64"
    else
        TASK=":library:linkReleaseFrameworkIosArm64"
    fi
else
    if [ "$KOTLIN_TARGET" = "iosSimulatorArm64" ]; then
        TASK=":library:linkDebugFrameworkIosSimulatorArm64"
    else
        TASK=":library:linkDebugFrameworkIosArm64"
    fi
fi

echo "[KMP] Building framework via Gradle task: $TASK"
(cd "$ROOT_DIR" && ./gradlew "$TASK")

SRC_FRAMEWORK="$ROOT_DIR/library/build/bin/$KOTLIN_TARGET/${CONFIGURATION_LOWER}Framework/$FRAMEWORK_NAME.framework"
if [ ! -d "$SRC_FRAMEWORK" ]; then
    echo "[KMP] Framework not found at: $SRC_FRAMEWORK"
    exit 1
fi

DEST_DIR="$TARGET_BUILD_DIR/$FRAMEWORK_NAME.framework"
rm -rf "$DEST_DIR"
cp -R "$SRC_FRAMEWORK" "$DEST_DIR"

echo "[KMP] Framework ready: $DEST_DIR"
