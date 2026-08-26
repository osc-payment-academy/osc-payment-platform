[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string]$CarpetaPartes = '\\bbvdfs\dfs\DW_Desarrollo\Oscar\PERSONAL\ISO8583\Partes_TCPHandler.log',

    [Parameter(Mandatory = $false)]
    [ValidateNotNullOrEmpty()]
    [string]$ArchivoRechazadas,

    [Parameter(Mandatory = $false)]
    [ValidateRange(1, 10000)]
    [int]$CantidadEsperada = 50,

    [Parameter(Mandatory = $false)]
    [ValidateRange(1, 1000000)]
    [int]$VolumenMinimoPico = 100,

    [string]$FechaAnalisis,
    [switch]$Reprocesar
)

$ErrorActionPreference = 'Stop'
$inicio = Get-Date
$lector = $null

function Add-Count {
    param([hashtable]$Tabla, [string]$Clave, [long]$Cantidad = 1)
    if ($Tabla.ContainsKey($Clave)) { $Tabla[$Clave] += $Cantidad }
    else { $Tabla[$Clave] = $Cantidad }
}

function Get-Count {
    param([hashtable]$Tabla, [string]$Clave)
    if ($Tabla.ContainsKey($Clave)) { return [long]$Tabla[$Clave] }
    return [long]0
}

function Read-KeyValueFile {
    param([string]$Ruta)
    $resultado = @{}
    foreach ($linea in (Get-Content -LiteralPath $Ruta)) {
        $pos = $linea.IndexOf('=')
        if ($pos -gt 0) {
            $clave = $linea.Substring(0, $pos).Trim([char]0xFEFF)
            $resultado[$clave] = $linea.Substring($pos + 1)
        }
    }
    return $resultado
}

function Get-TopCode {
    param([hashtable]$Tabla, [string]$Franja)
    $prefijo = $Franja + '|'
    $candidatos = foreach ($clave in $Tabla.Keys) {
        if ($clave.StartsWith($prefijo)) {
            [pscustomobject]@{ Codigo = $clave.Substring($prefijo.Length); Cantidad = [long]$Tabla[$clave] }
        }
    }
    $primero = $candidatos | Sort-Object Cantidad -Descending | Select-Object -First 1
    if ($null -eq $primero) { return [pscustomobject]@{ Codigo=''; Cantidad=0 } }
    return $primero
}

function Get-TimeFromDE7 {
    param([string]$Mensaje)

    try {
        if ($Mensaje.Length -lt 20 -or $Mensaje.Substring(0,4) -notmatch '^\d{4}$') { return $null }
        [int]$posicion = 4
        $bitmap = $Mensaje.Substring($posicion,16)
        if ($bitmap -notmatch '^[0-9A-Fa-f]{16}$') { return $null }
        $posicion += 16
        $presentes = New-Object 'bool[]' 65
        for ($i=0; $i -lt 16; $i++) {
            $nibble=[Convert]::ToInt32($bitmap.Substring($i,1),16)
            for($bit=0; $bit -lt 4; $bit++) {
                $campo=($i*4)+$bit+1
                $presentes[$campo]=(($nibble -band (8 -shr $bit)) -ne 0)
            }
        }
        if ($presentes[1]) { $posicion += 16 }

        $defs=@{2=@('LL',19);3=@('F',6);4=@('F',12);5=@('F',12);6=@('F',12);7=@('F',10)}
        for($campo=2; $campo -le 7; $campo++) {
            if (-not $presentes[$campo]) { continue }
            $tipo=$defs[$campo][0]; [int]$longitud=$defs[$campo][1]
            if ($tipo -eq 'LL') {
                if (($Mensaje.Length-$posicion) -lt 2) { return $null }
                $prefijo=$Mensaje.Substring($posicion,2)
                if ($prefijo -notmatch '^\d{2}$') { return $null }
                $posicion+=2; $longitud=[int]$prefijo
            }
            if (($Mensaje.Length-$posicion) -lt $longitud) { return $null }
            $valor=$Mensaje.Substring($posicion,$longitud); $posicion+=$longitud
            if ($campo -eq 7) {
                if ($valor -notmatch '^\d{10}$') { return $null }
                $hh=[int]$valor.Substring(4,2); $mm=[int]$valor.Substring(6,2)
                if ($hh -gt 23 -or $mm -gt 59) { return $null }
                return [pscustomobject]@{ Hora=$hh.ToString('00'); Minuto=$mm }
            }
        }
    }
    catch { return $null }
    return $null
}

