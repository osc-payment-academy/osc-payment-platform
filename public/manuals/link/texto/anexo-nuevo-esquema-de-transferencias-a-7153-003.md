> **CONFIDENCIAL — Red LINK.** Uso interno exclusivo. NO publicar en la sección Documentación Técnica ni compartir con terceros.

# LINK — Anexo-Nuevo Esquema de Transferencias - A 7153 (003)

                                                        Referencia
                   ANEXO
                                                        Vigente desde   30/10/2025

  NUEVO ESQUEMA DE TRANSFERENCIAS                       Capítulo            1

        MENSAJERIA HTH Y EXTRACT                        Página              1

                           ANEXO
NUEVO ESQUEMA DE TRANSFERENCIAS
       MENSAJERIA HTH Y EXTRACT

        Este documento contiene información CONFIDENCIAL
y tal información no puede ser cedida a terceros por ningún motivo

 Para su divulgación se debe contar con el permiso por escrito del
      dueño de la información que contiene este documento
                                                                                        Referencia
                                           ANEXO
                                                                                        Vigente desde         30/10/2025

                       NUEVO ESQUEMA DE TRANSFERENCIAS                                  Capítulo                      1

                             MENSAJERIA HTH Y EXTRACT                                   Página                        2

INDICE
 1.   Objetivo .................................................................................................. 3
 2.   Descripción general............................................................................... 3
 3.   Mensajería Host to Host ........................................................................ 3
 3.1. Mensajes................................................................................................. 3
 3.1.1.   Mensaje 0220 .................................................................................. 3
 3.1.2.   Mensaje 0230 .................................................................................. 5
 3.1.3.   Mensaje 0420 .................................................................................. 6
 3.1.4.   Mensaje 0430 .................................................................................. 8
 3.2. Redefinición del campo 55 - PRI-RSRVD1-ISO ................................... 9
 3.3. Tokens .................................................................................................. 10
 3.3.1.   Token “PE” ................................................................................... 10
 3.3.2.   Token “Q7” ................................................................................... 11
 3.3.3.   Token “QY” (NUEVO) .................................................................. 11
 3.3.4.   Token “RL”................................................................................... 12
 3.3.4.1. TAGS (NUEVO) ............................................................................ 12
 4.   Archivo Extract .................................................................................... 13
 4.1. Extract de transacciones .................................................................... 13
 4.2. Extract de transferencias .................................................................... 13
 5.   Observaciones ..................................................................................... 16
                                                                                         Referencia
                                             ANEXO
                                                                                         Vigente desde         30/10/2025

                         NUEVO ESQUEMA DE TRANSFERENCIAS                                 Capítulo                    1

                               MENSAJERIA HTH Y EXTRACT                                  Página                      3

     1. Objetivo

Describir las adecuaciones realizadas por Link en la mensajería Host to Host y Extract, con el fin de habilitar
la recepción de los créditos de transferencias Push originadas desde cuentas virtuales (CVU).

     2. Descripción general

Link incorporó un nuevo tipo de crédito de transferencia identificado con el código “C” con el fin de que
las entidades puedan reconocer las transferencias Push originadas desde cuentas virtuales (CVU) y
acreditadas en las cuentas bancarias (CBU) de sus clientes.

En la mensajería Host to Host se agregó un nuevo token denominado “QY”, que incluye información
detallada tanto del originante como del destinatario de la transferencia, y dos nuevos tags en el token
“RL”:
    • “TTRN” :Tipo de transacción.
    •    “TRID”: Identificador único de la transferencia generado por la PSP.

Asimismo, en el extract de transferencias, en su versión “ORIG/DEST”, se añadió una redefinición
denominada “TRANSFERENCIA-PUSH-CVU” y un nuevo campo “TRANSF-ID” para informar los
nuevos datos.

     3. Mensajería Host to Host

    Transacción           Tipo de transacción              Descripción
    29                    C                                Crédito de transferencia PUSH – CVU

         3.1. Mensajes

             3.1.1. Mensaje 0220

      Bit          Campo             Tipo                 Descripción                               Detalles
     P-001   SECONDARY BITMAP        X(16)    Bitmap secundario                          Aquí se informarán como
                                                                                         presentes en el mensaje los
                                                                                         campos que figuran a
                                                                                         continuación.
     P-003   PROCESSING CODE          X(6)    Se informa en las siguientes               Se completa con “2900XX”
                                              posiciones:                                Donde XX corresponde al tipo
                                              1-2: código de transacción.                de cuenta.
                                              3-4: tipo de cuenta que recibe el débito.
                                              5-6: tipo de cuenta que recibe el
                                              crédito.
     P-004   TRAN-AMT                9(12)    Monto de la operación                     Sin cambios respecto a la solución
                                              Formato: 10 enteros + 2 decimales         actual.

     P-007   TRANSMISSION DATE       9(10)    Fecha y hora de transmisión del mensaje    Sin cambios respecto a la solución
             AND TIME                                                                    actual
     P-011   SYSTEMS TRACE            9(6)    Número de mensaje usado para               Sin cambios respecto a la solución
             AUDIT NUMBER                     establecer la correspondencia de una       actual
                                              respuesta y su original
     P-012   LOCAL TRANSACTION        9(6)    Hora local en que comenzó la transacción   Sin cambios respecto a la solución
             TIME                                                                        actual
                                                                                     Referencia
                                       ANEXO
                                                                                     Vigente desde         30/10/2025

                   NUEVO ESQUEMA DE TRANSFERENCIAS                                   Capítulo                    1

                          MENSAJERIA HTH Y EXTRACT                                   Página                      4

 Bit          Campo           Tipo                   Descripción                                Detalles
P-013   LOCAL TRANSACTION      9(4)     Fecha calendario en que comenzó la           Sin cambios respecto a la solución
        DATE                            transacción                                  actual
P-015   SETL-DAT               9(4)     Fecha de negocio a que corresponde la        Sin cambios respecto a la solución
                                        transacción. Formato mmdd.                   actual
P-017   CAPTURE DATE           9(4)     Fecha de negocio en que la transacción       Sin cambios respecto a la solución
                                        fue procesada                                actual
