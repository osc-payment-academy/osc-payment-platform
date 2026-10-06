> **CONFIDENCIAL — Red LINK.** Uso interno exclusivo. NO publicar en la sección Documentación Técnica ni compartir con terceros.

# LINK — C-X-4-01_Msje 0200 Output_Conex_HtoH_ISO8583_Fto de Rtro



MESSAGE 0200		MENSAJE DE REQUERIMIENTO DE TRANSACCIÓN (OUTPUT B24).

START-OF-BASE24-HEADER-INDICATOR
El valor a informar es `ISO`.

BASE24-HEADER
De acuerdo al tipo de equipamiento que origina el requerimiento, los valores posibles son los siguientes:

-  ORIGEN DEL REQUERIMIENTO:  `ATM`. El valor a informar es `014000010`.
-  ORIGEN DEL REQUERIMIENTO:  `HOST`. El valor a informar es `014000050`.
-  ORIGEN DEL REQUERIMIENTO:  `INTERCHANGE`. El valor a informar es `014000070`.
 

MESSAGE-TYPE-IDENTIFIER
El valor a informar es `0200`.

PRIMARY-BIT-MAP
Debe informar la presencia de los campos: 1, 3, 4, 7, 11, 12, 13, 15, 17, 32, 35, 37, 41, 42, 43, 49, 52, 54, 60, 61, 62, 63.
En el caso de extracción o consulta, agregar el campo 45, solo los acquirer.
Si el banco opera con Maestro / Electron, agregar el campo 48.
En el caso de transacciones Interbancarias, Pay Key o FCI, agregar el campo 55.

SECONDARY-BIT-MAP
Debe informar la presencia de los campos: 100, 102, 103, 120, 124, 125, 127.
En el caso de adelanto o consulta de cuenta de crédito en cuotas o selección de múltiples cuentas solo para los ON Line puro, agregar el campo 126.

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
mmdd 9(4)

Campo 15
mmdd 9(4)

Campo 17
mmdd 9(4)

Campo 32
LLVAR ..9(11)

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
Ver nota campo 48.

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
Posiciones 04-07  =  Número de  Institución dueña del ATM.
Posiciones 08-11  =  Código que identifica a la RED dueña del ATM.
Posiciones 12-15  =  Diferencia horaria con la RED. El valor a informar es `+000`.

Campo 61
El formato es:
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `013`.
Posiciones 04-07  =  Número de la Institución emisora de la tarjeta.
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

Campo 100 
El formato es:
Posiciones 01-02  =  Indicador de longitud. El valor a informar es `11`. Posiciones 03-13  =  Valor  del  campo, alineado a izquierda y relleno con BLANCOS.

Campo 102
El formato es:
Posiciones 01-02  =  Indicador de longitud. El valor a informar es `28`.
Posiciones 03-30  =  Valor  del  campo,  alineado  a izquierda y relleno con BLANCOS.

Campo 103
El formato es:
Posiciones 01-02  =  Indicador de longitud. El valor a informar es `28`.
Posiciones 03-30  =  Valor  del  campo,  alineado  a izquierda y relleno con BLANCOS.

Campo 120
El formato es : 
Posiciones 01 - 03 Indicador de longitud. Fijo 033. 
Posiciones 04 - 28 Valor del campo, alineado a izquierda y relleno con blancos. Posiciones 29 - 32 Sucursal del cajero. 
Posiciones 33 - 36 Región del cajero.

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
`0`  =  CERO.
`1`  =  UNO.
`2`  =  DOS.

Campo 126
Ver nota campo 126.

Campo 127
El formato es:
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `043`.
Posiciones 04-07  =  Indica la región a la cuál pertenece el ATM, para transacciones en dólares. Los valores posibles son:
`0000`  =  CAPITAL Y GRAN BUENOS AIRES.
`0001`  =  USHUAIA.
`0002`  =  RESTO INTERIOR DEL PAIS.
`0005`  =  URUGUAY / BRASIL / CIRRUS.

Los cuatro campos siguientes deberán contener los valores informados en la consulta de tipo de cambio,  si la misma fue la transacción anterior y dentro del último minuto. En caso contrario, informar CEROS.

Posiciones 08-15  =  Tipo de cambio comprador U$S / $.El formato es 9(05)v999.      
Posiciones 16-23  =  Tipo de cambio vendedor U$S / $. El formato es 9(05)v999.
Posiciones 24-31  =  Tipo de cambio,  entre la moneda informada en el campo 49 y Pesos. El formato es 9(05)v999.
Posiciones 32-39  =  Tipo de cambio,  entre la moneda informada en el campo 49 y Dólares. El formato es 9(05)v999.
Posiciones 40-46  =  Se deberá informar CEROS.

