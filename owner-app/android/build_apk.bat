@echo off
set "JAVA_HOME=C:\Program Files\Java\jdk-23"
set "ANDROID_HOME=C:\Users\Vikas_yadav\AppData\Local\Android\sdk"
echo Using JAVA_HOME: %JAVA_HOME%
echo Using ANDROID_HOME: %ANDROID_HOME%
call gradlew.bat assembleDebug
