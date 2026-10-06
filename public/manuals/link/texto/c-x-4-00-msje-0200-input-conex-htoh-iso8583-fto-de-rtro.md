> **CONFIDENCIAL — Red LINK.** Uso interno exclusivo. NO publicar en la sección Documentación Técnica ni compartir con terceros.

# LINK — C-X-4-00_Msje 0200 Input_Conex_HtoH_ISO8583_Fto de Rtro



MESSAGE 0200		MENSAJE DE REQUERIMIENTO DE TRANSACCION (INPUT B24).

START-OF-BASE24-HEADER-INDICATOR
El valor a informar es `ISO`.

BASE24-HEADER
El valor a informar es `014000050`.

MESSAGE-TYPE-IDENTIFIER
El valor a informar es `0200`.

PRIMARY-BIT-MAP
Debe informar la presencia de los campos 1, 3, 4, 7, 11, 12, 13, 17, 32, 35, 37, 41, 42, 43, 48, 49, 52, 54, 60, 62.
En el caso de extracciones o consultas, agregar el campo 45 solo los acquirer.
En el caso de transacciones Interbancaria, agregar el campo 55.

SECONDARY-BIT-MAP 
Debe informar la presencia de los campos 120, 124, 127.
En el caso de transacciones de pas con codigos 81/ 87 agregar el campo 102.

Campo 3
Ver tabla de códigos.

Campo 4
9(12)

Campo 7
mmddhhmmss 9(10)

Campo 11
9(6)

Campo 12
hhmmss 9(6)

Campo 13
yymm 9(4)

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

Campo 41
X(16)

Campo 42
X(15)

Campo 43
El formato es:
Posiciones 01-22  =  Nombre de la  Institución dueña del ATM.
Posiciones 23-35  =  Localidad  donde  se  encuentra ubicado el ATM.
Posiciones 36-38  =  Código  de  Provincia  donde se encuentra ubicado el ATM.
Posiciones 39-40  =  Código de País donde se encuentra ubicado el ATM.

Campo 45
LLVAR ..9(76)
Track 1 alineado a izquierda y relleno con blancos.

Campo 48
Necesario por el Sharing group. Ver nota campo 48. 

Campo 49
Los valores posibles son:
`032`  -  PESOS.
`076`  -  REALES.
`840`  -  DOLARES.
`858`  -  PESOS URUGUAYOS.

Campo 52
X(16)

Campo 54
Ver nota campo 54.

Campo 55
Ver nota campo 55.