De acuerdo al código de movimiento, el formato del campo 48 es el siguiente:

Transacciónes originadas en ATM.

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

Transacciónes originadas en POS.

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
Tipo de depósito.
Los valores posibles, para los depósitos, son los indicados en el capítulo de Códigos de Tipos de Depósitos del Manual del Sistema de Base 24.
X(1)

FILLER
Se deberá informar BLANCOS.
X(10)

PAGOS CON DÉBITO EN CUENTA A TRAVÉS DE TERMINALES DE CAJA (Códigos 10XXYY)

LONGITUD
Longitud del Primary Bit 54. El valor a informar es `023`.
9(3)

FILLER
Se deberá informar BLANCOS.
X(12)

TIPO-DEP
Tipo de depósito. El valor posible es:
 `X` Pagos con débito en cuenta a través de terminales de caja
 
X(1)

FILLER
Se deberá informar BLANCOS.
X(10)

PAGO DE SERVICIOS CON ORDEN DE DEBITO (Códigos 90xx00)

LONGITUD
Longitud del Primary Bit 54. El valor a informar es `023`.
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

PAGO AUTOMATICO DE SERVICIOS	(Códigos 80/ 81/ 82/ 83/ 84/ 85/ 87/ 88/ 89)

LONGITUD
Longitud del Primary Bit 54. El valor a informar es `023`.
9(3)

CDE-ID-CUSTOM
CÓDIGO DE IDENTIFICACION DEL CLIENTE

CDE-ENTE
Código de Ente
X(3)

CDE-CUSTOM
Código de cliente
X(19)

NRO-OPC
Opción que corresponde a la selección de la deuda.
9(1)

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

TRANSFERENCIA MINORISTA (1B)

LONGITUD
Longitud del Primary Bit 54. El valor a informar es `023`.
9(3)

CBU
Número de clave bancaria uniforme.
X(22)

FILLER
Se deberá informar BLANCOS.
X(98)

RESTANTES CÓDIGOS

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
Código asociado
X(2)

FR-ACCT
Número de cuenta desde

FIID
Institución Emisora de la cuenta
X(4)

TYP
Tipo de cuenta
X(2)

ACCT-NUM
Número de cuenta desde
X(19)

TO-ACCT

FIID
Institución Emisora de la cuenta
X(4)

TYP
Tipo de cuenta
X(2)

ACCT-NUM
Número de cuenta hacia
X(19)

FIID-CPF
Institución a la cual pertenece la cuenta hacia
Si se trata de donaciones, este campo se redefine de la siguiente manera:
Ente           X(3)
Filler         X(10)
X(13)

RUBRO
Datos del titular
X(15)

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

PLAZO FIJO (Códigos 37/ 18/ 38/ 63/ 68)

LONGITUD
Indicador de longitud. El valor a informar es `120`.
9(3)

PLAZO
En la subscripción, este campo indica la cantidad de días indicada por el cliente.
En la Consulta Publicitaria por Plazo, contendrá la cantidad de días ingresada por el cliente.
X(3)

IMPORTE
En la Consulta Publicitaria por Importe, contendrá el importe ingresado por el cliente (sin posiciones decimales) 
X(10)

FORMA-RENOVACION
En la subscripción, indica la forma de renovación elegida por el cliente. Puede valer “N”, “T” o “P”, según sea No renovable, Renovable Totalmente o Renovable Parcialmente.
Para la Activación de renovación automática, puede valer “T” o “P”.
X(1)

AUTO-RENOVACION
Este campo indica la Suspención (“S”)/Activación (“A”) de renovación automática para la transacción 68.
X(1)

TIPO-PF
Este campo indica el tipo de Plazo Fijo para la consulta publicitaria y para la constitución. Los valores posibles son:
“T”	 Tradicional
“P”	 Precancelable
“V”	 De tasa variable encuesta
“B”	 De tasa variable baibor
     “C” 	 Ajustable por CER.
X(1)

OPCION
Este campo se utiliza luego de la selección de Plazo Fijo para los casos de Múltiples Plazos Fijos. 
(Funcionalidades 2a, 3a, 3b y 3c). 
Indica la selección del cliente.
X(28)

FILLER
Blancos
X(76)

FCI (Códigos 08/ 28/ 36/ 37/ 38/ 48/ 63/ 68/ A8/ B8/ C8)

LONGITUD
Indicador de longitud. El valor a informar es `120`.
9(3)

PROD-ID
Identificador de producto.
X(2)

SUBPROD-ID
En el caso de las transacciones que necesiten subproducto, como ser subscripción, rescate, información de propaganda, se informará en este campo.
X(2)

