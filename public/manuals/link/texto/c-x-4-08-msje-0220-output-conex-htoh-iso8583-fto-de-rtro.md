> **CONFIDENCIAL — Red LINK.** Uso interno exclusivo. NO publicar en la sección Documentación Técnica ni compartir con terceros.

# LINK — C-X-4-08_Msje 0220 Output_Conex_HtoH_ISO8583_Fto de Rtro



MESSAGE 0220		MENSAJE DE TRANSACCION FORZADA (OUTPUT B24).

START-OF-BASE24-HEADER-INDICATOR
El valor a informar es `ISO`.

BASE24-HEADER
El valor a informar debe ser el mismo que el indicado en el mensaje de respuesta original (MENSAJE 0210 – INPUT B24).

MESSAGE-TYPE-IDENTIFIER
El valor a informar es `0220`.

PRIMARY-BIT-MAP
Debe informar la presencia de los campos 1, 3, 4, 7, 11, 12, 13, 15, 17, 32, 35, 37, 39, 41, 42, 43, 49, 54, 60, 61, 62, 63. 
Si el banco opera con Maestro / Electron, incluir el campo 48.
En el caso de transacciones Interbancarias, Pay Key o Cambio de pin de home banking, agregar el campo 55.

SECONDARY-BIT-MAP
Debe informar la presencia de los campos 90, 100, 102, 103, 122, 123, 124, 125, 127.
En el caso de adelanto o consulta de cuenta de crédito en cuotas, agregar el campo 126.

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

Campo 15
mmdd 9(4)

Campo 17
mmdd 9(4)

Campo 32
El formato es: 
Posiciones 01-02  =  Indicador de longitud. El valor a informar es `11`.
Posiciones 03-12  =  Valor del campo.
 

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
Posiciones 01-22  =  Nombre de la  Institución dueña del ATM. 
Posiciones 23-35  =  Localidad donde  se  encuentra ubicado el ATM. 
Posiciones 36-38  =  Código  de  Provincia donde se encuentra ubicado el ATM. Posiciones 39-40  =  Código de País donde se encuentra ubicado el ATM.

Campo 48
Ver nota campo 48.

Campo 49
Los valores posibles son: 
`032`  =  PESOS.
`076`  =  REALES. 
`840`  =  DOLARES. 
`858`  =  PESOS URUGUAYOS.

Campo 54
Ver nota de campo 54.

Campo 55
Ver nota de campo 55. 

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
Posiciones 08-11  =  Código que identifica a la RED. El valor a informar es`PRO1`.
Posiciones 12-15  =  Tipos de cuentas involucradas en la transacción. 
Posiciones 16-16  =  El valor a informar es `P`.

Campo 62
Es condicional.
El formato es:
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `025`.
Posiciones 04-05  =  Tipo de terminal en la que se realiza la transacción.
Posiciones 06-28  =  Informar blancos.

Campo 63
El formato es: 
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `016`.
Posiciones 04-19  =  Pin Offset.

Campo 90
El formato es: 
Posiciones 01-04  =  Tipo de mensaje original. El valor a informar es ‘0200’.
Posiciones 05-16  =  Número de secuencia original, alineado a izquierda y relleno con CEROS. 
Posiciones 17-20  =  Fecha de la transacción original (mmdd). 
Posiciones 21-28  =  Hora de la transacción original, alineado a izquierda y relleno con BLANCOS. 
Posiciones 29-32  =  Fecha de negocios de la transacción original (mmdd). 
Posiciones 33-42  =  Se deberá informar CEROS.

Campo 100
El formato es: 
Posiciones 01-02  =  Indicador de longitud. El valor a informar es `11`.
Posiciones 03-13  =  Valor  del  campo,  alineado  a izquierda y relleno con BLANCOS.

Campo 102
El formato es: 
Posiciones 01-02  =  Indicador de longitud. El valor a informar es `28`.
Posiciones 03-30  =  Valor  del  campo,  alineado a izquierda y relleno con BLANCOS.

Campo 103
El formato es: 
Posiciones 01-02  =  Indicador de longitud. El valor a informar es `28`.
Posiciones 03-30  =  Valor  del  campo,  alineado  a izquierda y relleno con BLANCOS.

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
Posiciones 01-03  =  Indicador de longitud. X(30) El valor a informar es `001`.
Posiciones 04-04  =  Los valores posibles son: 
` `  =  BLANCO. 
`0`  =  CERO. 
`1`  =  UNO. 
`2`  =  DOS.

Campo 126
Ver nota campo 126.

Campo 127
El formato es: 
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `043`.
Posiciones 04-46  =  Si es cruzada se informa el tipo de cambio tal cual el formato del mensaje 0200. De lo contrario, se deberá informar CEROS.

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

DEPOSITOS (Códigos 2100xx / 2200xx)

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

CAMBIO DE PIN (Código 32) Y CAMBIO DE CIT (Código 33)

LONGITUD
Longitud del Primary Bit 54. El valor a informar es `023`.
9(3)

