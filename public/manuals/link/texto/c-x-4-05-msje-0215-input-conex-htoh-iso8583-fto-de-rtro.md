> **CONFIDENCIAL — Red LINK.** Uso interno exclusivo. NO publicar en la sección Documentación Técnica ni compartir con terceros.

# LINK — C-X-4-05_Msje 0215 Input_Conex_HtoH_ISO8583_Fto de Rtro



MESSAGE 0215		MENSAJE DE RESPUESTA DE STATEMENT (INPUT B24).

START-OF-BASE24-HEADER-INDICATOR
El valor a informar es `ISO`.                                                  

BASE24-HEADER
El valor a informar es `014000015`.

MESSAGE-TYPE-IDENTIFIER
El valor a informar es `0215`.

PRIMARY-BIT-MAP
Debe informar la presencia de los campos 1, 3, 7, 11, 12, 13, 17, 35, 37, 39, 41, 60.
En el caso de transacciones FCI, agregar el campo 55.

SECONDARY-BIT-MAP
Debe informar la presencia de los campos 102, 120, 125.
En el caso de FCI se debe agregar el campo 127.
En el caso de Plazo Fijo, agregar el campo 126.

Campo 3
Ver tabla de códigos.

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
Ver especificaciones en ¨NPC012 - Plazo Fijo\PLAZO FIJO DETALLES TÉCNICOS¨

Campo 60
El formato es : 
Posiciones 01 - 03 Indicador de longitud. Fijo 012. 
Posiciones 04 - 07 Número de la institución dueña del ATM. 
Posiciones 08 - 11 Código que identifica la Red. Fijo PRO1. 
Posiciones 12 - 15 Diferencia horario del ATM con la red. Fijo +000.

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
Statement print data. El formato es : 
Posiciones 01 - 03 Indicador de longitud. Fijo 372. 
Para últimos movimientos, recompensas, últimos débitos automáticos.
Posiciones 04 - 05 Indicador de página. Valores posibles 01-99, 
1P Una sola pag. 
LP Ultima pag. 
Posiciones 06 - 11 Fecha de los mov. Formato AAMMDD. 
Posiciones 12 - 13 Cant. de líneas de cabecera. 
Posiciones 14 - 15 Cant. de caracteres por línea. 
Posiciones 16 - 375 Líneas a imprimir. Ver diseño = 360 Bytes. 

De acuerdo al código de movimiento, el formato del campo 55 es el siguiente:

FCI (Códigos 08/ 18/ 28/ 36/ 37/ 38/ 48/ 63/ 68/ A8/ B8/ C8)

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

ID-TRANSACCION
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

TRANSACCIONES PLAZO FIJO

Para todas las transacciones, se usará el campo 125 para la información a imprimir en el 
ticket. La estructura del campo es la misma que se usa para Últimos Movimientos.

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

Campo 126
MULTIPLES-PF                    REDEFINES DATA.
    05 CANT-PF                      PIC X(2).
    05 TITULO                       PIC X.
    05 INFO                         OCCURS 7 TIMES.
       08 LINEA                     PIC X(28).
    05 FILLER                       PIC X(481).

“9904” 
CONSULTA DE SALDO DE PLAZO FIJO 
SUSPENSION/ACTIVACION DE RENOVACION AUTOM.
CAMBIO DE CTA. ASOCIADA 

LONGITUD
Indicador de longitud. El valor a informar es `139`.
9(3)
DATA

X(608)
MULTIPLES-PF
REDEFINES DATA.

CANT-PF
Cantidad de Plazos Fijos. Como máximo puede haber 7PFs si no se envía el TITULO, caso contrario enviarán 6PFs.
X(2)

TITULO
Indicador de título (S/N). El título viene en una ocurrencia dentro de la estructura INFO.LINEA, este dato es opcional.
X(S/N)

INFO
OCCURS 7 TIMES

LINEA 

X(28)
FILLER

X(481)

EJEMPLO

       ISO0140000150215A23880002A80001000000000040001089410000717110907020223110
       9070717071737588673583084000000=99121011000000000 006048      0001138
              012BNL PRO1+000280009993143695               033SUIPACHA 815 1ER.
       PISO   000000003721P9807170136FECHA DESCRIPCION           IMPORTE 02/07 C
       AJERO AUTOM.          100,00-06/07 CAJERO AUTOM.          200,00-07/07 CA
       JERO AUTOM.          500,00-10/07 CAJERO AUTOM.          500,00-15/07 EFE
       CTIVO               500,00-15/07 EFECTIVO             1.000,00-16/07 CAJE
       RO AUTOM.          700,00-16/07 CAJERO AUTOM.          300,00-      SU SA
       LDO ES : $        682,28