P-032   ACQUIRING             9(11)     Número de Identificación de la institución   Sin cambios respecto a la solución
        INSTITUTION                     a la que pertenece la terminal               actual
        IDENTIFICATION CODE
P-035   TRACK 2 DATA          X(37)     Track 2 de la tarjeta                        Sin cambios respecto a la solución
                                                                                     actual
P-037   RETRIEVAL             X(12)     Número asignado por el originador del        Sin cambios respecto a la solución
        REFERENCE NUMBER                mensaje para identificar una transacción.    actual
P-038   AUTH-ID-RESP           X(6)     código de identificación de respuesta de     Sin cambios respecto a la solución
                                        transacción.                                 actual
P-039   RESPONSE CODE          9(2)     00 = Aprobada.                               Sin cambios respecto a la solución
                                                                                     actual
P-041   CARD ACCEPTOR         X(16)     Identificador de la terminal que acepta la   Sin cambios respecto a la solución
        TERMINAL                        transacción.                                 actual
        IDENTIFICATION
P-043   CARD ACCEPTOR         X(40)     El formato es:                               Sin cambios respecto a la solución
        NAME                            1-22: Nombre del administrador del           actual
                                        Cajero.
                                        23-35: Ciudad del Cajero.
                                        36-38: Estado del Cajero.
                                        39-40: País del Cajero.
P-049   TRANSACTION            9(3)     Código ISO de la moneda                      Sin cambios respecto a la solución
        CURRENCY CODE                   032 = Pesos                                  actual
                                        840 = Dólares
P-054   ADD-AMTS              X(023)    El formato es:                               Sin cambios respecto a la solución
                                        1-3: Longitud del campo                      actual
                                        4-23: Se informan blancos.
P-055   PRI-RSRVD1-ISO        X(120)    El formato es:                               Se informan datos asociados a
                                        1-3: Longitud del campo                      la operatoria de Transferencias
                                        4-120: Ver debajo detalle de campo 55
P-060   TERMINAL DATA         X(15)     El formato es:                               Se informa “5892” como
                                        1-3: Longitud del campo.                     identificador dueña de la
                                        4-7: Siglas institución dueña de la          terminal y “BANE” como red
                                        terminal.                                    lógica.
                                        8-11: Red lógica de la terminal.
                                        12-15: Diferencia horaria entre hora
                                        local de transacción y hora del
                                        sistema.
P-061   CARD ISSUER           X(16)     El formato es:                               Sin cambios respecto a la solución
        AUTHORIZER DATA                 1-3: Longitud del campo.                     actual
                                        4-7: Sigla de la institución emisora de la
                                        tarjeta.
P-062   PRI-RSRVD3-PRVT       X(25)     Se informa el tipo de terminal               Se informará “00”
S-090   ORIG-INFO             X(42)     El formato es:                               Sin cambios respecto a la solución
                                        1-4: ORIG-TYP: Tipo de mensaje original      actual
                                        5-16: ORIG-SEQ-NUM: Secuencia de la
                                        transacción original. ( Campo 37)
                                        17-20: ORIG-TRAN-DAT Fecha
                                        calendario de la transacción original. (
                                        campo 13)
                                        21-28: ORIG-TRAN-TIM: Hora local de la
                                        transacción original
                                        29-32: ORIG-B24-POST-DAT: Fecha de
                                        negocio de la transacción original
                                        33-42: RESERVED.: Reservado para uso
                                        futuro
                                                                                       Referencia
                                        ANEXO
                                                                                       Vigente desde          30/10/2025

                    NUEVO ESQUEMA DE TRANSFERENCIAS                                    Capítulo                     1

                           MENSAJERIA HTH Y EXTRACT                                    Página                       5

 Bit          Campo            Tipo                   Descripción                                  Detalles
S-100   RCV-INST               X(11)     El formato es:                                Sin cambios respecto a la solución
                                         Posiciones 01-02 = Indicador de longitud.     actual
                                         El valor a informar es `11`.
                                         Posiciones 03-13 = Valor del campo,
                                         alineado a izquierda y relleno con
                                         BLANCOS.
S-102   ACCOUNT                X(28)     Identificación de la cuenta Origen            Identificación de la cuenta en
        IDENTIFICATION 1                 1-3: Longitud del campo.                      formato “PBF”.
                                         4-28: Número de cuenta.
S-103   ACCOUNT                X(28)     Identificación de la cuenta de acreditación   Identificación de la cuenta en
        IDENTIFICATION 2                 1-3: Longitud del campo.                      formato “PBF”.
                                         4-28: Número de cuenta.
S-126   SECNDRY-RSRVD7-        X(998)    Área de Tokens – Ver definición de los        Se informan datos asociados a
        PRVT                             tokens “PE”, “Q7”, “QY” y “RL”                la operatoria de
                                                                                       TRANSFERENCIAS
S-127   SECNDRY-RSRVD8-        X(43)     El formato es:                                Sin cambios respecto a la solución
        PRVT                             Posiciones 01-03 = Indicador de longitud.     actual
                                         El valor a informar es `043`.
                                         Posiciones 04-46 = Si es cruzada se
                                         informa el tipo de cambio. De lo contrario,
                                         se informarán ceros.

        3.1.2. Mensaje 0230

 Bit          Campo            Tipo                   Descripción                                  Detalles
P-001   SECONDARY BITMAP       X(16)     Bitmap secundario                             Aquí se informarán como
                                                                                       presentes en el mensaje los
                                                                                       campos que figuran a
                                                                                       continuación.
P-003   PROCESSING CODE         X(6)     Se informa en las siguientes                  Se completa con “2900XX”
                                         posiciones:                                   Donde XX corresponde al tipo
                                         1-2: código de transacción.                   de cuenta.
                                         3-4: tipo de cuenta que recibe el débito.
                                         5-6: tipo de cuenta que recibe el
                                         crédito.
P-004   TRAN-AMT               9(12)     Monto de la operación                     Sin cambios respecto a la solución
                                         Formato: 10 enteros + 2 decimales         actual

P-007   TRANSMISSION DATE      9(10)     Fecha y hora de transmisión del mensaje       Sin cambios respecto a la solución
        AND TIME                                                                       actual
