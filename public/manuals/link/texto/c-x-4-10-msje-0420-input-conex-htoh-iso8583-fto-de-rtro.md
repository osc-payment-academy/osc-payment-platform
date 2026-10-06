> **CONFIDENCIAL — Red LINK.** Uso interno exclusivo. NO publicar en la sección Documentación Técnica ni compartir con terceros.

# LINK — C-X-4-10_Msje 0420 Input_Conex_HtoH_ISO8583_Fto de Rtro



MESSAGE 0420		 MENSAJE DE REVERSA DE TRANSACCION (INPUT B24).

START-OF-BASE24-HEADER-INDICATOR
El valor a informar es `ISO`.

BASE24-HEADER
El valor a informar debe ser el mismo que el indicado en el mensaje de respuesta original (MENSAJE 0210 - OUTPUT B24).
 

MESSAGE-TYPE-IDENTIFIER
El valor a informar es `0420`.

PRIMARY-BIT-MAP
Debe informar la presencia de los campos 1, 3, 4, 7, 11, 12, 13, 15, 17, 32, 35, 37, 39, 41, 42, 43, 49, 54, 60, 61.
Si el banco opera con Maestro / Electron, agregar el campo 48.
En el caso de transacciones Interbancarias,  agregar el campo 55.

SECONDARY-BIT-MAP
Debe informar la presencia de los campos 90, 95, 100, 102, 103, 122, 123, 124, 125, 127.

Campo 3
Ver tabla de códigos.

Campo 4
9(12)

Campo 7
Mmddhhmmss 9(10)

Campo 11
9(6)

Campo 12
Hhmmss 9(6)

Campo 13
yymm 9(4)

Campo 15
mmdd 9(4)

Campo 17
mmdd 9(4)

Campo 32
El formato es:
Posiciones 01-02  =  Indicador de longitud. El valor a informar es `11`.
Posiciones 03-13  =  Valor del campo.

Campo 35
El formato es:
Posiciones 01-02  =  Indicador de longitud. El valor a informar es `37`.
Posiciones 03-39  =  Valor del campo.

Campo 37
X(12)

Campo 39
Ver tabla de códigos de resultado.

Campo 41
X(16)

Campo 42
X(15)

Campo 43
El formato es:
Posiciones 01-22  =  Nombre de la Institución dueña del ATM. 
Posiciones 23-35  =  Localidad  donde  se encuentra ubicado el ATM. 
Posiciones 36-38  =  Código  de  Provincia donde se encuentra ubicado el ATM. Posiciones 39-40  =  Código de País donde se encuentra ubicado el ATM.

Campo 48
Ver nota campo 48.

Campo 49
Los valores posibles son:
`032`  -  PESOS. 
`076`  -  REALES. 
`840`  -  DOLARES. 
`858`  -  PESOS URUGUAYOS.

Campo 54
Ver nota campo 54.

Campo 55
Ver nota campo 55.

Campo 60
El formato es: 
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `012`.
Posiciones 04-07  =  Número de  Institución dueñadel ATM. Para el código de transacción 29 la institución será 5892 si es Banelco 
Posiciones 08-11  =  Código que identifica a la RED dueña del ATM. Para el código de transacción 29 la RED será BANE si es Banelco
Posiciones 12-15  =  Diferencia horaria con la RED. El valor a informar es`+000`.

Campo 61
El formato es: 
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `013`.
Posiciones 04-07  =  Número de Institución emisora de la tarjeta. 
Posiciones 08-11  =  Código que identifica a la RED. El valor a informar es `PRO1`.
Posiciones 12-15  =  Tipos de cuentas involucradas en la transacción. 
Posiciones 16-16  =  El valor a informar es `P`.

Campo 90
El formato es: 
Posiciones 01-04  =  Tipo de mensaje original. El valor a informar es ‘0200’.
Posiciones 05-16  =  Número de secuencia original, alineado a izquierda y relleno con CEROS (37). 
Posiciones 17-20  =  Fecha de la transacción original (mmdd)(13). 
Posiciones 21-28  =  Hora de la transacción original, alineado a izquierda y relleno con BLANCOS (12). 
Posiciones 29-32  =  Fecha de negocios de la transacción original (mmdd)(17). 
Posiciones 33-42  =  Se deberá informar CEROS.

Campo 95
El formato es: 
Posiciones 01-12  =  Valor del campo. El formato es 9(10)v99. 
Posiciones 13-42  =  Se deberá informar CEROS.