Campo 60
El formato es:
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `012`.
Posiciones 04-07  =  Número de Institución dueña del ATM.
Posiciones 08-11  =  Código que identifica la RED dueña del ATM. El valor a informar es `PRO1`.
Posiciones 12-15  =  Diferencia horaria con la RED. El valor a informar es +000`.

Campo 62
Es condicional.
El formato es:
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `025`.
Posiciones 04-05  =  Tipo de terminal en la que se realiza la transacción.
Posiciones 06-28  =  Informar blancos.

Campo 102
El formato es:
Posiciones 01-02 = Indicador de longitud. El valor a informar es `28`.
Posiciones 03-30 = Valor del campo, alineado a izquierda y relleno con BLANCOS.

Campo 120
El formato es :
Posiciones 01 - 03 Indicador de longitud. Fijo 033
Posiciones 04 - 28 Valor del campo, alineado a izquierda y relleno con blancos. Posiciones 29 - 32 Sucursal del cajero. 
Posiciones 33 - 36 Región del cajero.

Campo 124
El formato es:	
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `001`.
Posiciones 04-04  =  Los valores posibles son:
`0`  =  CERO.
` `  =  BLANCO.

Campo 127
El formato es:
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `043`.
Posiciones 04-07  =  Indica la región a la cuál pertenece el ATM, para transacciones en dólares.
Los valores posibles son:
`0000`  =  CAPITAL Y GRAN BUENOS AIRES.
`0001`  =  USHUAIA.
`0002`  =  RESTO INTERIOR DEL PAIS.
`0005`  =  URUGUAY / BRASIL / CIRRUS.

Los cuatro campos siguientes deberán contener los valores informados en la consulta de tipo de cambio, si la misma fue la transacción anterior y dentro del último minuto. En caso contrario, informar CEROS.

Posiciones 08-15  =  Tipo de cambio comprador U$S / $. El formato es 9(5)v999.
Posiciones 16-23  =  Tipo de cambio vendedor U$S / $. El formato es 9(5)v999.
Posiciones 24-31  =  Tipo de cambio,  entre la moneda informada en el campo 49 y Pesos. El formato es 9(5)v999.
Posiciones 32-39  =  Tipo de cambio,  entre la moneda informada en el campo 49 y Dólares. El formato es 9(5)v999.
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
Región a la que pertenece el comercio.(o ceros)
X(4)

SHRG-GRP
Sharing group (1 y blancos)
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

DEPOSITOS (Códigos 2100xx/ 2200xx / 500031)

LONGITUD
Longitud del Primary Bit 54. El valor a informar es `023`.
9(3)

FILLER
Se deberá informar BLANCOS.
X(12)

TIPO-DEP
Tipo de depósito.
Los valores posibles, para los depósitos, son los indicados en el capítulo de Códigos de Tipos de Depósitos del Manual del Sistema de Base 24.
X(1)

FILLER 
Se deberá informar BLANCOS.
X(10)

PAGO DE SERVICIOS CON ORDEN DE DEBITO (Códigos 90xx00)

LONGITUD
Longitud del Primary Bit 54. El valor a informar es "023".
9(3)

FILLER
Se deberá informar BLANCOS.
X(13)

CANT-COMPR
Cantidad de comprobantes.
9(2)

FILLER
Se deberá informar BLANCOS.
X(8)

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
Nuevo número de PIN-Offset.
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

PAGO AUTOMATICO DE SERVICIOS	(Códigos 80/ 82/ 83/ 84/ 85/ 89)

LONGITUD
Longitud del Primary Bit 54. El valor a informar es `028`.
9(3)

CDE-ID-CUSTOM
CODIGO DE IDENTIFICACION DEL CLIENTE.

CDE-ENTE
Código de Ente.
X(3)

CDE-CUSTOM
Código de cliente.
X(19)

CTA-ANIO
Nro. de cuota y año
9(5)

FILLER
Se deberá informar BLANCOS.
X(1)

PAGO AUTOMATICO DE SERVICIOS	(Códigos 81/ 87/ 88)

LONGITUD
Longitud del Primary Bit 54. El valor a informar es `028`.
9(3)

CDE-ID-CUSTOM
CODIGO DE IDENTIFICACION DEL CLIENTE.

CDE-ABREVIADO
Código abreviado
9(2)

FILLER
Se deberá informar blancos
X(20)

CTA-ANIO
Nro. de cuota y año
9(5)

FILLER
Se deberá informar BLANCOS.
X(1)

RESTANTES CODIGOS

LONGITUD
Longitud del Primary Bit 54. El valor a informar es `023`.
9(3)

FILLER
Se deberá informar BLANCOS.
X(23)

De acuerdo al código de movimiento, el formato del campo 55 es el siguiente:

INTERBANCARIAS (Códigos 09/ 29/ 39)

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
Institución Emisora de la cuenta.
X(4)

TYP
Tipo de cuenta.
X(2)

ACCT-NUM
Número de cuenta desde.
X(19)

TO-ACCT

FIID
Institución Emisora de la cuenta.
X(4)

TYP
Tipo de cuenta.
X(2)

ACCT-NUM
Número de cuenta hacia.
X(19)

FIID-CPF
Institución a la cual pertenece la cuenta hacia.
X(13)

RUBRO
Datos del titular.
X(15)

EJEMPLO

   ISO0140000500200B238800128E1941000000000000000120110000000000010000626144
   3000000001443010626062611509        375600147103950026D99121010
     792001      09231                          CABAL S.A.
               0441                       4000000000000000000003217DABA59549
   803D5023                       0123121PRO1+000001 04300000000000000000000
   00000000000000000000000