P-011   SYSTEMS TRACE           9(6)     Número de mensaje usado para                  Sin cambios respecto a la solución
        AUDIT NUMBER                     establecer la correspondencia de una          actual
                                         respuesta y su original
P-012   LOCAL TRANSACTION       9(6)     Hora local en que comenzó la transacción      Sin cambios respecto a la solución
        TIME                                                                           actual
P-013   LOCAL TRANSACTION       9(4)     Fecha calendario en que comenzó la            Sin cambios respecto a la solución
        DATE                             transacción                                   actual
P-015   SETL-DAT                9(4)     Fecha de negocio a que corresponde la         Sin cambios respecto a la solución
                                         transacción. Formato mmdd.                    actual
P-017   CAPTURE DATE            9(4)     Fecha de negocio en que la transacción        Sin cambios respecto a la solución
                                         fue procesada                                 actual
P-022   ENTRY-MODE              9(3)     Modo en que la operación ingresó a la         Sin cambios respecto a la solución
                                         terminal                                      actual
P-032   ACQUIRING              9(11)     Número de Identificación de la institución    Sin cambios respecto a la solución
        INSTITUTION                      a la que pertenece la terminal                actual
        IDENTIFICATION CODE
P-035   TRACK 2 DATA           X(37)     Track 2 de la tarjeta                         Sin cambios respecto a la solución
                                                                                       actual
P-037   RETRIEVAL              X(12)     Número asignado por el originador del         Sin cambios respecto a la solución
        REFERENCE NUMBER                 mensaje para identificar una transacción.     actual
P-039   RESPONSE CODE           9(2)     00 = Aprobada.                                Sin cambios respecto a la solución
                                                                                       actual
                                                                                      Referencia
                                       ANEXO
                                                                                      Vigente desde          30/10/2025

                    NUEVO ESQUEMA DE TRANSFERENCIAS                                   Capítulo                     1

                           MENSAJERIA HTH Y EXTRACT                                   Página                       6

 Bit          Campo            Tipo                  Descripción                                  Detalles
P-041   CARD ACCEPTOR          X(16)    Identificador de la terminal que acepta la    Sin cambios respecto a la solución
        TERMINAL                        transacción.                                  actual
        IDENTIFICATION
P-043   CARD ACCEPTOR          X(40)    El formato es:                                Sin cambios respecto a la solución
        NAME                            1-22: Nombre del administrador del            actual
                                        Cajero.
                                        23-35: Ciudad del Cajero.
                                        36-38: Estado del Cajero.
                                        39-40: País del Cajero.
P-049   TRANSACTION             9(3)    Código ISO de la moneda                       Sin cambios respecto a la solución
        CURRENCY CODE                   032 = Pesos                                   actual
                                        840 = Dólares
S-102   ACCOUNT                X(28)    Identificación de la cuenta Origen            Sin cambios respecto a la solución
        IDENTIFICATION 1                1-3: Longitud del campo.                      actual
                                        4-28: Número de cuenta.
S-103   ACCOUNT                X(28)    Identificación de la cuenta de acreditación   Identificación de la cuenta en
        IDENTIFICATION 2                1-3: Longitud del campo.                      formato “PBF”.
                                        4-28: Número de cuenta.

        3.1.3. Mensaje 0420

 Bit          Campo            Tipo                  Descripción                                  Detalles
P-001   SECONDARY BITMAP       X(16)    Bitmap secundario                             Aquí se informarán como
                                                                                      presentes en el mensaje los
                                                                                      campos que figuran a
                                                                                      continuación.
P-002   PAN                    X(19)    Primary Account Number                        Número de tarjeta
P-003   PROCESSING CODE        X(6)     Se informa en las siguientes                  Se completa con “2900XX”
                                        posiciones:                                   Donde XX corresponde al tipo
                                        1-2: código de transacción.                   de cuenta.
                                        3-4: tipo de cuenta que recibe el débito.
                                        5-6: tipo de cuenta que recibe el
                                        crédito.
P-004   TRAN-AMT               9(12)    Monto de la operación                     Sin cambios respecto a la solución
                                        Formato: 10 enteros + 2 decimales         actual

P-007   TRANSMISSION DATE      9(10)    Fecha y hora de transmisión del mensaje       Sin cambios respecto a la solución
        AND TIME                                                                      actual
P-011   SYSTEMS TRACE           9(6)    Número de mensaje usado para                  Sin cambios respecto a la solución
        AUDIT NUMBER                    establecer la correspondencia de una          actual
                                        respuesta y su original
P-012   LOCAL TRANSACTION       9(6)    Hora local en que comenzó la transacción      Sin cambios respecto a la solución
        TIME                                                                          actual
P-013   LOCAL TRANSACTION       9(4)    Fecha calendario en que comenzó la            Sin cambios respecto a la solución
        DATE                            transacción                                   actual
P-015   SETL-DAT                9(4)    Fecha de negocio a que corresponde la         Sin cambios respecto a la solución
                                        transacción. Formato mmdd.                    actual
P-017   CAPTURE DATE            9(4)    Fecha de negocio en que la transacción        Sin cambios respecto a la solución
                                        fue procesada                                 actual
P-022   ENTRY-MODE              9(3)    Modo en que la operación ingresó a la         Sin cambios respecto a la solución
                                        terminal                                      actual
P-032   ACQUIRING              9(11)    Número de Identificación de la institución    Sin cambios respecto a la solución
        INSTITUTION                     a la que pertenece la terminal                actual
        IDENTIFICATION CODE
P-035   TRACK 2 DATA           X(37)    Track 2 de la tarjeta                         Sin cambios respecto a la solución
                                                                                      actual
P-037   RETRIEVAL              X(12)    Número asignado por el originador del         Sin cambios respecto a la solución
        REFERENCE NUMBER                mensaje para identificar una transacción.     actual
P-038   AUTH-ID-RESP            X(6)    código de identificación de respuesta de      Sin cambios respecto a la solución
                                        transacción.                                  actual