Campo 100
El formato es: 
Posiciones 01-02  =  Indicador de longitud. El valor a inforamr es `11`.
Posiciones 03-13  =  Valor  del  campo,  alineado  a izquierda y relleno con BLANCOS.

Campo 102
El formato es: 
Posiciones 01-02  =  Indicador de longitud. El valor a informar es `28`. Posiciones 03-30  =  Valor  del  campo,  alineado  a izquierda y relleno con BLANCOS.

Campo 103
El formato es: 
Posiciones 01-02  =  Indicador de longitud. El valor a informar es `28`. Posiciones 03-30  =  Valor  del  campo,  alineado  a izquierda y relleno con BLANCOS.

Campo 122
El formato es: 
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `011`.
Posiciones 04-14  =  Valor  del  campo,  alineado  a izquierda y relleno con BLANCOS.

Campo 123
El formato es: 
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `012`.
Posiciones 04-15  =  Valor  del  campo,  alineado  a izquierda y relleno con BLANCOS. El formato es 9(10)v99.

Campo 124
El formato es: 
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `001`.
Posiciones 04-04  =  Los valores posibles son: 
`0`  =  CERO. 
` `  =  BLANCO.

Campo 125
El formato es: 
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `001`.
Posiciones 04-04  =  Los valores posibles son: 
` `  =  BLANCO. 
`0`  =  CERO. 
`1`  =  UNO. 
`2`  =  DOS.

Campo 127
El formato es: 
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `043`.
Posiciones 04-07  =  Se deberá informar CEROS. Se deberán informar los tipos de cambio de la transacción original. En caso contrario, informar CEROS. 
Posiciones 08-15  =  Tipo de cambio comprador U$S / $.El formato es 9(05)v999. Posiciones 16-23  =  Tipo de cambio vendedor U$S / $.El formato es 9(05)v999. Posiciones 24-31  =  Tipo de cambio,  entre la monedainformada en el campo 49 y Pesos. El formato es 9(05)v999. 
Posiciones 32-39  =  Tipo de cambio,  entre la moneda informada en el campo y Dólares. El formato es 9(05)v999. 
Posiciones 40-46  =  Se deberá informar CEROS.

De acuerdo al código de movimiento, el formato del campo 48 es el siguiente:

Transacciones originadas en ATM.

LONGITUD 
Longitud del campo 48. El valor a informar es `044`.
9(3)

ATM

SHRG-GRP
Sharing group
X(24)

TERM-TRAN-ALLOWED
Indica a que nivel se permite una transacción para un cliente NOT-ON-US en dicha terminal
9(1)

TERM-ST
Estado en el que reside la terminal. No aplicable.
9(2)

TERM-CNTY
Código ANSI del país en el que reside la terminal. No utilizado.
9(3)

TERM-CNTRY
Código ISO del país en el que reside la terminal. No utilizado.
9(3)

TERM-RTE-GRP
Grupo de ruteo. No utilizado.
9(11)

Transacciones originadas en POS.

LONGITUD
Longitud del campo 48. El valor a informar es `079`.
9(3)

POS

RETL-ID
Código de identificación del comercio donde se origina la transacción.
X(19)

DC

CUOTAS
Cantidad de cuotas en compras realizadas con Maestro / Electron.
X(2)

FILLER

X(2)

RETL-REGN
Región a la que pertenece el comercio.
X(4)

SHRG-GRP
Sharing group
X(24)

TERM-TRAN-ALLOWED
Indica a que nivel se permite una transacción para un cliente NOT-ON-US en dicha terminal
9(1)

TERM-ST
Estado en el que reside la terminal. No aplicable.
9(2)

TERM-CNTY
Código ANSI del país en el que reside la terminal. No utilizado.
9(3)

TERM-CNTRY
Código ISO del país en el que reside la terminal. No utilizado.
9(3)

TERM-RTE-GRP
Grupo de ruteo. No utilizado.
9(11)

ORIG-NUM
En caso de ser una devolución Maestro / Electron, contiene el número de secuencia de la transacción original, de lo contrario `0000`
9(4)

ORIG-DATE
En caso de ser una devolución Maestro / Electron, contiene la fecha de la transacción original, de lo contrario `0000`.
9(4)

De acuerdo al código de movimiento, el formato del campo 54 es el siguiente:

DEPOSITOS  (Códigos 2100xx / 2200xx)