SUBPROD-ID-DEST
En el caso de las subscripciones y de los rescates, se deberá informar la descripción del nombre del subproducto.
X(2)

CURRENCY-CODE
Se informa la moneda del fondo, los valores posibles son : 
`032` para pesos o `840` para dólares. 
X(3)

CURRENCY-CODE-DEST
Se informa la moneda del fondo, los valores posibles son : 
`032` para pesos o `840` para dólares. 
X(3)

CANT-CP-A-RESCATAR
Solo en el caso del rescate, se informará la cantidad de cuotas partes a rescatar.
9(9)

TXN-TYP-FLG
Para la consulta de un producto (tx 36), como se puede originar desde dos transacciones distintas, este flag indica desde cual de las dos se originó:
`2` para subscripción o `7` para consulta de información publicitaria.
X(1)

LINEA-SELECCION
Item seleccionado por el usuario según lo informa el banco.
X(37)

ID-TRANSACCIÓN
Código de identificación de transacción.
X(20)

FLAG-CONFIRMACION
Identifica una transacción a confirmar.
X(1)

TIPO-IMPRESIÓN
Envía S cuando es suscripción o R cuando es rescate.
X(1)

FILLER
Blancos
X(39)

CONSULTA DE PAGO ON LINE (Código 69)

CAMPO
DESCRIPCIÓN
LONGITUD

LONGITUD
Indicador de longitud. El valor a informar es `199`.
9(3)

DATA-TYPE
Indica que tipo de transacción ON LINE que se esta consultando. El Valor es FIJO  “01”.
X(2)

GENERAL-DATA

TERM-LN
Línea de la terminal desde donde se realizó la transacción.
X(4)

TERM-FIID
Código de la entidad dueña de la terminal que realizó la transacción.
X(4)

TERM-ID
Nombre de la terminal que realizó la transacción.
X(16)

CRD-FIID
Código de la entidad dueña de la tarjeta que realizó la transacción.
X(4)

PAN
Número de tarjeta que realizó la transacción.
9(19)

SEQ-NUM
Número de secuencia de RED LINK S.A.
9(12)

TRAN-DAT
Fecha de la transacción con formato aaMMdd.
X(6)

TRAN-TIM
Hora de la transacción con formato hhmmssll.
X(8)

POST-DATE
Fecha de negocios que maneja la Red.
X(6)

TRAN-CDE
Datos de la transacción

T-CDE
El código real de la transacción.  Nota 2*
X(2)

T-FROM
Tipo de cuenta origen que realizó la transacción
X(2)

T-TO
Tipo de cuenta destino que realizó la transacción
X(2)

NUM-CUENTA
Numero de cuenta de la transacción original.
9(19)

AMT-1
Monto de la transacción (si corresponde).
9(12)

TERM-TYP
Tipo de terminal que realizó la transacción.
X(2)

SPECIFIC-DATA
Se reserva para completar con datos de la transacción en particular.
X(79)

Si la transacción original fue encontrada debe responderse en el campo 39 con 00 (cero, cero).
Si la transacción original no fue aprobada o no existe, se debe responder en el campo 39, el código de resultado (o respuesta) 74 (no se encontró en la base de datos).

Si la transacción original no pudiera individualizarse por encontrarse varios registros con los mismos datos de entrada debería responderse con 80 (se encontraron varias ocurrencias en la base de datos).

Nota 1: Cualquier código de respuesta recibido por Link distinto de 00, 74 y 80, el sistema reintentará con otro pescador en forma cíclica.

Nota 2: En “Transferencias Inmediatas” todas las transacciones host to host recibidas por el banco con código “09XX00”, las entidades recibirán la consulta con el valor “19” en el campo “T-CDE”.

OBTENCIÓN DE LOS CAMPOS

Para obtener los campos a utilizar en la transacción con código 69 se deben seguir las instrucciones de la siguiente tabla. En la misma se encuentra el nombre del campo a obtener, si es de entrada o de salida, el número del campo del mensaje ISO desde donde se obtiene, el desplazamiento dentro del campo del mensaje ISO desde donde se obtiene y la longitud del dato a obtener.

Un campo es de entrada cuando se espera recibirlo completo en el mensaje 0200 de la transacción 69 enviada por Red Link a la entidad. Estos campos se utilizan para identificar a la transacción consultada.

Un campo es de salida cuando debe ser completado por la entidad en el mensaje 0210 de la transacción 69 que se envía hacia Red Link. Estos campos agregan información a la transacción consultada y permiten determinar si la misma se efectuó satisfactoriamente.

Cuando en la tabla dice “Se obtiene del campo ###” significa que el dato de entrada enviado o el dato de salida solicitado se encuentra el en campo ### del mensaje ISO de la transacción original consultada a través de la 69. ### es el número de campo desde donde se debe tomar el dato.

