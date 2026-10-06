> **CONFIDENCIAL — Red LINK.** Uso interno exclusivo. NO publicar en la sección Documentación Técnica ni compartir con terceros.

# LINK — C-X-4-03_Msje 0210 Input_Conex_HtoH_ISO8583_Fto de Rtro



MESSAGE 0210		MENSAJE DE RESPUESTA A REQUERIMIENTO DE TRANSACCION (INPUT B24)

START-OF-BASE24-HEADER-INDICATOR
El valor a informar es `ISO`.

BASE24-HEADER
De acuerdo al tipo de equipamiento que responde al requerimiento, los valores posibles son:
RESPUESTA AL REQUERIMIENTO ORIGINADO EN ATM:  `HOST`
El valor a informar es `014000015`.
RESPUESTA AL REQUERIMIENTO ORIGINADO EN HOST:  `HOST`.
El valor a informar es `014000055`.
RESPUESTA AL REQUERIMIENTO ORIGINADO EN INTERCHANGE:  HOST`.
El valor a informar es `014000075`.

MESSAGE-TYPE-IDENTIFIER
El valor a informar es `0210`.

PRIMARY-BIT-MAP
Debe informar la presencia de los campos 1, 3, 4, 7, 11, 12, 13, 15, 17, 32, 35, 37, 39, 41, 42, 44, 49, 54, 60, 61. 
En el caso de transacciones Interbancarias, agregar el campo 55.

SECONDARY-BIT-MAP
Debe informar la presencia de los campos 100, 102, 103, 122, 123, 124, 125, 127.
En el caso de adelanto o consulta de cuenta de crédito en cuotas o selección de múltiples cuentas para los ON Line puro, agregar el campo 126.
En el caso de transacciones de Plazo fijo ver  el campo 125.
Para todas las transacciones, se usará el campo 125 para la información a imprimir en el ticket. La estructura del campo es la misma que se usa para Últimos Movimientos.
 

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

Campo 44
El formato es:
Posiciones 01-02  =  Indicador de longitud. El valor a informar es `25`.
Posiciones 03-03  =  Se deberá informar `2`.
Posiciones 04-15  =  Saldo de apertura. El formato es 9(10)v99. 
Posiciones 16-27  =  Saldo disponible. El formato es 9(10)v99.

Campo 49
Los valores posibles son: 
`032`  =  PESOS. 
`076`  =  REALES. 
`840`  =  DOLARES. 
`858`  =  PESOS URUGUAYOS.

Campo 54
Ver nota campo 54.

Campo 55
Ver nota campo 55.

Campo 60
El formato es: 
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `012`.
Posiciones 04-07  =  Número de  Institución dueña del ATM. Para el código de transacción 29 la institución será 5892 si es Banelco 
Posiciones 08-11  =  Código que identifica a la RED dueña del ATM. Para el código de transacción 29 la RED será BANE si es Banelco
Posiciones 12-15  =  Diferencia horaria con la RED. El valor a informar es`+000`.

Campo 61
El formato es:
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `013`.
Posiciones 04-07  =  Número de Institución emisora de la tarjeta. 
Posiciones 08-11  =  Código que identifica a la RED. El valor a informar es `PRO1`.
Posiciones 12-15  =  Tipos de cuentas involucradas en la transacción. 
Posiciones 16-16  =  El valor a informar es `P`.

Campo 100
El formato es:
Posiciones 01-02  =  Indicador de longitud. El valor a informar es `11`.
Posiciones 03-13  =  Valor  del  campo,  alineado  a izquierda y relleno con BLANCOS.

Campo 102
El formato es: 
Posiciones 01-02  =  Indicador de longitud. El valor a informar es `28`.
Posiciones 03-30  =  Valor  del  campo,  alineado  a izquierda y relleno con BLANCOS.

Campo 103
El formato es:
Posiciones 01-02  =  Indicador de longitud. El valor a informar es `28`. Posiciones 03-30  =  Valor  del  campo,  alineado  a izquierda y relleno con BLANCOS.

Campo 122
El formato es:
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `011`. Posiciones 04-14  =  Valor  del  campo,  alineado  a izquierda y relleno con BLANCOS.

Campo 123
El formato es:
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `012`.
Posiciones 04-15  =  Valor del campo. El formato es 9(10)v99.

Campo 124
El formato es:
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `001`.
Posiciones 04-04  =  Los valores posibles son: `0`  =  CERO. ` `  =  BLANCO.

Campo 125 
El formato es:
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `001`.
Posiciones 04-04  =  Los valores posibles son:
` `  =  BLANCO.
`0`  =  CERO.
`1`  =  UNO. 
`2`  =  DOS.

Plazo fijo
     STMT                        REDEFINES DATA.
        PAGE-IND                 PIC X(2).
        LST-STMT-DAT             TYPE DAT.
        HEADHER-LINES            PIC X(2).
        COLUMN-LINES             PIC X(2).
        STMT-FLD                 PIC X(360).

Campo 126
Ver nota campo 126.

Campo 127
El formato es (excepto Asignación Usuario Homebanking) 
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `043`.
Posiciones 04-04  =  Tipo de cambio aplicado en la transacción.El formato es 9(01).
Posiciones 05-12  =  Tipo de cambio comprador U$S / $.El formato es 9(05)v999. Posiciones 13-20  =  Tipo de cambio vendedor U$S / $.El formato es 9(05)v999. Posociones 21-28  =  Tipo de cambio,  entre la moneda informada en el campo 49 y Pesos. El formato es 9(05)v999. 
Posiciones 29-36  =  Tipo de cambio,  entre la moneda informada en el campo 49 y dólares. El formato es 9(05)v999. 
Posiciones 37-46  =  Se deberá informar BLANCOS.

ASIGNACION DE USUARIO HOMEBANKING 
Posiciones 01-03  =  Indicador de longitud. El valor a informar es: '43'. Posiciones 04-31  =  Nombre Usuario acceso a nodo de Comunicación. El formato es:X(28).
Posiciones 32-39  =  Clave de ingreso a nodo de comunicación. El formato es X(8). Posiciones 40-45  =  PIN de acceso a Homebanking. El formato es: 9(6). 
Posiciones 46-46  =  Se debe informar blancos. 

De acuerdo al código de movimiento, el formato del campo 54 es el siguiente:

Excepto para PAGO AUTOMATICO DE SERVICIOS, TRANSACCIONES AFJP, TRANSFERENCIAS MINORISTA CBU y PLAZO FIJO.

LONGITUD
Longitud del Primary Bit 54. El valor a informar es `100`.
9(3)

FILLER
Se deberá informar BLANCOS.
 X(12)

WITH-ADV-AVAIL
Cantidad de extracciones disponibles para  cuenta de débito o cantidad de adelantos disponibles para cuenta de crédito.
9(2)

INT-OWE- AUSTRAL
Para cuenta de crédito representa el  saldo  del último  resumen en pesos o los intereses ganados para cuenta débito.

Para las cajas de ahorro y cuentas corrientes, representa el disponible para compras en comercios.
9(10)v99

CASH-AVAIL
Dinero  disponible  para  cuenta  de débito o crédito.
9(10)v99

MIN-PAYMENT
Pago mínimo para cuenta de crédito.
9(10)v99

PAYMENT-DATE
Fecha de vencimiento de resumen para cuenta de crédito o fecha de saldo de apertura para cuenta de débito. El formato es AAMMDD.
 
Ahora se utiliza para informar la fecha de alta de la cuenta. Sólo 
para las transacciones de consulta y extracción
9(6)

INTEREST-RATE
Tasa  nominal anual por cash-advance para cuenta de crédito.Ahora se utiliza sólo par depósitos en efectivo
9(4)v99

OWE-DOLAR
Saldo último resumen en dólares para cuenta de crédito.

Para las cajas de ahorro y cuentas corrientes, representa el disponible para pagos Link.
9(8)v99

MIN-PAYMENT-DOLAR
Pago  mínimo en  dólares para cuenta de crédito. 
9(8)v99

PURCHASE-DOLAR
Compra  en  dólares  para  cuenta de crédito.
9(8)v99

CASH-FEE
Arancel por cash-advance para cuenta de crédito.
9(6)v99

PAGO AUTOMATICO DE SERVICIOS	(Códigos 80/ 81/ 82/ 83/ 84/ 85/ 87/ 88/ 89)

LONGITUD
Longitud del Primary Bit 54. El valor a informar es `100`.
9(3)

CDE-ID-CUSTOM
CODIGO DE IDENTIFICACION DEL CLIENTE. El contenido de estos campos debe ser igual al enviado en el mensaje de requerimiento de transacción (0200).

 

CDE-ENTE
Código de Ente.
X(3)

CDE-CUSTOM
Código de cliente.
X(19)

CTA-ANIO
Nro. de cuota y año.
9(5)

FILLER
Se deberá informar BLANCOS.
 X(73)

TRANSACCIONES AFJP	(Codigos 210013 / 911300)

LONGITUD
Longitud del Primary Bit 54. El valor a informar es `100`. 
9(3)

NOMBRE-AFJP
Nombre de la AFJP.
X(11)

FILLER
Se deberá informar BLANCOS.
 X(78)

TRANSFERENCIA MINORISTA (Códigos 1B / 2D)

LONGITUD
Longitud del Primary Bit 54. El valor a informar es `023`.
9(3)

CBU
Número de clave bancaria uniforme.
X(22)

FILLER
Se deberá informar BLANCOS.
X(98)

PLAZO FIJO (Códigos 37/ 18/ 38/ 63/ 68/)

LONGITUD
Longitud del Primary Bit 54. El valor a informar es `120`.
9(3)

Plazo
En la subscripción, este campo indica la cantidad de días indicada por el cliente.
En la Consulta Publicitaria por Plazo, contendrá la cantidad de días ingresada por el cliente.

X(3)

Importe
En la Consulta Publicitaria por Importe, contendrá el importe ingresado por el cliente (con 2 posiciones decimales
X(10)

FORMA-RENOVACION
En la subscripción, indica la forma de renovación elegida por el cliente. Puede valer “N”, “T” o “P”, según sea No renovable, Renovable Totalmente o Renovable Parcialmente.
Para la Activación de renovación automática, puede valer “T” o “P”.
PIC X.

AUTO-RENOVACION
Este campo indica la Suspención (“S”)/Activación (“A”) de renovación automática para la transacción 68.
PIC X

TIPO-PF
Este campo indica el tipo de Plazo Fijo para la consulta publicitaria y para la constitución. Los valores posibles son:
“T”	 Tradicional
“P”	 Precancelable
“V”	 De tasa variable encuesta
“B”	 De tasa variable baibor
     “C” 	 Ajustable por CER. 
PIC X

OPCION
Este campo se utiliza luego de la selección de Plazo Fijo para los casos de Múltiples Plazos Fijos. 
(Funcionalidades 2a, 3a, 3b y 3c). 
Indica la selección del cliente.
X(28)
FILLER

X(76)

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
Institución Emisora de la cuenta. Para el código de transacción 09 la  institución será 5892 si es Banelco
X(4)

TYP
Tipo de cuenta.
X(2)

ACCT-NUM
Número de cuenta hacia.
X(19) 

FIID-CPF
Institución a la cual pertenece la cuenta hacia. Para el código de transacción 09 la  institución será 5892 si es Banelco
Si se trata de donaciones, este campo se redefine de la siguiente manera:
Ente           X(3)
Filler         X(10)

X(13)  

RUBRO
Datos del titular.
X(15)

CONSULTA DE PAGO ON LINE (Código 69)

CAMPO
DESCRIPCIÓN
LONGITUD

LONGITUD
Indicador de longitud. El valor a informar es `199`.
9(3)

DATA-TYPE
Indica que tipo de transacción ON LINE que se esta consultando. El Valor “01” corresponde a Pago SETI.
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
El código real de la transacción.
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

Nota: Cualquier código de respuesta recibido por Link distinto de 00, 74 y 80, el sistema reintentará con otro pescador en forma cíclica.

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

TNA-DÓLAR
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

SELECCIÓN DE MÚLTIPLES CUENTAS

LONGITUD
Indicador de longitud. El valor a informar es `354`.
9(3)

ACCT

MULT
OCCURS 2 TMES

ACCT-TYP
Tipo de cuentas
X(2)

CNT
Cantidad de cuentas informadas (de 1 a 5)
X(1)

FILLER

X(1)

INFO
OCCURS 5 TIMES

NUM
Número de la cuenta
X(19)

FILLER

X(1)

DESC
Descripción
X(10)

FILLER

X(46)

EJEMPLO

      ISO0140000150210B23A80012AD08418000000001600007A3120000000000000000626144
      05602253714405606260626062611509        3731413141191001103662=9912
            003992      0001054                          2520000000000000000000
      02363032100            00000000000000000000032363000000000000000000000000
      00000000000000000000000000000000000000012BNL PRO1+0000133121PRO10000P1150
      9        280000001910015216094         280000000000000000000         0113
      121       012000000000000001 001 0430000000000000000000000000000000000000
      000000

EJEMPLO

       ISO0140000550210B23A80012AD08418000000001600007A8120000000000410000714171
       34300877317134307140000071511           37588673000063043000=991210110000
       000008008045      00S1AX2512                       2520000000435000000000
       4350003210003542900517           0000000000000000000000000000000000000000
       000000000000000000000000000000000000000120014TES1+000013BNL TES10100P1190
       000000600281040001543709               28                            0119
       0000000600012000000000000001 001 043000000000000000000000000000000000

