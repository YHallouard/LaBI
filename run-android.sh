#!/bin/bash

# Set JAVA_HOME to JDK 17
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH

# Set Android SDK location
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools:$PATH

echo "Using JAVA_HOME: $JAVA_HOME"
echo "Using ANDROID_HOME: $ANDROID_HOME"

# Run prebuild
npx expo prebuild 

# Make hardware features optional in AndroidManifest.xml
echo "Making hardware features optional..."
sed -i '' 's/<uses-permission android:name="android.permission.RECORD_AUDIO"\/>/<uses-permission android:name="android.permission.RECORD_AUDIO"\/>\n  <uses-feature android:name="android.hardware.microphone" android:required="false"\/>/' android/app/src/main/AndroidManifest.xml
sed -i '' 's/<\/manifest>/<uses-feature android:name="android.hardware.camera" android:required="false"\/>\n  <uses-feature android:name="android.hardware.faketouch" android:required="false"\/>\n  <uses-feature android:name="android.hardware.screen.portrait" android:required="false"\/>\n<\/manifest>/' android/app/src/main/AndroidManifest.xml
sed -i '' 's/android:screenOrientation="portrait"/android:screenOrientation="fullSensor"/' android/app/src/main/AndroidManifest.xml

# Run the app
npx expo run:android 