P-039   RESPONSE CODE           9(2)    Código de respuesta:                          Sin cambios respecto a la solución
                                        00 = Aprobada.                                actual
                                                                                       Referencia
                                        ANEXO
                                                                                       Vigente desde          30/10/2025

                    NUEVO ESQUEMA DE TRANSFERENCIAS                                    Capítulo                     1

                           MENSAJERIA HTH Y EXTRACT                                    Página                       7

 Bit          Campo            Tipo                   Descripción                                  Detalles
P-041   CARD ACCEPTOR          X(16)     Identificador de la terminal que acepta la    Sin cambios respecto a la solución
        TERMINAL                         transacción.                                  actual
        IDENTIFICATION
P-043   CARD ACCEPTOR          X(40)     El formato es:                                Sin cambios respecto a la solución
        NAME                             1-22: Nombre del administrador del            actual
                                         Cajero.
                                         23-35: Ciudad del Cajero.
                                         36-38: Estado del Cajero.
                                         39-40: País del Cajero.
P-049   TRANSACTION             9(3)     Código ISO de la moneda                       Sin cambios respecto a la solución
        CURRENCY CODE                    032 = Pesos                                   actual
                                         840 = Dólares
P-052   PERSONAL               X(16)     Clave de identificación personal (PIN) del    Se enviarán 16 “F”.
        IDENTIFICATION                   tarjetahabiente, encriptado por la clave de   Es opcional se configura por
        NUMBER DATA                      comunicación.                                 entidad
P-054   ADD-AMTS               X(023)    El formato es:                                Sin cambios respecto a la solución
                                         1-3: Longitud del campo                       actual
                                         4-23: Se informan blancos.
P-055   PRI-RSRVD1-ISO         X(120)    El formato es:                                Se informan datos asociados a
                                         1-3: Longitud del campo                       la operatoria de Transferencias
                                         4-120: Ver debajo detalle de campo 55
P-060   TERMINAL DATA          X(15)     El formato es:                                Se informará “5892” como
                                         1-3: Longitud del campo.                      identificador dueña de la
                                         4-7: Siglas institución dueña de la           terminal y “BANE” como red
                                         terminal.                                     lógica
                                         8-11: Red lógica de la terminal.
                                         12-15: Diferencia horaria entre hora
                                         local de transacción y hora del
                                         sistema.
P-061   CARD ISSUER            X(16)     El formato es:                                Sin cambios respecto a la solución
        AUTHORIZER DATA                  1-3: Longitud del campo.                      actual
                                         4-7: Sigla de la institución emisora de la
                                         tarjeta.
P-062   PRI-RSRVD3-PRVT        X(25)     Se informa el tipo de terminal                Se informará “00”
S-090   ORIG-INFO              X(42)     El formato es:                                Sin cambios respecto a la solución
                                         1-4: ORIG-TYP: Tipo de mensaje original       actual
                                         5-16: ORIG-SEQ-NUM: Secuencia de la
                                         transacción original. ( Campo 37)
                                         17-20: ORIG-TRAN-DAT Fecha
                                         calendario de la transacción original. (
                                         campo 13)
                                         21-28: ORIG-TRAN-TIM: Hora local de la
                                         transacción original
                                         29-32: ORIG-B24-POST-DAT: Fecha de
                                         negocio de la transacción original
                                         33-42: RESERVED.: Reservado para uso
                                         futuro
S-102   ACCOUNT                X(28)     Identificación de la cuenta Origen            Identificación de la cuenta en
        IDENTIFICATION 1                 1-3: Longitud del campo.                      formato “PBF”.
                                         4-28: Número de cuenta.
S-103   ACCOUNT                X(28)     Identificación de la cuenta de acreditación   Identificación de la cuenta en
        IDENTIFICATION 2                 1-3: Longitud del campo.                      formato “PBF”.
                                         4-28: Número de cuenta.
S-126   SECNDRY-RSRVD7-        X(998)    Área de Tokens – Ver definición de los        Se informan datos asociados a
        PRVT                             tokens “PE”, “Q7” , “QY” y “RL”               la operatoria de
                                                                                       TRANSFERENCIAS
                                                                                    Referencia
                                      ANEXO
                                                                                    Vigente desde         30/10/2025

                   NUEVO ESQUEMA DE TRANSFERENCIAS                                  Capítulo                    1

                          MENSAJERIA HTH Y EXTRACT                                  Página                      8

        3.1.4. Mensaje 0430
 Bit          Campo           Tipo                  Descripción                                Detalles
P-001   SECONDARY BITMAP      X(16)    Bitmap secundario                            Aquí se informarán como
                                                                                    presentes en el mensaje los
                                                                                    campos que figuran a
                                                                                    continuación.
P-002   PAN                   X(19)    Primary Account Number                       Número de tarjeta
P-003   PROCESSING CODE       X(6)     Se informa en las siguientes                 2900XX
                                       posiciones:                                  Donde XX corresponde al tipo
                                       1-2: código de transacción.                  de cuenta
                                       3-4: tipo de cuenta que recibe el débito.
                                       5-6: tipo de cuenta que recibe el
                                       crédito.
P-004   TRAN-AMT              9(12)    Monto de la operación                     Sin cambios respecto a la solución
                                       Formato: 10 enteros + 2 decimales         actual.

P-007   TRANSMISSION DATE     9(10)    Fecha y hora de transmisión del mensaje      Sin cambios respecto a la solución
        AND TIME                                                                    actual
P-011   SYSTEMS TRACE          9(6)    Número de mensaje usado para                 Sin cambios respecto a la solución
        AUDIT NUMBER                   establecer la correspondencia de una         actual
                                       respuesta y su original
P-032   ACQUIRING             9(11)    Número de Identificación de la institución   Sin cambios respecto a la solución
        INSTITUTION                    a la que pertenece la terminal               actual
        IDENTIFICATION CODE
P-035   TRACK 2 DATA          X(37)    Track 2 de la tarjeta                        Sin cambios respecto a la solución
                                                                                    actual
P-037   RETRIEVAL             X(12)    Número asignado por el originador del        Sin cambios respecto a la solución
        REFERENCE NUMBER               mensaje para identificar una transacción.    actual
P-039   RESPONSE CODE          9(2)    00 = Aprobada.                               Sin cambios respecto a la solución
                                                                                    actual
