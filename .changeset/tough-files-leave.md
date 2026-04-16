---
"@uploadthing/expo": patch
---

Fix URL construction - Previously the code checked if window.location is defined, which threw an error because window did not exist, this caused it to fallback to the default URL without checking the env variable The new code will check if the env variable FIRST and use it if it exists, then check safely for the window and then for the debuggerHost
