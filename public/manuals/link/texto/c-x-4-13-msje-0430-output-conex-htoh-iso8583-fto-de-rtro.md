> **CONFIDENCIAL — Red LINK.** Uso interno exclusivo. NO publicar en la sección Documentación Técnica ni compartir con terceros.

# LINK — C-X-4-13_Msje 0430 Output_Conex_HtoH_ISO8583_Fto de Rtro



MESSAGE 0430		MENSAJE DE REVERSA DE TRANSACCION (OUTPUT B24).

START-OF-BASE24-HEADER-INDICATOR
El valor a informar debe ser 'ISO'.

BASE24-HEADER
El valor a informar es `014000005`.
 

MESSAGE-TYPE-IDENTIFIER
El valor a informar es `0430`.

PRIMARY-BIT-MAP
Debe informar la presencia de los campos 1, 3, 4, 7, 11, 32, 35, 37, 39, 41, 49.
                                        

SECONDARY-BIT-MAP
Debe informar que en el mensaje no se incluye ningun campo.

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

EJEMPLO

       ISO0140000150430B22000012A80800000000040060000007100000000000047460914165
       54518916011540001     374398183506325006=04011213680000000000189160165653
       0001163679        03202001891601656530914165653  0000000000000028
                           28                            ?