P-041   CARD ACCEPTOR         X(16)    Identificador de la terminal que acepta la   Sin cambios respecto a la solución
        TERMINAL                       transacción.                                 actual
        IDENTIFICATION
P-043   CARD ACCEPTOR         X(40)    1-22: Nombre del administrador del           Sin cambios respecto a la solución
        NAME                           Cajero.                                      actual
                                       23-35: Ciudad del Cajero.
                                       36-38: Estado del Cajero.
                                       39-40: País del Cajero.
P-049   TRANSACTION            9(3)    Código ISO de la moneda                      Sin cambios respecto a la solución
        CURRENCY CODE                  032 = Pesos                                  actual
                                       840 = Dólares
P-060   TERMINAL DATA         X(15)    1-3: Longitud del campo.                     Sin cambios respecto a la solución
                                       4-7: Siglas institución dueña de la          actual
                                       terminal.
                                       8-11: Red lógica de la terminal.
                                       12-15: Diferencia horaria entre hora local
                                       de transacción y hora del sistema.
P-061   CARD ISSUER           X(16)    1-3: Longitud del campo.                     Sin cambios respecto a la solución
        AUTHORIZER DATA                4-7: Sigla de la institución emisora de la   actual
                                       tarjeta.
                                                                                         Referencia
                                           ANEXO
                                                                                         Vigente desde          30/10/2025

                       NUEVO ESQUEMA DE TRANSFERENCIAS                                   Capítulo                       1

                             MENSAJERIA HTH Y EXTRACT                                    Página                         9

  Bit           Campo              Tipo                  Descripción                                 Detalles
S-090    ORIG-INFO                 X(42)    1-4: ORIG-TYP: Tipo de mensaje original      Sin cambios respecto a la solución
                                            5-16: ORIG-SEQ-NUM: Secuencia de la          actual
                                            transacción original. ( Campo 37)
                                            17-20: ORIG-TRAN-DAT Fecha
                                            calendario de la transacción original. (
                                            campo 13)
                                            21-28: ORIG-TRAN-TIM: Hora local de la
                                            transacción original
                                            29-32: ORIG-B24-POST-DAT: Fecha de
                                            negocio de la transacción original
                                            33-42: RESERVED.: Reservado para uso
                                            futuro

    3.2. Redefinición del campo 55 - PRI-RSRVD1-ISO

Nombre del campo                     Descripción                                                                Atributo
LONGITUD                             Longitud del campo 55. El valor a informar es “120”.                       9(3)
TRANSFERENCIA
    TRACK2                           Contiene datos del Track 2 de la tarjeta alineado a izquierda y rellenos   X(40)
                                     con blancos.
    CA                                                                                                          X(2)
    MARCA-TIT                        Redefinición del campo CA.
              MISMO-TITULAR          Se indica la condición de titularidad del                                  X(1)
                                     ordenante de la transferencia frente a la cuenta
                                     destino.
                                     Los valores que pueden informarse en este campo
                                     son:
                                     “S”: Cuenta propia.
                                     “C”: Cuenta propia compartida.
                                     “N”: Cuenta de terceros.
              FILLER                 Se informan BLANCOS                                                        X(1)
    FR-ACCT                          Número de cuenta desde
              FIID                   Institución Emisora de la cuenta desde                                     X(4)
              TYP                    Tipo de cuenta desde                                                       X(2)
              ACCT-NUM               Número de cuenta desde                                                     X(19)
    TO-ACCT                          Número de cuenta hacia
              FIID                   Institución Emisora de la cuenta hacia                                     X(4)
              TYP                    Tipo de cuenta hacia                                                       X(2)
              ACCT-NUM               Número de cuenta hacia                                                     X(19)
              FIID-DESC              Institución a la cual pertenece la cuenta hacia.                           X(13)
              DONACIONES             Redefinición del campo FIID-DESC.                                          X(13)
                          ENTE                                                                                  X(3)
                          FILLER     Se deberá informar BLANCOS                                                 X(10)
    FR-ACCT-TYP                                                                                                 X(1)
    TO-ACCT-TYP                                                                                                 X(1)
    TIPO-TRAN                        Se deberá informar BLANCOS                                                 X(1)
    MOTIVO                           Motivo declarado de la transferencia                                       X(3)
    FILLER                           Se deberá informar BLANCOS                                                 X(9)
                                                                                      Referencia
                                       ANEXO
                                                                                      Vigente desde         30/10/2025

                   NUEVO ESQUEMA DE TRANSFERENCIAS                                    Capítulo                        1

                           MENSAJERIA HTH Y EXTRACT                                   Página                      10

     3.3. Tokens

          3.3.1. Token “PE”

Token Header

Campo              Formato     Valor     Descripción
EYE CATCHER         X(2)       “! ”      Identificador literal.
TKN-ID              X(2)       “PE”      Nombre o Identificador único de la estructura de datos.
                                         Indica el largo total de los datos informado en el campo (alineado con ceros a
TKN-LGTH            9(5)       “00156”
                                         izquierda).
USER-FLD            X(1)       “”        Blanco.
 Token Data

Campo              Formato     Descripción

 MOTIVO            X(3)        Motivo seleccionado por el cliente, según BCRA.
REFERENCIA          X(12)      Referencia ingresada por el cliente.

                               Tipo de cuenta de destino.
                               Los valores posibles son:
TIPO-CTA-DEST       X(02)      01 = Cuenta corriente en pesos.
                               07 = Cuenta corriente en dólares.
                               11 = Caja de ahorro en pesos.
                               15 = Caja de ahorro en dólares.

CDI-ORIG            X(11)      CDI, DNI o CUIL del titular de la cuenta origen de la transferencia (CBU de origen).

CDI-DEST            X(11)      CDI, DNI o CUIL del titular de la cuenta destino de la transferencia (CBU de destino).
                              Se indica la condición de titularidad del ordenante de la transferencia frente a la cuenta
                              destino.

MISMO-TITULAR       X(01)     Los valores que pueden informarse en este campo son:
                              “S”: Cuenta propia.
                              “C”: Cuenta propia compartida.
                              “N”: Cuenta de terceros.
