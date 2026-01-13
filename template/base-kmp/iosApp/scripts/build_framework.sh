#!/bin/sh

set -euo pipefail

PROJECT_DIR="$SRCROOT"
ROOT_DIR="$PROJECT_DIR/.."
FRAMEWORK_NAME="__FRAMEWORK_NAME__"

TARGET_BUILD_DIR="${TARGET_BUILD_DIR:?TARGET_BUILD_DIR not set}"
FRAMEWORKS_FOLDER_PATH="${FRAMEWORKS_FOLDER_PATH:?FRAMEWORKS_FOLDER_PATH not set}"

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

DEST_DIR="$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH/$FRAMEWORK_NAME.framework"
DEST_PARENT_DIR="$(dirname "$DEST_DIR")"
mkdir -p "$DEST_PARENT_DIR"
rm -rf "$DEST_DIR"
cp -R "$SRC_FRAMEWORK" "$DEST_DIR"

if [ "${CODE_SIGNING_ALLOWED:-NO}" = "YES" ] && [ -n "${EXPANDED_CODE_SIGN_IDENTITY:-}" ]; then
    if ! echo "$SDK_NAME_VALUE" | grep -qi "simulator"; then
        echo "[KMP] Codesigning framework: $FRAMEWORK_NAME"
        /usr/bin/codesign --force --sign "$EXPANDED_CODE_SIGN_IDENTITY" --preserve-metadata=identifier,entitlements,flags --timestamp=none "$DEST_DIR"
    fi
fi

echo "[KMP] Framework ready: $DEST_DIR"
