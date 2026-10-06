> **CONFIDENCIAL — Red LINK.** Uso interno exclusivo. NO publicar en la sección Documentación Técnica ni compartir con terceros.

# LINK — C-X-4-02_Msje 0205 Output_Conex_HtoH _ISO8583_Fto de Rtro



MESSAGE 0205		MENSAJE DE RESPUESTA DE STATEMENT (OUTPUT B24).

 START-OF-BASE24-HEADER-INDICATOR
El valor a informar es `ISO`.

BASE24-HEADER
El valor a informar es `014000055`.

MESSAGE-TYPE-IDENTIFIER
El valor a informar es `0205`.

PRIMARY-BIT-MAP
Debe informar la presencia de los campos 1, 3, 7, 11, 12, 13, 17, 35, 37, 39, 41, 60, 62. 

SECONDARY-BIT-MAP
Debe informar la presencia de los campos 102, 120, 125, 127.
En el caso de Plazo Fijo, agregar el campo 126.

Campo 3
Ver tabla de códigos.

Campo 7
Mmddhhmmss 9(10)

Campo 11
9(6)

Campo 12
hhmmss 9(6)

Campo 13
yymm 9(4)

Campo 17
mmdd 9(4)

Campo 35
El formato es :
Posiciones 01 - 02 Indicador de longitud. Fijo 37. 
Posiciones 03 - 39 Valor del campo.      

Campo 37
X(12)

Campo 39
Valores posibles: 
00 - Aprobada  
05 - Rechazada.

Campo 41
X(16)

Campo 54
Ver nota campo 54.

Campo 60
El formato es :
Posiciones 01 - 03 Indicador de longitud. Fijo 012. 
Posiciones 04 - 07 Número de la institución dueña del ATM. 
Posiciones 08 - 11 Código que identifica la Red. Fijo PRO1. 
Posiciones 12 - 15 Diferencia horario del ATM con la red. Fijo +000.

Campo 62
Es condicional.
El formato es:
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `025`.
Posiciones 04-05  =  Tipo de terminal en la que se realiza la transacción.
Posiciones 06-28  =  Informar blancos.

Campo 102
El formato es : 
Posiciones 01 - 02 Indicador de longitud. Fijo 28. 
Posiciones 03 - 30 Valor del campo, alineado a izquierda y relleno con blancos.

Campo 120
El formato es : 
Posiciones 01 - 03 Indicador de longitud. Fijo 033. 
Posiciones 04 - 28 Valor del campo, alineado a izquierda y relleno con blancos. Posiciones 29 - 32 Sucursal del cajero. 
Posiciones 33 - 36 Región del cajero.

Campo 125
Statement print data, Movimientos o resumen a imprimir. El formato es : 
Posiciones 01 - 03 Indicador de longitud. Fijo 372. 
Posiciones 04 - 05 Indicador de página. Valores posibles 01-99, 
1P Una sola pag. 
LP Ultima pag. 
Posiciones 06 - 11 Fecha de los mov. Formato AAMMDD. 
Posiciones 12 - 13 Cant. de líneas de cabecera. 
Posiciones 14 - 15 Cant. de caracteres por línea. 
Posiciones 16 - 375 Líneas a imprimir. Ver diseño.
----------------------------------------------------------------------------------
Si se trata de una transacción 89, el formato es el explicado en el diseño.
Posiciones 01 - 03 Indicador de longitud. Fijo 372. 
Posiciones 04 - 05 Indicador de página. Valores posibles 01-99, 
1P Una sola pag. 
LP Ultima pag. 
Posiciones 06 – 11 Fecha de los mov. Formato AAMMDD. 
Posiciones 12 – 13 Cant. de líneas de cabecera. 
Posiciones 14 - 15 Cant. de caracteres por línea. 
Posiciones 16 - 375 Ver diseño.
Campo 126
MULTIPLES-PF                    REDEFINES DATA.
    05 CANT-PF                      PIC X(2).
    05 TITULO                       PIC X.
    05 INFO                         OCCURS 7 TIMES.
       08 LINEA                     PIC X(28).
    05 FILLER                       PIC X(481).