NOMBRE              X(22)      Nombre del titular de la cuenta destino de la transferencia. (CBU de destino).
TRACK2              X(40)      Track 2 de tarjeta de débito del usuario.
FR-ACCT.FIID        X(04)      FIID banco emisor.
FR-ACCT.TYP         X(02)      Tipo de cuenta de origen.

FR-ACCT.ACCT-NUM    X(19)      Número de cuenta de origen.

TO-ACCT.FIID        X(04)      FIID banco receptor de los fondos.
TO-ACCT.FIID-CPF    X(04)      FIID del banco receptor para Base24. (idem a TO-ACCT. FIID)
TO-ACCT.TYP         X(02)      Tipo de cuenta de destino.

TO-ACCT.ACCT-NUM    X(19)      Número de cuenta de destino.
                                                                                           Referencia
                                             ANEXO
                                                                                           Vigente desde          30/10/2025

                     NUEVO ESQUEMA DE TRANSFERENCIAS                                       Capítulo                     1

                             MENSAJERIA HTH Y EXTRACT                                      Página                      11

           3.3.2. Token “Q7”

Token Header
Campo               Formato     Valor         Descripción

EYE CATCHER          X(2)       “! ”           Identificador literal.
TKN-ID               X(2)       “Q7”           Nombre o Identificador único de la estructura de datos.
TKN-LGTH             9(5)       “00240”        Indica el largo total de los datos informado en el campo (alineado con ceros

USER-FLD             X(1)       “”             a izquierda).
                                               Blanco.
 Token Data
 Campo              Formato     Descripción
NÚMERO DE CBU        9(22)      Número de CBU dela cuenta de destino .
TIPO-PERSONA         X(1)       Tipo de Persona Titular. Los valores posibles son:

                                “F”: Persona física.
                                “J”: Persona jurídica.

                                Se informa un blanco.
TITULAR-1-CDI        9(11)      CUIL-CDI/CUIT del 1er. titular de la cuenta de destino

TITULAR-1-NOMBRE     X(40)      El/los apellido/s y el/los nombre/s del primer titular de la cuenta de destino.

TITULAR-2-CDI        9(11)      Se informan blancos.
TITULAR-2-NOMBRE     X(40)      Se informan blancos.
TITULAR-3-CDI        9(11)      Se informan blancos.
TITULAR-3-NOMBRE     X(40)      Se informan blancos.
NUM-CTA-BCRIA        X(19)      El número de cuenta asociado al cbu, destino

                                Se informarán Blancos.

RED-DEST             X(01)      Se indica la red del destinatario de la transferencia

                                L: LINK
                                B: BANELCO
                                C:COELSA
BANCO-DESTINO        X(22)      Nombre del banco al que se transfieren los fondos.
NOMBRE-ORIG          X(22)      Nombre del titular de la cuenta origen (CBU origen)

           3.3.3. Token “QY” (NUEVO)
  El token “QY” contiene la información de las cuentas utilizadas en la transferencia Push originadas
  desde Mercado Pago.
Token Header
Campo                   Formato      Valor      Descripción

EYE CATCHER             X(2)         “! ”        Identificador literal.
TKN-ID                  X(2)         “QY”        Nombre o Identificador único de la estructura de datos.
TKN-LGTH                9(5)         “00308”     Indica el largo total de los datos informado en el campo (alineado con ceros

USER-FLD                X(1)         “”          a izquierda).
                                                 Blanco.
 Token Data
 Campo                  Formato      Descripción
CBU-ORIG                             Datos de la CBU Origen de la transferencia
  NOMBRE-ORIG-REAL      X(22)        Nombre del titular de la cuenta asociada a la CBU de origen.
  CUIT-ORIG-REAL        9(11)        Número de CUIT del titular de la cuenta asociada a la CBU de origen.
  CBU-ORIG-REAL         9(22)        Número de CBU de origen.
                                                                                                Referencia
                                              ANEXO
                                                                                                Vigente desde          30/10/2025

                         NUEVO ESQUEMA DE TRANSFERENCIAS                                        Capítulo                   1

                                MENSAJERIA HTH Y EXTRACT                                        Página                    12

  CVU-ORIG-REAL              9(22)       Se informan Blancos.
CBU-DEST                                 Datos de la CBU Destino de la transferencia
  NOMBRE-DEST-REAL           X(22)       Nombre del titular de la cuenta asociada a la CBU de destino.
  CUIT-DEST-REAL             9(11)       Número de CUIT del titular de la cuenta asociada a la CBU de destino.
  CBU-DEST-REAL              9(22)       Número de CBU de destino
  CVU-DEST-REAL              9(22)       Se informan Blancos.
CVU-ORIG                                 Datos de la CVU Origen de la transferencia
  NOMBRE-ORIG-INF            X(22)       Nombre del titular de la cuenta asociada a la CVU de origen.
  CUIT-ORIG-INF              9(11)       Número de CUIT del titular de la cuenta asociada a la CVU de origen.
  CBU-ORIG-INF               9(22)       Se informan Blancos.
  CVU-ORIG-INF               9(22)       Número de CVU de origen.
CVU-DEST                                 Datos de la CVU Destino de la transferencia
  NOMBRE-DEST-INF            X(22)       Se informan Blancos.
  CUIT-DEST-INF              9(11)       Se informan Blancos.
  CBU-DEST-INF               9(22)       Se informan Blancos.
  CVU-DEST-INF               9(22)       Se informan Blancos.

          3.3.4. Token “RL”

 Token Header
 Campo                       Formato            Valor        Descripción
 EYE CATCHER                  X(2)              “! ”         Identificador literal.
 TKN-ID                       X(2)              “RL”         Nombre o Identificador único de la estructura de datos.

                                                             Indica el largo total de los datos informado en el campo (alineado
                                                             con ceros a izquierda).
 TKN-LGTH                     9(5)
                                                             El largo del token dependerá de la longitud de los TAGs
                                                             informados.

 USER-FLD                     X(1)              “”           Blanco.
 Token Data
 Campo                       Formato            Descripción
 CANT-TAGS                    X(2)              Indica la cantidad de Tags incluidos en el Token.
 TAGS
     DELIMITADOR DE                             Delimitador del TAG.
                              X(1)
     TAG                                        Valor fijo: “|” (pipe)
        TAG-ID                X(4)              Identificador del TAG.

        TAG-LGTH              X(2)              Indica el largo del dato informado en el tag.

        TAG-VALUE             X(1..99)          Valor contenido en el TAG.

                                                 Delimitador del TAG.
 DELIMITADOR DE TAGs          X(1)
                                                 Valor fijo: “|” (pipe)
 FILLER                       X(1..99)          Uso futuro

                 3.3.4.1.      TAGS (NUEVO)

                                                                                                                 Tipo de la
    TAG-ID                               Descripción                              Formato       Transacción
                                                                                                                transacción
    TRID          Identificador de la transferencia , originado por la PSP       X(19)              29               C
    TTRN          Tipo de transferencia. Se informará “C”                        X(01)              29               C
                                                                                 Referencia
                                    ANEXO
                                                                                 Vigente desde         30/10/2025

                   NUEVO ESQUEMA DE TRANSFERENCIAS                               Capítulo                  1

                         MENSAJERIA HTH Y EXTRACT                                Página                   13

