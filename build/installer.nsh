!macro customInstall
  ; Register CognixURL protocol
  WriteRegStr SHCTX "SOFTWARE\Classes\CognixURL" "" "Cognix URL"
  WriteRegStr SHCTX "SOFTWARE\Classes\CognixURL\DefaultIcon" "" "$INSTDIR\Cognix.exe,1"
  WriteRegStr SHCTX "SOFTWARE\Classes\CognixURL\shell\open\command" "" '"$INSTDIR\Cognix.exe" "%1"'
  WriteRegStr SHCTX "SOFTWARE\Classes\CognixURL\shell\open\FriendlyAppName" "" "Cognix"

  ; Register CognixHTML for .htm/.html
  WriteRegStr SHCTX "SOFTWARE\Classes\CognixHTML" "" "Cognix HTML Document"
  WriteRegStr SHCTX "SOFTWARE\Classes\CognixHTML\DefaultIcon" "" "$INSTDIR\Cognix.exe,1"
  WriteRegStr SHCTX "SOFTWARE\Classes\CognixHTML\shell\open\command" "" '"$INSTDIR\Cognix.exe" "%1"'

  ; Register as browser in Default Programs
  WriteRegStr SHCTX "SOFTWARE\Cognix\Capabilities" "ApplicationName" "Cognix"
  WriteRegStr SHCTX "SOFTWARE\Cognix\Capabilities" "ApplicationDescription" "A custom Electron-based browser"
  WriteRegStr SHCTX "SOFTWARE\Cognix\Capabilities\UrlAssociations" "http" "CognixURL"
  WriteRegStr SHCTX "SOFTWARE\Cognix\Capabilities\UrlAssociations" "https" "CognixURL"
  WriteRegStr SHCTX "SOFTWARE\Cognix\Capabilities\FileAssociations" ".htm" "CognixHTML"
  WriteRegStr SHCTX "SOFTWARE\Cognix\Capabilities\FileAssociations" ".html" "CognixHTML"
  WriteRegStr SHCTX "SOFTWARE\RegisteredApplications" "Cognix" "Software\Cognix\Capabilities"
!macroend

!macro customUnInstall
  ; Remove registry entries
  DeleteRegKey SHCTX "SOFTWARE\Classes\CognixURL"
  DeleteRegKey SHCTX "SOFTWARE\Classes\CognixHTML"
  DeleteRegKey SHCTX "SOFTWARE\Cognix"
  DeleteRegValue SHCTX "SOFTWARE\RegisteredApplications" "Cognix"
!macroend