El offset indicado en cada campo debe leerse sabiendo que el primer byte de cada campo del mensaje ISO tiene offset 0.

CAMPO
INFORMACION
LONGITUD

LONGITUD
El valor a informar es `199`.
9(3)

DATA-TYPE
El Valor “01” corresponde a Pago SETI. Otro producto deberá definir otro código.
X(2)

GENERAL-DATA

TERM-LN
Dato de entrada. Se obtiene del campo 60. Offset 7.
X(4)

TERM-FIID
Dato de entrada. Se obtiene del campo 60. Offset 3.
X(4)

TERM-ID
Dato de entrada. Se obtiene del campo 41. Offset 0.
X(16)

CRD-FIID
Dato de entrada. Se obtiene del campo 61. Offset 3.
X(4)

PAN
Dato de entrada. Se obtiene del campo 35. Offset 2. Tener en cuenta que este campo contiene el TRACK2 de la tarjeta. Para obtener el PAN habrá que quedarse con los primeros números existentes hasta encontrar un carácter no numérico y luego completar con blancos a la derecha
9(19)

SEQ-NUM
Dato de entrada. Se obtiene del campo 37. Offset 0.
9(12)

TRAN-DAT
Dato de salida. Se obtiene del campo 13. Offset 0. Para generar el formato aaMMdd se debe agregar el año ya que en el mensaje ISO, el campo 13 viene con formato MMdd. (Ej: 050226)
X(6)

TRAN-TIM
Dato de salida. Se obtiene del campo 12. Offset 0. Se deben completar los últimos dos dígitos con ceros ya que el mensaje ISO tiene formato hhmmss.
X(8)

POST-DATE
Dato de salida. Se obtiene del campo 17. Offset 0. Para generar el formato aaMMdd se debe agregar el año ya que en el mensaje ISO, el campo 17 viene con formato MMdd.
X(6)

TRAN-CDE
Dato de entrada. Se obtiene del campo 3. Offset 0. 
En “Transferencias Inmediatas”, cuando en la consulta el contenido de este campo sea igual a “19XX00” debe interpretarse como “09XX00”
X(6)

NUM-CUENTA
Dato de entrada. Se obtiene del campo 102. Offset 0.
9(19)

AMT-1
Dato de entrada. Se obtiene del campo 4. Offset 0.
9(12)

TERM-TYP
Dato de entrada. Se obtiene del campo 62. Offset 3. Para uso futuro. No todas las instituciones utilizan el campo 62.
X(2)

SPECIFIC-DATA
Se reserva para completar con datos de la transacción en particular. Para uso futuro
X(79)

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

CÓDIGO-BCRA
Código del administrador del cajero.
X(3)

SERVICE-CDE
Service code de la tarjeta.
X(3)

SELECCIÓN DE MÚLTIPLES CUENTAS

LONGITUD
Indicador de longitud. El valor a informar es `010`.
9(3)

INDICADOR
Indica si el ATM soporta múltiples cuentas o no.
‘1’ Si
‘0’ No.
X(1)

FILLER

X(9)

EJEMPLO   

       ISO0140000100200B23A800128E0941A000000001600011A0110000000000030000702161
       35100477816114407020000070311           37501020099586955009=991210100000
       000008009612      03606                          BANCO DE CORRIENTES SACO
       RRIENTES   00 AA032FFFFFFFFFFFFFFFF023             00        0120094PRO1+
       0000130094PRO11100P016                11513        28995869552
               28                            0339 DE JULIO 1099          0000000
       1001 001 0430001000000000000000000000000000000000000000?

EJEMPLO

       HHTNISO0140000100200B23A800128E0961A000000001600011A390000000000000100071
       312060600016012060607130000071311           37999902650
                 003195      S1AX256                        INTERBOLD 1060 MONOG
       . CAP. FED.    BUEAR0320960B67B7B8BBFB3023             00        120;5010
       41001001001105=991210100000000008?000000010000000000000000000002651000010
       41000530      000000000000000             0120014TES1+000013BNL TES11100P
       016                1190000000600280001041000530               28
                          033SUIPACHA 815             00000005001 001 0430005000
       000000000000000000000000000000000000?

EJEMPLO

       HHTNISO0140000100200B23A800128E0941A000000001600011A812000000000041000071
       417105100877317105107140000071511           37588673000063043000=99121011
       0000000008008045      S1AX2512                       03542900517
         BS.AS.       BUEAR032FFFFFFFFFFFFFFFF02303542900517            0120014T
       ES1+000013BNL TES10100P016                1190000000600281040001543709
                   28                            033SUIPACHA 815             000
       00000001 001 0430000000000000000000000000000000000000000000?