4. Archivo Extract

     4.1. Extract de transacciones

El extract de transacciones no sufrió modificaciones respecto a los datos que se informan para las
transferencias. Las entidades podrán identificar las operaciones mediante el tipo-tran “C”.

     4.2. Extract de transferencias

Se incorporó una nueva redefinición en los campos del bloque “TRANSFERENCIA 3.0” (OFFSET
350) , para completar los datos asociados a las “CVU de origen” y “CVU de destino” de las
transacciones “Push con CVU” . Además, se incluyó el campo “TRANSF-ID” con el código
identificador generado por el originante de la transferencia.

Las entidades de la red actúan como destinataria de los créditos. Por lo tanto , los datos mencionados
anteriormente únicamente se incluyen en los archivos DESTmmdd .

Denominación del archivo
     • ORIGmmdd (Para el archivo correspondiente a la entidad originante).
     • DESTmmdd (Para el archivo correspondiente a la entidad destinataria).

Formato de registro de Header (longitud del registro: 397 posiciones).

                                                 TIPO y
NIVEL NOMBRE DEL CAMPO                 OFFSET                CONTENIDO DEL CAMPO
                                                 TAMAÑO
01      HEADER                         001       X (397)
02      TIPO-ARCHIVO                   001       X (25)      Para ORIGmmdd el valor del campo es
                                                             “TRANSFERENCIAS POR ORIGEN”.
                                                             Para DESTmmdd el valor del campo es
                                                             “TRANSFERENCIAS POR DEST”.
02      FECHA                          026       X (06)      Fecha generación del archivo (AAMMDD)
02      FILLER                         032       X (366)

Formato de registro de Datos (longitud del registro: 570 posiciones)

                                                    TIPO y
NIVEL    NOMBRE DEL CAMPO               OFFSET                    CONTENIDO DEL CAMPO
                                                    TAMAÑO
01       DATOS                          001         X (570)
02       ORIG.                          001         X (26)
04       FIID                           001         X (04)        Fiid de la entidad originante.
                                                                  5892 si la entidad es BANELCO.
04       PAN                            005         X (19)        Número completo de la tarjeta. (1)
04       MEMBER                         024         X (03)        Miembro de la tarjeta. (1)
02       DEST.                          027         X (25)
                                                                    Referencia
                                 ANEXO
                                                                    Vigente desde          30/10/2025

                    NUEVO ESQUEMA DE TRANSFERENCIAS                 Capítulo                     1

                        MENSAJERIA HTH Y EXTRACT                    Página                       14

                                             TIPO y
NIVEL   NOMBRE DEL CAMPO            OFFSET            CONTENIDO DEL CAMPO
                                             TAMAÑO
04      FIID                        027      X (04)   Fiid de la entidad destino de los fondos
                                                      asignado por link.

                                                      5892 si la entidad es BANELCO.
                                                      5893 si la entidad es COELSA.

04      CTA-TIPO                    031      X (02)   Tipo de cuenta destino de los fondos.
04      CTA-NRO                     033      X (19)   Número de cuenta destino de los fondos.
02      CTA-ORIG                    052      X (19)   Número de cuenta origen de los fondos. (1)
02      TYP                         071      X (04)   Tipo de mensaje:
                                                      0210: para transferencias originadas y recibidas
                                                      en Bancos de Red LINK.
                                                      0220: para transferencias originadas en Red
                                                      BANELCO.
                                                      0420: Reversos.
02      TRAN-CDE                    075      X (06)   Código de transacción. (1)
                                                      Referirse al documento denominado Códigos
                                                      de Transacciones.
02      RESP                        081      X (03)   Código de respuesta.
                                                      Referirse al documento denominado Códigos
                                                      de Respuesta.
02      POST-DATE                   084      X (06)   Día de negocio de la transacción.
02      TRAN-DATE                   090      X (06)   Día calendario de la transacción.
02      TRAN-TIME                   096      X (06)   Hora de la transacción.
02      TERM                        102      X (18)
04      FIID                        102      X (04)   Fiid de la terminal donde se realizó la
                                                      transacción.
                                                      5892 si es BANELCO.
04      ID                          106      X (12)   Denominación de la terminal donde se realizó la
                                                      transacción.
04      TYP                         118      X (02)   Tipo de terminal.
                                                      Referirse al documento denominado Códigos
                                                      de Tipos de Terminal.
02      SEQ                         120      X (12)   Número de secuencia.
02      AMT                         132      X (10)   Monto de la transacción. (2)
02      MONEDA                      142      X (03)   Moneda de la cuenta.
02      TIPO-CAMBIO                 145      X (10)   Tipo de cambio aplicado (actualmente sin uso).
02      TITULAR-CTA-DEST            155      X (01)   Se indica la condición de titularidad del
                                                      ordenante de la transferencia frente a la cuenta
                                                      destino.

                                                      Los valores que pueden informarse en este
                                                      campo son:
                                                      “S”: Cuenta propia.
                                                      “C”: Cuenta propia compartida.
                                                      “N”: Cuenta de terceros.
