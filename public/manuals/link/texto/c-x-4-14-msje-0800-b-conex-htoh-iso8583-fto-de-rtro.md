> **CONFIDENCIAL — Red LINK.** Uso interno exclusivo. NO publicar en la sección Documentación Técnica ni compartir con terceros.

# LINK — C-X-4-14_Msje 0800 B_Conex_HtoH_ISO8583_Fto de Rtro



MESSAGE 0800		MENSAJE DE REQUERIMIENTO DE CONTROL.

START-OF-BASE24-HEADER-INDICATOR
El valor a informar es `ISO`.

BASE24-HEADER
El valor a informar es `004000040`.

MESSAGE-TYPE-IDENTIFIER
El valor a informar es `0800`.

PRIMARY-BIT-MAP
Debe informar la presencia de los campos 1, 7, 11.

SECONDARY-BIT-MAP
Debe informar la presencia del campo 70. 

Campo 7
mmddhhmmss 9(10)

Campo 11
9(6)

Campo 70
Los valores posibles son:
`001`  -  LOGON.
`002`  -  LOGOFF.
`301`  -  ECHO-TEST.

EJEMPLO

       ISO0140000000800822000000000000004000000000000000626144256000030301

