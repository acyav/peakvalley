' PeakValley Silent Start
' Double-click this file = start services without any window
' Copy to Windows Startup folder for auto-start on boot

Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "E:\桌面\PeakValley"
WshShell.Run "cmd /c start.bat", 0, False
Set WshShell = Nothing
