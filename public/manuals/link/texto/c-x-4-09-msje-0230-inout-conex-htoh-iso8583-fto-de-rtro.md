> **CONFIDENCIAL — Red LINK.** Uso interno exclusivo. NO publicar en la sección Documentación Técnica ni compartir con terceros.

# LINK — C-X-4-09_Msje 0230 InOut_Conex_HtoH_ISO8583_Fto de Rtro



MESSAGE 0230		MENSAJE DE REVERSA DE TRANSACCION (INPUT/OUTPUT B24).

START-OF-BASE24-HEADER-INDICATOR
El valor a informar debe ser 'ISO'.

BASE24-HEADER
El valor a informar es `014000005`.
 

MESSAGE-TYPE-IDENTIFIER
El valor a informar es `0230`.

PRIMARY-BIT-MAP
Debe informar la presencia de los campos 1, 3, 4, 7, 11, 32, 35, 37, 39, 41, 49.
                                        

SECONDARY-BIT-MAP
Debe informar la presencia de los campos 102 y 103.

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

Campo 102
El formato es: 
Posiciones 01-02  =  Indicador de longitud. El valor a informar es `28`.
Posiciones 03-30  =  Valor  del  campo,  alineado a izquierda y relleno con BLANCOS.

Campo 103
El formato es: 
Posiciones 01-02  =  Indicador de longitud. El valor a informar es `28`.
Posiciones 03-30  =  Valor  del  campo,  alineado  a izquierda y relleno con BLANCOS.

EJEMPLO

       ISO0140000150230B22000012A80800000000000060000000110000000000010000917105
       213014362118888888888837501056300065482001=991210100000000008003025      
       00S1AX259         032280003000006548206            28
                                

