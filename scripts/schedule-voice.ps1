# Регистрирует ежедневную озвучку в Планировщике заданий Windows (от имени текущего пользователя, без пароля).
# Время 11:30 по Москве: квота Gemini сбрасывается в полночь по тихоокеанскому времени —
# это 10:00 МСК летом и 11:00 МСК после перевода часов в США (1 ноября).
# Если в это время компьютер выключен, задача запустится при следующем входе (StartWhenAvailable).
#
#   powershell -ExecutionPolicy Bypass -File scripts/schedule-voice.ps1            — включить
#   powershell -ExecutionPolicy Bypass -File scripts/schedule-voice.ps1 -Remove    — выключить
param([switch]$Remove)

$name = 'TalkingPictures-DailyVoice'
if ($Remove) {
  Unregister-ScheduledTask -TaskName $name -Confirm:$false
  Write-Output "Задача ${name} удалена"
  return
}

$root = Split-Path -Parent $PSScriptRoot
$node = (Get-Command node).Source
# Без окна консоли (conhost --headless): 22.10 окно закрыли посреди проверки, и запуск оборвался (код 0xC000013A).
$action = New-ScheduledTaskAction -Execute 'conhost.exe' -Argument "--headless `"$node`" `"$root\scripts\daily-voice.mjs`"" -WorkingDirectory $root
# Gemini работает только с VPN: daily-voice.mjs ждёт API 15 минут и, не дождавшись, выходит; поэтому ещё три попытки позже.
# Если сегодня полный запуск уже был, повторные срабатывания сразу завершаются.
$trigger = '11:30', '14:00', '17:00', '20:00' | ForEach-Object { New-ScheduledTaskTrigger -Daily -At $_ }
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -WakeToRun -ExecutionTimeLimit (New-TimeSpan -Hours 2) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger -Settings $settings -Description 'Говорящие картинки: дозвучка фраз Gemini TTS + проверка расшифровкой' -Force | Out-Null
Write-Output "Задача ${name}: каждый день в 11:30 (повторы 14:00, 17:00, 20:00), лог — voice\logs\"
