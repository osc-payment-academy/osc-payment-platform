> **CONFIDENCIAL — Red LINK.** Uso interno exclusivo. NO publicar en la sección Documentación Técnica ni compartir con terceros.

# LINK — C-X-4-12_Msje 0430 Input_Conex_HtoH_ISO8583_Fto de Rtro



MESSAGE 0430		MENSAJE DE REVERSA DE TRANSACCION (INPUT B24).

START-OF-BASE24-HEADER-INDICATOR
El valor a informar debe ser 'ISO'.

BASE24-HEADER
El valor a informar es `014000005`.
 

MESSAGE-TYPE-IDENTIFIER
El valor a informar es `0430`.

PRIMARY-BIT-MAP
Debe informar la presencia de los campos 1, 3, 4, 7, 11, 32, 35, 37, 39, 41, 49.
                                        

SECONDARY-BIT-MAP
90.

Campo 3
Ver tabla de códigos.

Campo 4
9(12)

Campo 7
mmddhhmmss 9(10)

Campo 11
9(6)

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
Ver tabla de códigos.

Campo 41
X(16)

Campo 49
Los valores posibles son: 
`032`  -  PESOS. 
`076`  -  REALES. 
`840`  -  DOLARES. 
`858`  -  PESOS URUGUAYOS.
`996`  -  LECOP.

Campo 90
El formato es: 
Posiciones 01-04  =  Tipo de mensaje original. El valor a informar es ‘0200’.
Posiciones 05-16  =  Número de secuencia original, alineado a izquierda y relleno con CEROS. 
Posiciones 17-20  =  Fecha de la transacción original (mmdd). 
Posiciones 21-28  =  Hora de la transacción original, alineado a izquierda y relleno con BLANCOS. 
Posiciones 29-32  =  Fecha de negocios de la transacción original (mmdd). 
Posiciones 33-42  =  Se deberá informar CEROS.

EJEMPLO

                ISO0140000150430B22000012A80800000000040000000000110000000000010000917105
       219014364118888888888837501056300065482001=991210100000
       000008003025      68S1AX259         032	0200003025      0917104425760917
       0000000000