try {
    if (-not (Test-Path -LiteralPath $CarpetaPartes -PathType Container)) {
        throw "No se encontro la carpeta de partes: $CarpetaPartes"
    }
    if ([string]::IsNullOrWhiteSpace($ArchivoRechazadas)) {
        $ArchivoRechazadas = Join-Path $CarpetaPartes 'Analisis_Consolidado\TCPHandler_Consolidado_Rechazadas.csv'
    }
    if (-not (Test-Path -LiteralPath $ArchivoRechazadas -PathType Leaf)) {
        throw "No se encontro el consolidado de rechazadas: $ArchivoRechazadas"
    }

    $archivos = @(
        Get-ChildItem -LiteralPath $CarpetaPartes -File |
        Where-Object { $_.Name -match '^TCPHandler_Parte_\d+_' } |
        Sort-Object Name
    )
    if ($archivos.Count -ne $CantidadEsperada) {
        throw "Se esperaban $CantidadEsperada partes y se encontraron $($archivos.Count)."
    }
    if ([string]::IsNullOrWhiteSpace($FechaAnalisis)) {
        $mFecha = [regex]::Match($archivos[0].Name, '\d{4}-\d{2}-\d{2}')
        if (-not $mFecha.Success) { throw 'No se pudo determinar la fecha. Use -FechaAnalisis AAAA-MM-DD.' }
        $FechaAnalisis = $mFecha.Value
    }

    $carpetaSalida = Join-Path $CarpetaPartes 'Analisis_Horario'
    $carpetaCheckpoints = Join-Path $carpetaSalida 'Partes'
    if (-not (Test-Path -LiteralPath $carpetaCheckpoints)) {
        New-Item -ItemType Directory -Path $carpetaCheckpoints -Force | Out-Null
    }

    Write-Host ("Analisis horario de {0} partes. Fecha: {1}" -f $archivos.Count,$FechaAnalisis) -ForegroundColor Cyan
    Write-Host 'Se cuentan respuestas financieras, mensajes tecnicos y registros desconocidos.' -ForegroundColor Cyan
    Write-Host ''

    for ($i = 0; $i -lt $archivos.Count; $i++) {
        $archivo = $archivos[$i]
        $idParte = [regex]::Match($archivo.Name, 'Parte_(\d+)').Groups[1].Value
        $baseCheckpoint = Join-Path $carpetaCheckpoints ("Parte_$idParte")
        $rutaHoraParte = $baseCheckpoint + '_Hora.csv'
        $ruta15Parte = $baseCheckpoint + '_15Min.csv'
        $rutaControlParte = $baseCheckpoint + '_Control.txt'
        $terminada = $false
        if (-not $Reprocesar -and (Test-Path -LiteralPath $rutaControlParte -PathType Leaf)) {
            $previo = Read-KeyValueFile -Ruta $rutaControlParte
            # Las partes anteriores sin desconocidas se reutilizan. Las que
            # contenian registros SIN_HORA se reprocesan automaticamente.
            $terminada = ($previo['Resultado'] -eq 'OK' -and [long]$previo['Desconocidas'] -eq 0)
        }

        Write-Host ("[{0}/{1}] {2}" -f ($i+1),$archivos.Count,$archivo.Name) -ForegroundColor Yellow
        if ($terminada) {
            Write-Host '  Ya analizada: se reutiliza el checkpoint.' -ForegroundColor DarkGreen
            continue
        }

        $finHora = @{}; $tecHora = @{}; $desHora = @{}
        $fin15 = @{}; $tec15 = @{}; $des15 = @{}
        [long]$lineas = 0; [long]$trnOut = 0; [long]$recuperadasDE7 = 0
        $lector = New-Object System.IO.StreamReader($archivo.FullName, $true)
        while ($null -ne ($linea = $lector.ReadLine())) {
            $lineas++
            if (($lineas % 100000) -eq 0) { Write-Host ("  {0:N0} registros" -f $lineas) }
            if ($linea.IndexOf('TRNOut',[StringComparison]::OrdinalIgnoreCase) -lt 0) { continue }
            $trnOut++

            $mFinanciera = [regex]::Match($linea, 'ISO016\d{6}')
            $esFinanciera = $mFinanciera.Success
            $esTecnica = [regex]::IsMatch($linea, 'ISO004\d{6}0800')
            $mHora = [regex]::Match($linea, '^(\d{2}):(\d{2}):\d{2}:\d{3}')
            if ($mHora.Success) {
                $hh = $mHora.Groups[1].Value
                $mm = [int]$mHora.Groups[2].Value
            }
            elseif ($esFinanciera) {
                $mensaje = $linea.Substring($mFinanciera.Index + $mFinanciera.Length)
                $horaDE7 = Get-TimeFromDE7 -Mensaje $mensaje
                if ($null -eq $horaDE7) { Add-Count $desHora 'SIN_HORA'; Add-Count $des15 'SIN_HORA'; continue }
                $hh=$horaDE7.Hora; $mm=[int]$horaDE7.Minuto; $recuperadasDE7++
            }
            else {
                Add-Count $desHora 'SIN_HORA'; Add-Count $des15 'SIN_HORA'; continue
            }
            $franja15 = $hh + ':' + ([Math]::Floor($mm / 15) * 15).ToString('00')

            if ($esFinanciera) {
                Add-Count $finHora $hh; Add-Count $fin15 $franja15
            }
            elseif ($esTecnica) {
                Add-Count $tecHora $hh; Add-Count $tec15 $franja15
            }
            else {
                Add-Count $desHora $hh; Add-Count $des15 $franja15
            }
        }
        $lector.Dispose(); $lector = $null

        $filasHoraParte = foreach ($clave in (($finHora.Keys + $tecHora.Keys + $desHora.Keys) | Sort-Object -Unique)) {
            [pscustomobject]@{ Hora=$clave; Financieras=(Get-Count $finHora $clave); Tecnicas=(Get-Count $tecHora $clave); Desconocidas=(Get-Count $desHora $clave) }
        }
        $filas15Parte = foreach ($clave in (($fin15.Keys + $tec15.Keys + $des15.Keys) | Sort-Object -Unique)) {
            [pscustomobject]@{ Franja15=$clave; Financieras=(Get-Count $fin15 $clave); Tecnicas=(Get-Count $tec15 $clave); Desconocidas=(Get-Count $des15 $clave) }
        }
        $filasHoraParte | Export-Csv -LiteralPath $rutaHoraParte -Delimiter ';' -NoTypeInformation -Encoding UTF8
        $filas15Parte | Export-Csv -LiteralPath $ruta15Parte -Delimiter ';' -NoTypeInformation -Encoding UTF8
        @(
            'Version=1.2'
            'Resultado=OK'
            "Archivo=$($archivo.Name)"
            "TotalLineas=$lineas"
            "TRNOut=$trnOut"
            "Financieras=$(($finHora.Values | Measure-Object -Sum).Sum)"
            "Tecnicas=$(($tecHora.Values | Measure-Object -Sum).Sum)"
            "Desconocidas=$(($desHora.Values | Measure-Object -Sum).Sum)"
            "RecuperadasDesdeDE7=$recuperadasDE7"
        ) | Set-Content -LiteralPath $rutaControlParte -Encoding UTF8
    }

    Write-Host ''
    Write-Host 'Consolidando conteos temporales...' -ForegroundColor Cyan
    $finHoraTotal=@{}; $tecHoraTotal=@{}; $desHoraTotal=@{}
    $fin15Total=@{}; $tec15Total=@{}; $des15Total=@{}
    [long]$totalRecuperadasDE7=0; [long]$totalTrnOutCheckpoints=0
    foreach ($archivo in $archivos) {
        $idParte = [regex]::Match($archivo.Name, 'Parte_(\d+)').Groups[1].Value
        $baseCheckpoint = Join-Path $carpetaCheckpoints ("Parte_$idParte")
        foreach ($fila in (Import-Csv -LiteralPath ($baseCheckpoint + '_Hora.csv') -Delimiter ';')) {
            Add-Count $finHoraTotal $fila.Hora ([long]$fila.Financieras)
            Add-Count $tecHoraTotal $fila.Hora ([long]$fila.Tecnicas)
            Add-Count $desHoraTotal $fila.Hora ([long]$fila.Desconocidas)
        }
        foreach ($fila in (Import-Csv -LiteralPath ($baseCheckpoint + '_15Min.csv') -Delimiter ';')) {
            Add-Count $fin15Total $fila.Franja15 ([long]$fila.Financieras)
            Add-Count $tec15Total $fila.Franja15 ([long]$fila.Tecnicas)
            Add-Count $des15Total $fila.Franja15 ([long]$fila.Desconocidas)
        }
        $controlParte=Read-KeyValueFile -Ruta ($baseCheckpoint + '_Control.txt')
        $totalTrnOutCheckpoints += [long]$controlParte['TRNOut']
        if ($controlParte.ContainsKey('RecuperadasDesdeDE7')) { $totalRecuperadasDE7 += [long]$controlParte['RecuperadasDesdeDE7'] }
    }

    Write-Host 'Incorporando rechazadas y codigos DE39...' -ForegroundColor Cyan
    $rechHora=@{}; $rech15=@{}; $codigoHora=@{}; $codigo15=@{}; $codigoTotal=@{}
    foreach ($fila in (Import-Csv -LiteralPath $ArchivoRechazadas -Delimiter ';')) {
        if ($fila.Hora -notmatch '^(\d{2}):(\d{2}):') { continue }
        $hh=$matches[1]; $mm=[int]$matches[2]
        $franja15=$hh + ':' + ([Math]::Floor($mm / 15) * 15).ToString('00')
        $codigo=[string]$fila.DE39
        Add-Count $rechHora $hh; Add-Count $rech15 $franja15
        Add-Count $codigoHora ($hh + '|' + $codigo)
        Add-Count $codigo15 ($franja15 + '|' + $codigo)
        Add-Count $codigoTotal $codigo
    }

    $filasHora = for ($h=0; $h -lt 24; $h++) {
        $hh=$h.ToString('00'); $total=Get-Count $finHoraTotal $hh; $rech=Get-Count $rechHora $hh; $aprob=$total-$rech
        if ($aprob -lt 0) { throw "Rechazadas superiores al total financiero en hora $hh." }
        $top=Get-TopCode $codigoHora $hh
        [pscustomobject]@{
            Fecha=$FechaAnalisis; Hora=($hh+':00'); TotalFinancieras=$total; Aprobadas=$aprob; Rechazadas=$rech
            TasaAprobacionPct=if($total){[Math]::Round($aprob*100.0/$total,4)}else{0}
            TasaRechazoPct=if($total){[Math]::Round($rech*100.0/$total,4)}else{0}
            CodigoPrincipal=$top.Codigo; CantidadCodigoPrincipal=$top.Cantidad
            MensajesTecnicos=(Get-Count $tecHoraTotal $hh); Desconocidas=(Get-Count $desHoraTotal $hh)
        }
    }
    $filas15 = for ($h=0; $h -lt 24; $h++) {
        foreach($m in @(0,15,30,45)) {
            $slot=$h.ToString('00')+':'+$m.ToString('00'); $total=Get-Count $fin15Total $slot; $rech=Get-Count $rech15 $slot; $aprob=$total-$rech
            if ($aprob -lt 0) { throw "Rechazadas superiores al total financiero en franja $slot." }
            $top=Get-TopCode $codigo15 $slot
            [pscustomobject]@{
                Fecha=$FechaAnalisis; FranjaInicio=$slot; TotalFinancieras=$total; Aprobadas=$aprob; Rechazadas=$rech
                TasaAprobacionPct=if($total){[Math]::Round($aprob*100.0/$total,4)}else{0}
                TasaRechazoPct=if($total){[Math]::Round($rech*100.0/$total,4)}else{0}
                CodigoPrincipal=$top.Codigo; CantidadCodigoPrincipal=$top.Cantidad
                MensajesTecnicos=(Get-Count $tec15Total $slot); Desconocidas=(Get-Count $des15Total $slot)
            }
        }
    }
    $filasCodigosHora = foreach($clave in ($codigoHora.Keys | Sort-Object)) {
        $p=$clave.Split('|'); [pscustomobject]@{Fecha=$FechaAnalisis;Hora=($p[0]+':00');DE39=$p[1];Cantidad=[long]$codigoHora[$clave]}
    }
    $filasCodigos15 = foreach($clave in ($codigo15.Keys | Sort-Object)) {
        $p=$clave.Split('|'); [pscustomobject]@{Fecha=$FechaAnalisis;FranjaInicio=$p[0];DE39=$p[1];Cantidad=[long]$codigo15[$clave]}
    }
    $picos = @(
        $filas15 |
        Where-Object {$_.TotalFinancieras -ge $VolumenMinimoPico} |
        Sort-Object -Property @(
            @{Expression='TasaRechazoPct';Descending=$true},
            @{Expression='Rechazadas';Descending=$true}
        ) |
        Select-Object -First 20
    )

    $rutaHora=Join-Path $carpetaSalida 'TCPHandler_Resumen_Por_Hora.csv'
    $ruta15=Join-Path $carpetaSalida 'TCPHandler_Resumen_Cada_15_Minutos.csv'
    $rutaCodigos=Join-Path $carpetaSalida 'TCPHandler_Codigos_Por_Hora.csv'
    $rutaCodigos15=Join-Path $carpetaSalida 'TCPHandler_Codigos_Cada_15_Minutos.csv'
    $rutaPicos=Join-Path $carpetaSalida 'TCPHandler_Picos_De_Rechazo.csv'
    $rutaJson=Join-Path $carpetaSalida 'TCPHandler_Dashboard.json'
    $rutaResumen=Join-Path $carpetaSalida 'TCPHandler_Analisis_Horario_Resumen.txt'
    $filasHora | Export-Csv -LiteralPath $rutaHora -Delimiter ';' -NoTypeInformation -Encoding UTF8
    $filas15 | Export-Csv -LiteralPath $ruta15 -Delimiter ';' -NoTypeInformation -Encoding UTF8
    $filasCodigosHora | Export-Csv -LiteralPath $rutaCodigos -Delimiter ';' -NoTypeInformation -Encoding UTF8
    $filasCodigos15 | Export-Csv -LiteralPath $rutaCodigos15 -Delimiter ';' -NoTypeInformation -Encoding UTF8
    $picos | Export-Csv -LiteralPath $rutaPicos -Delimiter ';' -NoTypeInformation -Encoding UTF8

    [long]$totalFin=($filasHora | Measure-Object TotalFinancieras -Sum).Sum
    [long]$totalRech=($filasHora | Measure-Object Rechazadas -Sum).Sum
    [long]$totalAprob=($filasHora | Measure-Object Aprobadas -Sum).Sum
    [long]$totalTec=($tecHoraTotal.Values | Measure-Object -Sum).Sum
    [long]$totalDes=($desHoraTotal.Values | Measure-Object -Sum).Sum
    if (($totalAprob + $totalRech) -ne $totalFin) { throw 'Fallo de integridad: aprobadas + rechazadas no coincide con total financiero.' }
    if (($totalFin + $totalTec + $totalDes) -ne $totalTrnOutCheckpoints) { throw 'Fallo de integridad: financieras + tecnicas + desconocidas no coincide con TRNOut.' }
    $peorHora=$filasHora | Where-Object {$_.TotalFinancieras -ge $VolumenMinimoPico} | Sort-Object TasaRechazoPct -Descending | Select-Object -First 1
    $peor15=$picos | Select-Object -First 1
    $topGlobal=($codigoTotal.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1)

    $json=[ordered]@{
        version='1.1'; fecha=$FechaAnalisis; fuente='TCPHandler'; generado_en=(Get-Date).ToString('yyyy-MM-ddTHH:mm:ss')
        resumen=[ordered]@{
            total_financieras=$totalFin; aprobadas=$totalAprob; rechazadas=$totalRech
            tasa_aprobacion_pct=[Math]::Round($totalAprob*100.0/$totalFin,4)
            tasa_rechazo_pct=[Math]::Round($totalRech*100.0/$totalFin,4)
            mensajes_tecnicos=$totalTec; desconocidas=$totalDes
            horas_recuperadas_desde_de7=$totalRecuperadasDE7
            codigo_rechazo_principal=[string]$topGlobal.Key; cantidad_codigo_principal=[long]$topGlobal.Value
            peor_hora=[string]$peorHora.Hora; peor_hora_tasa_rechazo_pct=[double]$peorHora.TasaRechazoPct
            peor_intervalo_15m=[string]$peor15.FranjaInicio; peor_intervalo_tasa_rechazo_pct=[double]$peor15.TasaRechazoPct
        }
        horas=@($filasHora); intervalos_15_minutos=@($filas15)
        codigos=@($codigoTotal.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object {[ordered]@{de39=[string]$_.Key;cantidad=[long]$_.Value}})
        codigos_por_hora=@($filasCodigosHora)
        codigos_por_intervalo_15_minutos=@($filasCodigos15)
    }
    $json | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $rutaJson -Encoding UTF8

    $fin=Get-Date
    @(
        'Resultado=OK'
        "Fecha=$FechaAnalisis"
        "CantidadPartes=$($archivos.Count)"
        "TotalFinancieras=$totalFin"
        "Aprobadas=$totalAprob"
        "Rechazadas=$totalRech"
        "TasaAprobacionPorcentaje=$([Math]::Round($totalAprob*100.0/$totalFin,4))"
        "TasaRechazoPorcentaje=$([Math]::Round($totalRech*100.0/$totalFin,4))"
        "MensajesTecnicos=$totalTec"
        "Desconocidas=$totalDes"
        "HorasRecuperadasDesdeDE7=$totalRecuperadasDE7"
        "CodigoPrincipal=$($topGlobal.Key):$($topGlobal.Value)"
        "PeorHora=$($peorHora.Hora);Tasa=$($peorHora.TasaRechazoPct);Rechazadas=$($peorHora.Rechazadas)"
        "PeorIntervalo15Min=$($peor15.FranjaInicio);Tasa=$($peor15.TasaRechazoPct);Rechazadas=$($peor15.Rechazadas)"
        "Inicio=$($inicio.ToString('yyyy-MM-dd HH:mm:ss'))"
        "Fin=$($fin.ToString('yyyy-MM-dd HH:mm:ss'))"
        "Duracion=$($fin-$inicio)"
        "CarpetaSalida=$carpetaSalida"
        'ControlIntegridad=OK'
    ) | Set-Content -LiteralPath $rutaResumen -Encoding UTF8

    Write-Host ''
    Write-Host 'Analisis horario finalizado correctamente.' -ForegroundColor Green
    Write-Host ("Financieras: {0:N0} | Aprobadas: {1:N0} | Rechazadas: {2:N0}" -f $totalFin,$totalAprob,$totalRech)
    Write-Host ("Peor hora: {0} ({1}%) | Peor intervalo: {2} ({3}%)" -f $peorHora.Hora,$peorHora.TasaRechazoPct,$peor15.FranjaInicio,$peor15.TasaRechazoPct)
    Write-Host "JSON dashboard: $rutaJson"
}
catch {
    if ($null -ne $lector) { $lector.Dispose() }
    Write-Error $_.Exception.Message
    exit 1
}