02      CDI                         156      X (11)   Número de CUIL/CUIT/CDI/DOCUMENTO del
                                                      originante
02      MOTIVO                      167      X (03)   Conceptos y motivos de Transferencia (según
                                                      B.C.R.A)
                                                                      Referencia
                                  ANEXO
                                                                      Vigente desde         30/10/2025

                     NUEVO ESQUEMA DE TRANSFERENCIAS                  Capítulo                    1

                         MENSAJERIA HTH Y EXTRACT                     Página                      15

                                              TIPO y
NIVEL   NOMBRE DEL CAMPO             OFFSET            CONTENIDO DEL CAMPO
                                              TAMAÑO
                                                       Para T-PULL se informará “VAR”
02      REFERENCIA                   170      X (12)   Referencia de la transferencia.

                                                       Para T-PULL se informará “FONDEO”
02      NOMBRE                       182      X (22)   Nombre del titular de la cuenta origen de los
                                                       fondos.
02      DNI-DEST                     204      X (11)   Número de CUIL/CUIT/CDI/DOCUMENTO del
                                                       destinatario de la transferencia.
02      TIPO-CTA-ORIG                215      X (02)   Tipo de cuenta origen de los fondos.
02      AMT-EXT                      217      X (15)   Monto de la transacción. (3)
02      TERM-ID-16                   232      X (16)   Denominación de la terminal donde se realizó la
                                                       transacción, extendida a 16 caracteres para
                                                       canales de pago con transferencia.
02      RAZON-SOC                    248      X (50)   Razón social del comercio (canales de pago
                                                       con transferencia).
02      NOMBRE-FANT                  298      X (50)   Nombre de fantasía del comercio (canales de
                                                       pago con transferencia).
02      SUBCONCEPTO                  348      X(01)    Subconcepto de transferencias por lote
                                                       (generadas en la terminal “56”).
                                                       Los valores posibles son:
                                                       A – Beneficios
                                                       B – Honorarios
                                                       C – Proveedores
                                                       D – Judiciales
                                                       E – Fondo de Desempleo

                                                       Para el resto de las transferencias se
                                                       informará blanco.
02      TIPO-TRAN                    349      X (01)   Tipo de transacción:
                                                       A: Devolución de pago con lectura de QR
                                                       C: Transferencia CVU
                                                       D: Devolución total de pago PEI
                                                       E: Devolución parcial de pago PEI
                                                       I: Distribución de tasa de Intercambio
                                                       L: Transferencia PULL
                                                       P: Pago PEI
                                                       Q: Pago con lectura de QR
                                                       R: Transferencia inmediata entre personas
                                                       X: Transferencia por importe superior (TIS).
02      TRANSFERENCIA 3.0            350
03      AUTH-ID-RESP                 350      X (06)   Identificador del pago con transferencia con
                                                       lectura de código QR.
03      CVU-DESTINO                  356      X (22)   CVU del destino.
03      CUIT-DESTINO                 378      X (11)   CUIT del destino.
03      ID-BILLETERA                 389      X (11)   CUIT de la Billetera.
03      CVU-BILLETERA                400      X (22)   CVU del usuario de la billetera.
03      ID-QR                        422      X (64)   Identificador del QR .
03      DEV-AUTH-ID-RESP             486      X (06)   En las devoluciones de pago con transferencia
                                                       con lectura de código QR se informa el AUTH-
                                                       ID-RESP de la transacción original.
03      COD-BILL-BCRA                492      X(05)    Identificador de la Billetera asignado por el
                                                       BCRA
                                                                            Referencia
                                    ANEXO
                                                                            Vigente desde         30/10/2025

                    NUEVO ESQUEMA DE TRANSFERENCIAS                         Capítulo                      1

                         MENSAJERIA HTH Y EXTRACT                           Página                      16

                                                   TIPO y
NIVEL   NOMBRE DEL CAMPO                OFFSET                CONTENIDO DEL CAMPO
                                                   TAMAÑO
03      TRANSF-TYPE                     497        X(01)      Tipo de transferencia:
                                                              0: PEI
                                                              1: Debin
                                                              2: T-PULL – UNICA VEZ
                                                              3: T-PULL- RECURRENTE
02      TRANSFERENCIA-PUSH-CVU          350                   Redefinición de TRANSFERENCIA 3.0 (5)
03      CBU-DEST                        350        22         CBU de la cuenta de destino de
                                                              transferencias
03      CVU-ORIG-INF                    372        22         CVU del originante de la transferencia
03      NOMBRE-CVU-ORIG                 394        22         Nombre del titular de la CVU origen de la
                                                              transferencia
03      CUIT-CVU-ORIG                   416        11         CUIT del titular de la CVU origen de la
                                                              transferencia
03      CVU-DEST-INF                    427        22         CVU del destinatario de la transferencia
03      NOMBRE-CVU-DEST                 449        22         Nombre del titular de la CVU destino de la
                                                              transferencia
03      CUIT-CVU-DEST                   471        11         CUIT del titular de la CVU destino de la
                                                              transferencia
03      FILLER                          482        16         Uso futuro
02      AMT-EXT2                        498        X(18)      Monto de la transacción. (4)
02      CBU-ORIG                        516        X(22)      CBU de la cuenta originante de la transferencia
02      TRANSF-ID                       538        X(19)      Código identificador de la transferencia,
                                                              originado por la PSP o canal originante.
02      FILLER                          557        X (14)     Para uso futuro.

Referencias:
(1) Para el caso de la entidad de destino estos campos serán informados con blancos.
(2) En este campo se informarán asteriscos.
(3) En este campo se informarán asteriscos.
(4) En este campo siempre se informará el importe de la transacción, independientemente de
la cantidad de dígitos que conformen el mismo. La entidad deberá utilizar este campo para
efectuar los controles habituales sobre estas transacciones.
(5) Se completarán los campos incluidos en la redefinición “Transferencias-push-cvu” para
las operaciones cuyo tipo-tran sea “C”.

5. Observaciones
Las entidades que soliciten la presente solución , y deseen recibir los nuevos datos, deben considerar
que el importe de las operaciones se informa en el campo “AMT-EXT2” independientemente de la
cantidad de dígitos que lo compongan.
