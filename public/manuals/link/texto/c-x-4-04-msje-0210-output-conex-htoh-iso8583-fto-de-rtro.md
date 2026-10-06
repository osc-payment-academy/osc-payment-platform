> **CONFIDENCIAL — Red LINK.** Uso interno exclusivo. NO publicar en la sección Documentación Técnica ni compartir con terceros.

# LINK — C-X-4-04_Msje 0210 Output_Conex_HtoH_ISO8583_Fto de Rtro



MESSAGE 0210	  MENSAJE DE RESPUESTA A REQUERIMIENTO DE TRANSACCION (OUTPUT B24)
			
START-OF-BASE24-HEADER-
El valor a informar es `ISO`.

BASE24-HEADER
De acuerdo al tipo de equipamiento que responde al requerimiento, los valores posibles son:

RESPUESTA AL REQUERIMIENTO ORIGINADO EN HOST:  `PROCESO AUTORIZADOR`.
   *  El valor a informar es `014000053`.

RESPUESTA AL REQUERIMIENTO ORIGINADO EN HOST:  `HOST`.
   *  El valor a informar es `014000055`.

RESPUESTA AL REQUERIMIENTO ORIGINADO EN HOST:  INTERCHANGE`.
   *  El valor a informar es `014000057`.
 

MESSAGE-TYPE-IDENTIFIER
El valor a informar es `0210`.

PRIMARY-BIT-MAP
Debe informar la presencia de los campos 1, 3, 4, 7, 11, 12, 13, 15, 17, 32, 35, 37, 39, 41, 42, 44, 49, 54, 60, 61.
En el caso de Visa informar el campo 38.
En el caso de transacciones Interbancarias o PAS, agregar el campo 55.

SECONDARY-BIT-MAP
Debe informar la presencia de los campos 100, 102, 103, 122, 123, 124, 125, 127.

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
Posiciones 01-02  =  Indicador de longitud. El valor a informar es `11`. Posiciones 03-13  =  Valor del campo. 

Campo 35
El formato es:
Posiciones 01-02  =  Indicador de longitud. El valor a informar es `37`. Posiciones 03-39  =  Valor del campo. 

Campo 37
X(12)

Campo 38
Unicamente para Visa.

Campo 39
Ver tabla de códigos de resultado.

Campo 41
X(16)

Campo 42
X(15)

Campo 44
El formato es:
Posiciones 01-02  =  Indicador de longitud. El valor a informar es `25`. Posiciones 03-03  =  Se deberá informar `0` a `2` o ` `. 
Posiciones 04-15  =  Saldo de apertura. El formato es 9(10)v99. 
Posiciones 16-27  =  Saldo disponible. El formato es 9(10)v99.

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
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `013`. Posiciones 04-07  =  Número de Institución emisora de la tarjeta.
Posiciones 08-11  =  Código que identifica a la RED. El valor a informar es `PRO1`.	
Posiciones 12-15  =  Tipos de cuentas involucradas en la transacción.
Posiciones 16-16  =  El valor a informar es `P`.

Campo 100
El formato es:
Posiciones 01-02  =  Indicador de longitud. El valor a informar es`11`.
Posiciones 03-13  =  Valor  del campo,  alineado a izquierda y relleno con BLANCOS.

Campo 102
El formato es:
Posiciones 01-02  =  Indicador de longitud. El valor a informar es `28`. Posiciones 03-30  =  Valor  del  campo,  alineado  a izquierda y relleno con BLANCOS.

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
El formato es (excepto Asignación Usuario Homebanking)
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `043`.
Posiciones 04-04  =  Tipo de cambio aplicado en la transacción. El formato es 9(01).
Posiciones 05-12  =  Tipo de cambio comprador U$S / $.El formato es 9(05)v999. Posiciones 13-20  =  Tipo de cambio vendedor U$S / $.El formato es 9(05)v999.
Posiciones 21-28  =  Tipo de cambio,  entre la moneda informada en el campo 49 y Pesos. El formato es 9(05)v999.
Posiciones 29-36  =  Tipo de cambio,  entre la moneda informada en el campo 49 y dólares. El formato es 9(05)v999.
Posiciones 37-46  =  Se deberá informar BLANCOS.

Asignación Usuarios Homebanking
Posiciones 01-03  = Indicador de longitud. El valor a informar es: `43`.
Posiciones 04-31  = Nombre Usuario acceso a nodo comunicación. El formato es: X(28)
Posiciones 32-39  = Clave de ingreso a nodo de comunicación. El formato es X(8). Posiciones 40-45  = Pin de acceso a Homebanking. El formato es: 9(6).
Posiciones 46-46  = Se deberá informar blancos.

De acuerdo al código de movimiento, el formato del campo 54 es el siguiente:

Excepto para PAGO AUTOMATICO DE SERVICIOS, TRANSACCIONES AFJP 

LONGITUD
Longitud del Primary Bit 54. El valor a informar es `100`.
9(3)

FILLER
Se deberá informar BLANCOS.
 X(12)

WITH-ADV-AVAIL
Cantidad de extracciones disponibles para  cuenta de débito o cantidad de adelantos disponibles para cuenta de crédito.
9(2)

INT-OWE-AUSTRAL
Intereses  ganados  para  cuenta  de débito  o  saldo  último  resumen en pesos para cuenta de crédito.

Ahora se utiliza para indicar si la cuenta corresponde a un consumidor final, con los siguientes valores posibles:
1 : Consumidor Final
0 : No consumidor Final

FILLER 

9(1)

9(11)

CASH-AVAIL
Dinero  disponible  para  cuenta  de débito o crédito.
9(10)v99

MIN-PAYMENT
Pago mínimo para cuenta de crédito.
9(10)v99

PAYMENT-DATE
Fecha de vencimiento de resumen para cuenta de crédito  o  fecha de saldo de apertura para cuenta de débito. El formato es AAMMDD. 
9(6)

INTEREST-RATE
Tasa  nominal anual por cash-advance para cuenta de crédito.
9(4)v99

OWE-DOLAR
Saldo último resumen en dólares para cuenta de crédito.
Ahora se utiliza como FILLER

9(10)

MIN-PAYMENT-DOLAR
Pago  mínimo en  dólares para cuenta de crédito. 
9(8)v99

PURCHASE-DOLAR
Compra  en  dólares  para  cuenta de crédito.
9(8)v99

CASH-FEE
Arancel por cash-advance para cuenta de crédito.
9(6)v99

De acuerdo al código de movimiento, el formato del campo 55 es el siguiente:

PAGO AUTOMATICO DE SERVICIOS	(Códigos 80/ 81/ 85/ 87/ 88)

LONGITUD
Indicador de longitud. El valor a informar es `112` para BNL y`113`en otro caso.
9(3)

COD-ABREV
Código de cliente abreviado.
9(2)

NRO-ENTE
Código descripcion segun Ente para el recibo. Si es `000` imprimir "CONTRIBUYENTE".Si es `001` imprimir "CLIENTE".
X (3)

IMPORTE
Importe del servicio.
9(10)v99

NRO-CLIENTE
Código de cliente.
(24)

NOMBRE-ENTE
Denominación del Ente.
(24)

VENCIM
Vencimiento del servicio. El formato es AAMMDD.
9(6)

CUOTA-AÑO
Cuota-Año. El formato es CCCAA.
 X(5)

LINEA
Línea para formateo de pantalla.
Para códigos 81 se informará:
Posición 01-03 = Código de Ente Si el código de ente es 011 - DGI Posición 04-11 = Aportes. Formato 9(06)v99.
Posición 12-19 = Contribuciones. Formato 9(06)v99.
Posición 20-32 = Relleno con blancos.
X(32)

COD-SEG
Código de seguridad en los pagos.
X(3)

MAS-DEU
Indica la deuda con el servicio.
0 = No hay más deuda que la informada.
N = Cantidad de adicionales no informadas. 
 X(1)

PAGO AUTOMATICO DE SERVICIOS  (Códigos: 82/ 83)

LONGITUD
Indivcador de longitud. El valor a informar es `360`. 
9(3)

CDE-ABREV
Código abreviado para la 830000. Próximo código abreviado para la 820000. Si no existe un próximo código abreviado, se debe informar '00'. Caso contrario, se debe informar el valor correspondiente.
X(2)

NRO-CLIENTE
Código de cliente.
X(24)

NOMBRE-ENTE
Denominación del Ente.
X(24)

CANT-LINEAS
Cantidad de líneas reales del próximo campo.
 X(2)

LINEA

DATO-CONS
 OCCURS 7 TIMES. Línea para formateo de pantalla y/o recibo. Cada occurs tiene 40 posiciones.
X(280)

FILLER
Se deberá informar BLANCOS.
 X(28)

PAGO AUTOMATICO DE SERVICIOS (Códigos 84)

LONGITUD
Indicador de longitud. El valor a informar es `360`.
9(3)

CANT-LINEAS
Cantidad de líneas reales que tiene el próximo campo.
9(2)

DATO-CONS-84
OCCURS 9 TIMES

DATO
Línea para formateo de pantalla y/o recibo.
X(32)

FILLER
Se deberá informar BLANCOS.
X(70)

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
Filler         X(10).

X(13)

RUBRO
Datos del titular.
X(15)

EJEMPLO

       ISO0140000530210B23A80012AD08418000000001600007A0110000000000010000626144
       11300000014430106260000062611509        375600147103950026D99121010
             792001      0009231                          2510000001431100000001
       43110032100            05000000000000000000044000000000000000980625000000
       000000000000000000000000000000000000000123121PRO1+0000130014PRO111   1151
       4        2871030745774                 28                            011
                 012            001 001 0430000000000000000000000000000000000000
       000000?