PIN-OFFSET
Nuevo número de PIN-OFFSET.
X(16)

FILLER
Se deberá informar BLANCOS.
X(7)

PAGO AUTOMATICO DE SERVICIOS	(Códigos 80/ 81/ 82/ 83/ 84/ 85/ 87/ 88/ 89)

LONGITUD
Longitud del Primary Bit 54. El valor a informar es `023`.
9(3)

CDE-ID-CUSTOM
CODIGO DE IDENTIFICACION DEL CLIENTE. El contenido de estos campos debe ser igual al enviado en el mensaje de requerimiento de transacción (TR).

CDE-ENTE
Código de Ente.
X(3)

CDE-CUSTOM
Código de cliente.
X(19)

FILLER
Se deberá informar BLANCOS.
X(1)

TRANSFERENCIA MINORISTA (Código 1B)

LONGITUD
Longitud del Primary Bit 54. El valor a informar es `023`.
9(3)

CBU
Número de clave bancaria uniforme.
X(22)

FILLER
Se deberá informar BLANCOS.
X(98)

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
Institución Emisora de la cuenta. Para el código de transacción 09 la institución será 5892 si es Banelco.
X(4)

TYP
Tipo de cuenta.
X(2)

ACCT-NUM
Número de cuenta hacia.
X(19) 

FIID-CPF
Institución a la cual pertenece la cuenta hacia. Para el código de transacción 09 la institución será 5892 si es Banelco
Si se trata de donaciones, este campo se redefine de la siguiente manera:
Ente           X(3)
Filler         X(10)
X(13)  

RUBRO
Datos del titular.
X(15)

CAMBIO DE PIN DE HOME BANKING ENCRIPTADO (Código 34)
(Para los ON/OFF a pedido del host)

LONGITUD
Longitud del Primary Bit 55. El valor a informar es `120`.
9(3)

PIN-OFFSET
Nuevo número de PIN-OFFSET.
X(16)

USUARIO-ENCRIPTADO
Número de usuario encriptado. 
X(16)

FILLER
Se deberá informar BLANCOS.
X(88)

PAY KEY (Código 17)

LONGITUD
Indicador de longitud. El valor a informar es `038`.
9(3)

COMPRAS

COD-EMPRESA
Código de empresa.
X(3)

COD-PRODUCTO
Código de producto.
X(3)

COD-ARTICULO
Código de artículo.
X(32)

De acuerdo al código de movimiento, el formato del campo 126 es el siguiente:

ADELANTO / CONSULTA EN CUOTAS (Códigos 01 / 31)

LONGITUD
Indicador de longitud. El valor a informar es `139`.
9(3)

DISP-CTA-DÓLAR
Disponible en cuotas en dólares.
X(12)

MIN-ADEL-PESOS
Monto mínimo de adelanto en pesos.
X(12)

MIN-ADEL-PESOS
Monto mínimo de adelanto en dólares.
X(12)

SALDO-CTA-PESOS
REDEFINE MIN-ADEL-DÓLAR. Saldo en pesos.

MAX-CTA-PESOS
Monto máximo para adelanto en cuotas en pesos.
X(12)

SALDO-CTA-DÓLAR
REDEFINE MAX-CTA-PESOS. Saldo en dólares.
 

MAX-CTA-DÓLAR
Monto máximo para adelanto en cuotas en dólares.
X(12)

CUOTAS

CANT-MAX-PESOS
Cantidad máxima de cuotas en pesos.
X(2)

CANT-MAX-DOLAR
Cantidad máxima de cuotas en dólares.
X(2)

FILLER

X(2)

TNA-PESOS
Tasa nominal anual en pesos a aplicar.
X(12)

TNA-DOLAR
Tasa nominal anual en dólares a aplicar.
X(12)

TEM-PESOS
Tasa estimada mensual en pesos a aplicar.
X(12)

DISP-CTA-PESOS
Disponible en cuotas en pesos.
X(12)

TEM-DÓLAR
Tasa estimada mensual en dólares a aplicar.
X(12)

CANT-CTA
Cantidad de cuotas seleccionadas por el usuario.
X(2)

TIPO-DEB
Flag para imputación de pagos.
X(1)

TIPO-TRAN
REDEFINE TIPO-DEB.  Flag de adelanto en cuotas. 
‘0’ – transacción normal
‘1’ – transacción en cuotas.

NEW-PIN-DATA
Nuevo pin seleccionado por el cliente.
X(4)

CODIGO-BCRA
Código del administrador del cajero.
X(3)

SERVICE-CDE
Service code de la tarjeta.
X(3)

EJEMPLO

       HHTNISO0140000130220B23A80012AE0841A000000401600007A812000000000014705071
       312251000026912065807130000071311           37588673000063043000=99121011
       0000000008002184      00S1AX2515                       30015003020024
           CAP. FED.    BUEAR03202330015003020024         0120014TES1+000013BNL
       TES10100P016                02000000000000000000000000000000          119
       0000000600281040001543709               28                            011
                  012            001 001 043000000000000000000000001470502980713
       0000263?