Campo 127
El formato es: 
Posiciones 01-03  =  Indicador de longitud. El valor a informar es `043`.
Posiciones 04-07  =  Indica la región a la cuál pertenece el ATM, para transacciones en dólares. Los valores posibles son: 
`0000`  =  CAPITAL Y GRAN BUENOS AIRES. 
`0001`  =  USHUAIA. 
`0002`  =  RESTO INTERIOR DEL PAIS. 
`0005`  =  URUGUAY / BRASIL / CIRRUS. 

Los cuatro campos siguientes deberán contener los valores informados en la consulta de tipo de cambio,  si la misma fue la transacción anterior y dentro del último minuto. En caso contrario, informar CEROS. 
Posiciones 08-15 =  Tipo de cambio comprador U$S / $.El formato es 9(05)v999. Posiciones 16-23 =  Tipo de cambio vendedor U$S / $.El formato es 9(05)v999. Posiciones 24-31 =  Tipo de cambio,  entre la moneda informada en el campo 49 y Pesos. El formato es 9(05)v999. 
Posiciones 32-39  =  Tipo de cambio,  entre la moneda informada en el campo 49 y Dólares. El formato es 9(05)v999.
Posiciones 40-46  =  Se deberá informar CEROS.

De acuerdo al código de movimiento, el formato del campo 125 es el siguiente:

TRANSACCIONES PAS (Códigos validos: 89)

COD-ABR
Código de cliente abreviado.
9(2)

COD-ENTE.
Código descripción según Ente para el recibo. Si es `000` imprimir "CONTRIBUYENTE". Si es `001` imprimir "CLIENTE".
X (3)

NRO-CLIENTE
Código de cliente.
(19)

COD-SERV.
Código de servicio.
(24)

DESC-ENTE
Denominación del Ente.
(24)

CANT-DEUDAS
Cantidad de deudas.
9

INFO
Ocurre 7 veces.

NRO-OPC
Número de opción.
9

LINEA
Línea para formateo de pantalla.
Posición 01-04 = Filler.
Posición 05-07 = Cuota.
Posición 08-08 = Filler (/).
Posición 09-10 = Año.
Posición 11-11 = Filler. 
Posición 12-13 = Día (DD).
Posición 14-14 = Filler (/). 
Posición 15-16 = Mes (MM).
Posición 17-17 = Filler (/). 
Posición 18-19 = Año (AA).
Posición 20-28 = Monto de la deuda (999999,99 especificando en la posición 26 la coma).
X(28)

USO-FUTURO
Para uso futuro.
X(84)

USER-FLD
Filler
 X(308)

TRANSACCIONES PLAZO FIJO

Para todas las transacciones, se usará el campo 125 para la información a imprimir en el ticket. La estructura del campo es la misma que se usa para Últimos Movimientos.

    02 SECNDRY-RSRVD6-PRVT 

LEN

9(3)
DATA

X(680)
STMT
REDEFINES DATA

PAGE-IND

X (2)

LST-STMT-DAT
TYPE DAT.

HEADHER- LINE 

X(2)

STMT-FLD

X(360)

De acuerdo al código de movimiento Plazo Fijo, el formato del campo 54 es el siguiente:
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
De acuerdo al código de movimiento, el formato del campo 127 es el siguiente:

TRANSACCIONES AFJP (Códigos validos: 941300)

LONGITUD
Longitud del Secondary Bit 127. El valor a informar es `043`.
9(3)

NOMBRE-AFJP
Nombre de la AFJP.
X(11)

VALOR-CUOTA-PARTE
Valor de la cuota - parte.
9(7)V9999

SALDO-ANTERIOR
Saldo anterior expresado en cuotas partes. 
9(8)V9999

SAVE-POST-DATE
Su formato es: AAMMDD
9(6)

FILLER
Se deberá informar CEROS.
9(3)

EJEMPLO

        ISO0140000550215A23880002A800010000000000400010A941300070115003300000015
        2180701070237589844202250844846D991210100000000069204401      0012251
               0123121PRO1+0002820225084484                 033
               000000003721P9806261130                              FECHA   CONC
        PTO   CTAS/PARTE 06/98 APOR.OBLIG        4,759106/98 APOR.VOL.         0
        000006/98 SEG./COMIS        1,633206/98 BONIFICAC.        0,0000
                             SDO. ACT. C/PTE:        3,1259
                     ES TIEMPO DE AHORRO           ES TIEMPO DE SIEMBRA     0000
        0000000000000000000000000043  SIEMBRA  00000169654       00000980702000?