LONGITUD
Longitud del Primary Bit 54. El valor a informar es `023`.
9(3)

FILLER
Se deberá informar BLANCOS.
 X(12)

TIPO-DEP
Tipo de depósito. Los valores posibles son:
 `E`  =  EFECTIVO en $ y `U` en U$S
 `C`  =  CHEQUE en $ y `W` en U$S.
X(1)

FILLER
Se deberá informar BLANCOS.
X(10)

PAGO DE SERVICIOS CON ORDEN DE DEBITO (Códigos 90xx00)

LONGITUD
Longitud del Primary Bit 54. El valor a informar es `023`.

FILLER
Se deberá informar BLANCOS.
X(13)

CANT-COMPR
Cantidad de comprobantes.
9(2)

CTA-ANIO
Nro. de cuota y año.
9(5)

FILLER
Se deberá informar BLANCOS.
X(3)

CAMBIO DE PIN (Código 32)

LONGITUD
Longitud del Primary Bit 54. El valor a informar es `023`.
9(3)

FILLER
Se deberá informar BLANCOS.
X(15)

NUEVO-PIN 
PIN-NUEVO-1, PIN-NUEVO-2, alineado a izquierda y relleno con BLANCOS.
X(8)

CAMBIO DE PIN ENCRIPTADO (Código 32)

LONGITUD
Longitud del Primary Bit 54. El valor a informar es `023`.
9(3)

PIN-ENCRIPTADO
Nuevo número de PIN - offset.
X(16)

FILLER
Se deberá informar BLANCOS.
X(7)

COMPRA CON CASH-BACK (Códigos 76/ 77)

LONGITUD
Longitud del Primary Bit 54. El valor a informar es `023`.
9(3)

TRANSACTION-AMOUNT
Es el importe del retiro en efectivo.
9(10)v99

FILLER
Se deberá informar BLANCOS.
X(11)

PAGO AUTOMATICO DE SERVICIOS	(Códigos 81/ 87/ 88)

LONGITUD
Longitud del Primary Bit 54. El valor a informar es `028`.
9(3)

CDE-ID-CUSTOM

CODIGO DE IDENTIFICACION DEL CLIENTE. El contenido de estos campos debe ser igual al enviado en el mensaje de requerimiento de transacción (TR).

CDE-ENTE
Código de Ente.
X(3)

CDE-CUSTOM
Código de cliente.
X(19)

CTA-ANIO
Nro. de cuota y año.
9(5)

NRO-OPC
Nro. de OPC
9(1)

RESTANTES CODIGOS

LONGITUD
Longitud del Primary Bit 54. El valor a informar es `023`.
9(3)

FILLER
Se deberá informar BLANCOS.
X(23)

De acuerdo al código de movimiento, el formato del campo 55 es el siguiente:

TRANSFERENCIAS INMEDIATAS (Códigos 09/ 29/ 39)

LONGITUD
Indicador de longitud. El valor a informar es `120`. 
9(3)

TRACK2
Contiene datos del Track 2 de la tarjeta alineado a izquierda y rellenos con blancos.
X(40)

CA
Código asociado.
X(2)

FR-ACCT
Número de cuenta desde.

FIID
Institución Emisora de la cuenta. Para el código de transacción 29 la institución será 5892 si es Banelco
X(4)

TYP
Tipo de cuenta.
X(2)

ACCT-NUM
Número de cuenta desde.
X(19) 

TO-ACCT

FIID
Institución Emisora de la cuenta. Para el código de transacción 09 la institución será 5892 si es Banelco
X(4)

TYP
Tipo de cuenta.
X(2)

ACCT-NUM
Número de cuenta hacia.
X(19) 

FIID-CPF
Institución a la cual pertenece la cuenta hacia. Para el código de transacción 09 la institución será 5892 si es Banelco
Si se trata de donaciones, este dampo se redefine de la siguiente manera:
Ente           X(3)
Filler         X(10)

X(13)  

RUBRO
Datos del titular.
X(15)

EJEMPLO

        ISO0140000500420B23A80012AE08418000000421600007A011000000000015000070114
        80400000014595007010701070111509        375029131319520030
              046201      2100331                          CABAL S.A.
                     00000032023                       0123121PRO1+0000130029PRO
            P020004620100000007011459500980701         0000000000000000000000000
        0000000000000000110001       2800000000000000000000000000002800000000000
        00000000000000000110001       012000000000000001 00110430000000000000000
        00000000000000000000000000

