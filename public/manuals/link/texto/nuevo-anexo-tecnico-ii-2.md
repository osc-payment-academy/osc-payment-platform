> **CONFIDENCIAL — Red LINK.** Uso interno exclusivo. NO publicar en la sección Documentación Técnica ni compartir con terceros.

# LINK — Nuevo Anexo Técnico II 2

                                                            Referencia
                     ANEXO
                                                            Vigente desde   29/06/2026
                                                            Capítulo              1
ADAPTACION EN LA MENSAJERIA DE DEBIN
                                                            Página                1

ADAPTACION EN LA MENSAJERIA
         DE DEBIN

       Este documento contiene información CONFIDENCIAL
y tal información no puede ser cedida a terceros por ningún motivo

 Para su divulgación se debe contar con el permiso por escrito del
      dueño de la información que contiene este documento
                                                                                                                 Referencia
                                                      ANEXO
                                                                                                                 Vigente desde              29/06/2026
                                                                                                                 Capítulo                             1
                      ADAPTACION EN LA MENSAJERIA DE DEBIN
                                                                                                                 Página                                2

INDICE

 1.      Objetivo ........................................................................................................................................ 3
 2.      Características Generales .......................................................................................................... 3
 3.      Mensajería Host to Host ............................................................................................................. 4
 3.1     F3XX00 (Debito DEBIN)............................................................................................................... 4
 3.1.1   Requerimiento de la transacción “F3” (débito DEBIN) ........................................................... 4
 3.1.2   Respuesta de la transacción “F3” (débito DEBIN) .................................................................. 5
 3.1.3   Reverso de la transacción “F3” (débito DEBIN) ...................................................................... 6
 3.1.4   Respuesta al reverso de la transacción “F3” (débito DEBIN) ................................................ 8
 3.2     F400XX (Crédito DEBIN) ............................................................................................................. 9
 3.2.1   Requerimiento de la transacción “F4” (crédito DEBIN) .......................................................... 9
 3.2.2   Respuesta de la transacción “F4” (crédito DEBIN) ............................................................... 10
 3.2.3   Reverso de la transacción “F4” (crédito DEBIN) ................................................................... 11
 3.2.4   Respuesta al reverso de la transacción “F4” (crédito DEBIN) ............................................. 13
 3.3     Campos 54 – ADD-AMTS .......................................................................................................... 14
 3.4     Redefinición del campo 55 - PRI-RSRVD1-ISO ...................................................................... 14
 3.5     Descripción del Campo 126 ..................................................................................................... 15
 3.5.1   Token “QS” ................................................................................................................................ 15
 3.5.2   Token “R8” (Nuevo) .................................................................................................................. 17
 4.      Extract de transacciones .......................................................................................................... 18
 5.      Historial de cambios: ................................................................................................................ 19
                                                                                     Referencia
                                            ANEXO
                                                                                     Vigente desde      29/06/2026
                                                                                     Capítulo                 1
                      ADAPTACION EN LA MENSAJERIA DE DEBIN
                                                                                     Página                   3

    1. Objetivo
Describir las adecuaciones que realizará link en la mensajería Host to Host y archivo Extract de TLF, en virtud
de lo establecido en la comunicación A- 8406 del Banco Central de la República Argentina.

    2. Características Generales
En referencia a la Circular Comercial “Cobro con Transferencias (Normativa BCRA A8406)”, y conforme a
las definiciones allí establecidas para la operatoria de Cobro con Transferencia (CCT), se detallan a
continuación las adecuaciones que serán incorporadas en Base24.

Estas adecuaciones se encuentran orientadas a soportar el nuevo instrumento de cobro interoperable
definido por la normativa, destinado inicialmente al cobro recurrente de cuotas de préstamos mediante
Transferencias Inmediatas generadas por el administrador COELSA, e impactarán tanto en la
mensajería Host to Host (HTH) como en el archivo de extract de TLF.

A los fines de su identificación, BCRA estableció que la operatoria definida como Cobro con Transferencia
(CCT) será referida mediante el motivo “CXT”, el cual será utilizado en la mensajería y archivo.

Los nuevos datos se informarán en el token R8, dentro del campo 126. El envío de dicho token será
configurable por entidad para las transacciones “F3XX00” y “F400XX”.

Asimismo, para asegurar la compatibilidad de la solución se mantendrá la información enviada en el campo
55.

A efectos de permitir la correcta identificación de la nueva operatoria, se utilizará el siguiente tipo de
transferencia:

•      Tipo-Tran “B”: corresponde a un nuevo tipo de transferencia y será utilizado para identificar las
operaciones de Cobro de préstamos con Transferencia.
                                                                                            Referencia
                                          ANEXO
                                                                                            Vigente desde         29/06/2026
                                                                                            Capítulo                       1
                      ADAPTACION EN LA MENSAJERIA DE DEBIN
                                                                                            Página                         4

  3. Mensajería Host to Host

   3.1      F3XX00 (Debito DEBIN)

   3.1.1 Requerimiento de la transacción “F3” (débito DEBIN)
        Mensaje 0200

 Bit           Campo           Tipo                  Descripción                                 Detalles
P-001    SECONDARY BITMAP       X(16)   Bitmap secundario                             Aquí se informarán como
                                                                                      presentes en el mensaje los
                                                                                      campos que figuran a
                                                                                      continuación.
P-002    PAN                    X(19)   Primary Account Number                        Número de tarjeta
P-003    PROCESSING CODE        X(6)    Se informa en las siguientes                  F3XX00
                                        posiciones:                                   Donde XX corresponde al tipo
                                        1-2: código de transacción.                   de cuenta origen
                                        3-4: tipo de cuenta que recibe el débito.
                                        5-6: tipo de cuenta que recibe el
                                        crédito.
P-004    TRAN-AMT               9(12)   Monto de la operación                      Sin cambios respecto a la solución
                                        Formato: 9 enteros + 2 decimales           actual
P-007    TRANSMISSION DATE      9(10)   Fecha y hora de transmisión del mensaje Sin cambios respecto a la solución
         AND TIME                                                                  actual
P-011    SYSTEMS TRACE          9(6)    Número de mensaje usado para               Sin cambios respecto a la solución
         AUDIT NUMBER                   establecer la correspondencia de una       actual
                                        respuesta y su original
P-012    LOCAL TRANSACTION      9(6)    Hora local en que comenzó la transacción Sin cambios respecto a la solución
         TIME                                                                      actual
P-013    LOCAL TRANSACTION      9(4)    Fecha calendario en que comenzó la         Sin cambios respecto a la solución
         DATE                           transacción                                actual
P-015    SETL-DAT               9(4)    Fecha de negocio a que corresponde la      Sin cambios respecto a la solución
                                        transacción. Formato mmdd.                 actual
P-017    CAPTURE DATE           9(4)    Fecha de negocio en que la transacción     Sin cambios respecto a la solución
                                        fue procesada                              actual
P-022    ENTRY-MODE             9(3)    Modo en que la operación ingresó a la      Sin cambios respecto a la solución
                                        terminal                                   actual
P-032    ACQUIRING              9(11)   Número de Identificación de la institución Sin cambios respecto a la solución
         INSTITUTION                    a la que pertenece la terminal             actual
         IDENTIFICATION CODE
P-035    TRACK 2 DATA           X(37)   Track 2 de la tarjeta                         Sin cambios respecto a la solución
                                                                                      actual
P-037    RETRIEVAL              X(12)   Número asignado por el originador del         Sin cambios respecto a la solución
         REFERENCE NUMBER               mensaje para identificar una transacción.     actual
P-041    CARD ACCEPTOR          X(16)   Identificador de la terminal que acepta la    Sin cambios respecto a la solución
         TERMINAL                       transacción.                                  actual
         IDENTIFICATION
P-043    CARD ACCEPTOR          X(40)   1-22: Nombre del administrador del            Sin cambios respecto a la solución
         NAME                           Cajero.                                       actual
                                        23-35: Ciudad del Cajero.
                                        36-38: Estado del Cajero.
                                        39-40: País del Cajero.
P-049    TRANSACTION            9(3)    Código ISO de la moneda                       Sin cambios respecto a la solución
         CURRENCY CODE                  032 = Pesos                                   actual
                                        840 = Dólares
P-052    PERSONAL               X(16)   Clave de identificación personal (PIN) del    Se enviarán 16 “F”.
         IDENTIFICATION                 tarjetahabiente, encriptado por la clave de   Es opcional se configura por
         NUMBER DATA                    comunicación.                                 entidad
P-054    ADD-AMTS              X(023)   1-3: Longitud del campo                       Se informará tipo “B” para
                                        4-26: Ver debajo detalle de campo 54          identificar el cobro de préstamo
                                                                                      con transferencia
                                                                                           Referencia
                                         ANEXO
                                                                                           Vigente desde         29/06/2026
                                                                                           Capítulo                      1
                     ADAPTACION EN LA MENSAJERIA DE DEBIN
                                                                                           Página                        5

 Bit          Campo           Tipo                  Descripción                                 Detalles
P-055   PRI-RSRVD1-ISO        X(363)   1-3: Longitud del campo                      Sin cambios respecto a la solución
                                       4-N: Ver debajo detalle de campo 55          actual
P-060   TERMINAL DATA         X(15)    1-3: Longitud del campo.                     Sin cambios respecto a la solución
                                       4-7: Siglas institución dueña de la          actual
                                       terminal.
                                       8-11: Red lógica de la terminal.
                                       12-15: Diferencia horaria entre hora local
                                       de transacción y hora del sistema.
P-061   CARD ISSUER           X(16)    1-3: Longitud del campo.                     Sin cambios respecto a la solución
        AUTHORIZER DATA                4-7: Sigla de la institución emisora de la   actual
                                       tarjeta.
S-102   ACCOUNT               X(28)    Identificación de la cuenta Origen           Identificación de la cuenta en
        IDENTIFICATION 1               1-2: Longitud del campo.                     formato “PBF”.
                                       3-N: Número de cuenta.
S-126   SECNDRY-RSRVD7-       X(998)   Área de Tokens – Ver definición del          Se informan datos asociados a
        PRVT                           token “QS” y “R8”                            la operatoria de Cobro de
                                                                                    préstamo con transferencia

   3.1.2 Respuesta de la transacción “F3” (débito DEBIN)
  Mensaje tipo 0210

 Bit          Campo           Tipo                  Descripción                                 Detalles
P-001   SECONDARY BITMAP      X(16)    Bitmap secundario                            Aquí se informarán como
                                                                                    presentes en el mensaje los
                                                                                    campos que figuran a
                                                                                    continuación.
P-002   PAN                   X(19)    Primary Account Number                       Número de tarjeta
P-003   PROCESSING CODE       X(6)     Se informa en las siguientes                 F3XX00
                                       posiciones:                                  Donde XX corresponde al tipo
                                       1-2: código de transacción.                  de cuenta origen
                                       3-4: tipo de cuenta desde la cual se
                                       debita.
                                       5-6: Se informa con ceros.
P-004   TRAN-AMT              9(12)    Monto de la operación                        Sin cambios respecto a la solución
                                       Formato: 9 enteros + 2 decimales             actual
P-007   TRANSMISSION DATE     9(10)    Fecha y hora de transmisión del mensaje      Sin cambios respecto a la solución
        AND TIME                                                                    actual
P-011   SYSTEMS TRACE          9(6)    Número de mensaje usado para                 Sin cambios respecto a la solución
        AUDIT NUMBER                   establecer la correspondencia de una         actual
                                       respuesta y su original
P-012   LOCAL TRANSACTION      9(6)    Hora local en que comenzó la transacción     Sin cambios respecto a la solución
        TIME                                                                        actual
P-013   LOCAL TRANSACTION      9(4)    Fecha calendario en que comenzó la           Sin cambios respecto a la solución
        DATE                           transacción                                  actual
P-015   SETTLEMENT DATE        9(4)    Fecha de negocio a que corresponde la        Sin cambios respecto a la solución
                                       transacción                                  actual. Link responderá aquí con
                                                                                    el mismo valor que responderá en
                                                                                    el campo P-017.
P-017   CAPTURE DATE           9(4)    Fecha de negocio en que la transacción       Sin cambios respecto a la solución
                                       fue procesada                                actual
P-022   ENTRY-MODE             9(3)    Modo en que la operación ingresó a la        Sin cambios respecto a la solución
                                       terminal                                     actual
P-032   ACQUIRING             9(11)    Número de Identificación de la institución   Sin cambios respecto a la solución
        INSTITUTION                    a la que pertenece la terminal               actual
        IDENTIFICATION CODE
P-035   TRACK 2 DATA          X(37)    Track 2 de la tarjeta                        Sin cambios respecto a la solución
                                                                                    actual
P-037   RETRIEVAL             X(12)    Número asignado por el originador del        Sin cambios respecto a la solución
        REFERENCE NUMBER               mensaje para identificar una transacción.    actual
P-039   RESPONSE CODE          9(2)    00 = Aprobada.                               Estos códigos de retorno se
                                                                                    habilitaron para esta operatoria.
                                                                                         Referencia
                                       ANEXO
                                                                                         Vigente desde         29/06/2026
                                                                                         Capítulo                      1
                     ADAPTACION EN LA MENSAJERIA DE DEBIN
                                                                                         Página                        6

 Bit          Campo          Tipo                 Descripción                                 Detalles
P-041   CARD ACCEPTOR        X(16)   Identificador de la terminal que acepta la   Sin cambios respecto a la solución
        TERMINAL                     transacción.                                 actual
        IDENTIFICATION
P-045   TRACK 1 DATA         X(76)   Track 1 de la tarjeta                        En caso de que no venga
                                                                                  informado se enviará el texto
                                                                                  “SINTRACK1” seguido de
                                                                                  espacios en blanco hasta
                                                                                  completar el tamaño total del
                                                                                  campo.
P-049   TRANSACTION          9(3)    Código ISO de la moneda                      Código de moneda de la cuenta, o
        CURRENCY CODE                032 = Pesos                                  ceros si la respuesta es rechazo.
                                     840 = Dólares
P-054   ADD-AMTS            X(023)   1-3: Longitud del campo                      Sin cambios respecto a la solución
                                     4-23: Ver debajo detalle de campo 54         actual
P-055   PRI-RSRVD1-ISO      X(363)   1-3: Longitud del campo                      Se informan datos asociados a
                                     4-N: Ver debajo detalle de campo 55          la operatoria de DEBIN
P-060   TERMINAL DATA        X(15)   1-3: Longitud del campo.                     Sin cambios respecto a la solución
                                     4-7: Siglas institución dueña de la          actual
                                     terminal.
                                     8-11: Red lógica de la terminal.
                                     12-15: Diferencia horaria entre hora local
                                     de transacción y hora del sistema.
P-061   CARD ISSUER          X(16)   1-3: Longitud del campo.                     Sin cambios respecto a la solución
        AUTHORIZER DATA              4-7: Sigla de la institución emisora de la   actual
                                     tarjeta.
S-102   ACCOUNT              X(28)   Identificación de la cuenta desde donde      Identificación de la cuenta en
        IDENTIFICATION 1             se debitan los fondos                        formato “PBF”.
                                     1-2: Longitud del campo.
                                     3-N: Número de cuenta.

   3.1.3 Reverso de la transacción “F3” (débito DEBIN)
  Mensaje tipo 0420

 Bit          Campo          Tipo                 Descripción                                 Detalles
P-001   SECONDARY BITMAP     X(16)   Bitmap secundario                            Aquí se informarán como
                                                                                  presentes en el mensaje los
                                                                                  campos que figuran a
                                                                                  continuación.
P-002   PAN                  X(19)   Primary Account Number                       Número de tarjeta
P-003   PROCESSING CODE      X(6)    Se informa en las siguientes                 F3XX00
                                     posiciones:                                  Donde XX corresponde al tipo
                                     1-2: código de transacción.                  de cuenta origen
                                     3-4: tipo de cuenta que recibe el débito.
                                     5-6: tipo de cuenta que recibe el
                                     crédito.
P-004   TRAN-AMT             9(12)   Monto de la operación                     Sin cambios respecto a la solución
                                     Formato: 9 enteros + 2 decimales          actual
P-007   TRANSMISSION DATE    9(10)   Fecha y hora de transmisión del mensaje Sin cambios respecto a la solución
        AND TIME                                                               actual
P-011   SYSTEMS TRACE        9(6)    Número de mensaje usado para              Sin cambios respecto a la solución
        AUDIT NUMBER                 establecer la correspondencia de una      actual
                                     respuesta y su original
P-012   LOCAL TRANSACTION    9(6)    Hora local en que comenzó la transacción Sin cambios respecto a la solución
        TIME                                                                   actual
P-013   LOCAL TRANSACTION    9(4)    Fecha calendario en que comenzó la        Sin cambios respecto a la solución
        DATE                         transacción                               actual
P-017   CAPTURE DATE         9(4)    Fecha de negocio en que la transacción    Sin cambios respecto a la solución
                                     fue procesada                             actual
P-022   ENTRY-MODE           9(3)    Modo en que la operación ingresó a la     Sin cambios respecto a la solución
                                     terminal                                  actual
                                                                                           Referencia
                                         ANEXO
                                                                                           Vigente desde         29/06/2026
                                                                                           Capítulo                      1
                    ADAPTACION EN LA MENSAJERIA DE DEBIN
                                                                                           Página                        7

 Bit          Campo           Tipo                  Descripción                                 Detalles
P-032   ACQUIRING             9(11)    Número de Identificación de la institución   Sin cambios respecto a la solución
        INSTITUTION                    a la que pertenece la terminal               actual
        IDENTIFICATION CODE
P-035   TRACK 2 DATA          X(37)    Track 2 de la tarjeta                        Sin cambios respecto a la solución
                                                                                    actual
P-037   RETRIEVAL             X(12)    Número asignado por el originador del        Sin cambios respecto a la solución
        REFERENCE NUMBER               mensaje para identificar una transacción.    actual
P-039   RESPONSE CODE          9(2)    00 = Aprobada.                               Estos códigos de retorno se
                                                                                    habilitaron para esta operatoria.
P-041   CARD ACCEPTOR         X(16)    Identificador de la terminal que acepta la   Sin cambios respecto a la solución
        TERMINAL                       transacción.                                 actual
        IDENTIFICATION
P-043   CARD ACCEPTOR         X(40)    1-22: Nombre del administrador del           Sin cambios respecto a la solución
        NAME                           Cajero.                                      actual
                                       23-35: Ciudad del Cajero.
                                       36-38: Estado del Cajero.
                                       39-40: País del Cajero.
P-045   TRACK 1 DATA          X(76)    Track 1 de la tarjeta                        En caso de que no venga
                                                                                    informado se enviará el texto
                                                                                    “SINTRACK1” seguido de
                                                                                    espacios en blanco hasta
                                                                                    completar el tamaño total del
                                                                                    campo.
P-049   TRANSACTION            9(3)    Código ISO de la moneda                      Sin cambios respecto a la solución
        CURRENCY CODE                  032 = Pesos                                  actual
                                       840 = Dólares
P-054   ADD-AMTS              X(023)   1-3: Longitud del campo                      Se informará tipo “B” para
                                       4-26: Ver debajo detalle de campo 54         identificar el cobro de préstamo
                                                                                    con transferencia
P-055   PRI-RSRVD1-ISO        X(363)   1-3: Longitud del campo                      Sin cambios respecto a la solución
                                       4-N: Ver debajo detalle de campo 55          actual
P-060   TERMINAL DATA         X(15)    1-3: Longitud del campo.                     Sin cambios respecto a la solución
                                       4-7: Siglas institución dueña de la          actual
                                       terminal.
                                       8-11: Red lógica de la terminal.
                                       12-15: Diferencia horaria entre hora local
                                       de transacción y hora del sistema.
P-061   CARD ISSUER           X(16)    1-3: Longitud del campo.                     Sin cambios respecto a la solución
        AUTHORIZER DATA                4-7: Sigla de la institución emisora de la   actual
                                       tarjeta.
S-090   ORIG-INFO             X(42)    1-4: ORIG-TYP: Tipo de mensaje original      Sin cambios respecto a la solución
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
S-102   ACCOUNT               X(28)    Identificación de la cuenta Origen           Identificación de la cuenta en
        IDENTIFICATION 1               1-2: Longitud del campo.                     formato “PBF”.
                                       3-N: Número de cuenta.
S-126   SECNDRY-RSRVD7-       X(998)   Área de Tokens – Ver definición del          Se informan datos asociados a
        PRVT                           token “QS” y “R8”                            la operatoria de Cobro de
                                                                                    préstamo con transferencia
                                                                                         Referencia
                                        ANEXO
                                                                                         Vigente desde         29/06/2026
                                                                                         Capítulo                       1
                    ADAPTACION EN LA MENSAJERIA DE DEBIN
                                                                                         Página                         8

   3.1.4 Respuesta al reverso de la transacción “F3” (débito DEBIN)
  Mensaje tipo 0430

 Bit          Campo           Tipo                 Descripción                                Detalles
P-001   SECONDARY BITMAP      X(16)   Bitmap secundario                            Aquí se informarán como
                                                                                   presentes en el mensaje los
                                                                                   campos que figuran a
                                                                                   continuación.
P-002   PAN                   X(19)   Primary Account Number                       Número de tarjeta
P-003   PROCESSING CODE       X(6)    Se informa en las siguientes                 F3XX00
                                      posiciones:                                  Donde XX corresponde al tipo
                                      1-2: código de transacción.                  de cuenta origen
                                      3-4: tipo de cuenta que recibe el débito.
                                      5-6: tipo de cuenta que recibe el
                                      crédito.
P-004   TRAN-AMT              9(12)   Monto de la operación                      Sin cambios respecto a la solución
                                      Formato: 9 enteros + 2 decimales           actual
P-007   TRANSMISSION DATE     9(10)   Fecha y hora de transmisión del mensaje Sin cambios respecto a la solución
        AND TIME                                                                 actual
P-011   SYSTEMS TRACE         9(6)    Número de mensaje usado para               Sin cambios respecto a la solución
        AUDIT NUMBER                  establecer la correspondencia de una       actual
                                      respuesta y su original
P-032   ACQUIRING             9(11)   Número de Identificación de la institución Sin cambios respecto a la solución
        INSTITUTION                   a la que pertenece la terminal             actual
        IDENTIFICATION CODE
P-035   TRACK 2 DATA          X(37)   Track 2 de la tarjeta                        Sin cambios respecto a la solución
                                                                                   actual
P-037   RETRIEVAL             X(12)   Número asignado por el originador del        Sin cambios respecto a la solución
        REFERENCE NUMBER              mensaje para identificar una transacción.    actual
P-039   RESPONSE CODE         9(2)    00 = Aprobada.                               Estos códigos de retorno se
                                                                                   habilitaron para esta operatoria.
P-041   CARD ACCEPTOR         X(16)   Identificador de la terminal que acepta la   Sin cambios respecto a la solución
        TERMINAL                      transacción.                                 actual
        IDENTIFICATION
P-043   CARD ACCEPTOR         X(40)   1-22: Nombre del administrador del           Sin cambios respecto a la solución
        NAME                          Cajero.                                      actual
                                      23-35: Ciudad del Cajero.
                                      36-38: Estado del Cajero.
                                      39-40: País del Cajero.
P-049   TRANSACTION           9(3)    Código ISO de la moneda                      Sin cambios respecto a la solución
        CURRENCY CODE                 032 = Pesos                                  actual
                                      840 = Dólares
P-060   TERMINAL DATA         X(15)   1-3: Longitud del campo.                     Sin cambios respecto a la solución
                                      4-7: Siglas institución dueña de la          actual
                                      terminal.
                                      8-11: Red lógica de la terminal.
                                      12-15: Diferencia horaria entre hora local
                                      de transacción y hora del sistema.
P-061   CARD ISSUER           X(16)   1-3: Longitud del campo.                     Sin cambios respecto a la solución
        AUTHORIZER DATA               4-7: Sigla de la institución emisora de la   actual
                                      tarjeta.
S-090   ORIG-INFO             X(42)   1-4: ORIG-TYP: Tipo de mensaje original      Sin cambios respecto a la solución
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
                                                                                            Referencia
                                          ANEXO
                                                                                            Vigente desde         29/06/2026
                                                                                            Capítulo                       1
                      ADAPTACION EN LA MENSAJERIA DE DEBIN
                                                                                            Página                         9

   3.2      F400XX (Crédito DEBIN)

   3.2.1 Requerimiento de la transacción “F4” (crédito DEBIN)
   Mensaje 0200

 Bit           Campo           Tipo                  Descripción                                 Detalles
P-001    SECONDARY BITMAP      X(16)    Bitmap secundario                             Aquí se informarán como
                                                                                      presentes en el mensaje los
                                                                                      campos que figuran a
                                                                                      continuación.
P-002    PAN                   X(19)    Primary Account Number                        Número de tarjeta
P-003    PROCESSING CODE       X(6)     Se informa en las siguientes                  F400XX
                                        posiciones:                                   Donde XX corresponde al tipo
                                        1-2: código de transacción.                   de cuenta origen
                                        3-4: tipo de cuenta que recibe el débito.
                                        5-6: tipo de cuenta que recibe el
                                        crédito.
P-004    TRAN-AMT              9(12)    Monto de la operación                      Sin cambios respecto a la solución
                                        Formato: 9 enteros + 2 decimales           actual
P-007    TRANSMISSION DATE     9(10)    Fecha y hora de transmisión del mensaje Sin cambios respecto a la solución
         AND TIME                                                                  actual
P-011    SYSTEMS TRACE          9(6)    Número de mensaje usado para               Sin cambios respecto a la solución
         AUDIT NUMBER                   establecer la correspondencia de una       actual
                                        respuesta y su original
P-012    LOCAL TRANSACTION      9(6)    Hora local en que comenzó la transacción Sin cambios respecto a la solución
         TIME                                                                      actual
P-013    LOCAL TRANSACTION      9(4)    Fecha calendario en que comenzó la         Sin cambios respecto a la solución
         DATE                           transacción                                actual
P-015    SETL-DAT               9(4)    Fecha de negocio a que corresponde la      Sin cambios respecto a la solución
                                        transacción. Formato mmdd.                 actual
P-017    CAPTURE DATE           9(4)    Fecha de negocio en que la transacción     Sin cambios respecto a la solución
                                        fue procesada                              actual
P-022    ENTRY-MODE             9(3)    Modo en que la operación ingresó a la      Sin cambios respecto a la solución
                                        terminal                                   actual
P-032    ACQUIRING             9(11)    Número de Identificación de la institución Sin cambios respecto a la solución
         INSTITUTION                    a la que pertenece la terminal             actual
         IDENTIFICATION CODE
P-035    TRACK 2 DATA          X(37)    Track 2 de la tarjeta                         Sin cambios respecto a la solución
                                                                                      actual
P-037    RETRIEVAL             X(12)    Número asignado por el originador del         Sin cambios respecto a la solución
         REFERENCE NUMBER               mensaje para identificar una transacción.     actual
P-041    CARD ACCEPTOR         X(16)    Identificador de la terminal que acepta la    Sin cambios respecto a la solución
         TERMINAL                       transacción.                                  actual
         IDENTIFICATION
P-043    CARD ACCEPTOR         X(40)    1-22: Nombre del administrador del            Sin cambios respecto a la solución
         NAME                           Cajero.                                       actual
                                        23-35: Ciudad del Cajero.
                                        36-38: Estado del Cajero.
                                        39-40: País del Cajero.
P-049    TRANSACTION            9(3)    Código ISO de la moneda                       Sin cambios respecto a la solución
         CURRENCY CODE                  032 = Pesos                                   actual
                                        840 = Dólares
P-052    PERSONAL              X(16)    Clave de identificación personal (PIN) del    Se enviarán 16 “F”.
         IDENTIFICATION                 tarjetahabiente, encriptado por la clave de   Es opcional se configura por
         NUMBER DATA                    comunicación.                                 entidad
P-054    ADD-AMTS              X(023)   1-3: Longitud del campo                       Se informará tipo “B” para
                                        4-26: Ver debajo detalle de campo 54          identificar el cobro de préstamo
                                                                                      con transferencia
P-055    PRI-RSRVD1-ISO        X(363)   1-3: Longitud del campo                       Sin cambios respecto a la solución
                                        4-N: Ver debajo detalle de campo 55           actual
                                                                                            Referencia
                                         ANEXO
                                                                                            Vigente desde         29/06/2026
                                                                                            Capítulo                      1
                     ADAPTACION EN LA MENSAJERIA DE DEBIN
                                                                                            Página                        10

 Bit          Campo           Tipo                  Descripción                                  Detalles
P-060   TERMINAL DATA         X(15)    1-3: Longitud del campo.                      Sin cambios respecto a la solución
                                       4-7: Siglas institución dueña de la           actual
                                       terminal.
                                       8-11: Red lógica de la terminal.
                                       12-15: Diferencia horaria entre hora local
                                       de transacción y hora del sistema.
P-061   CARD ISSUER           X(16)    1-3: Longitud del campo.                      Sin cambios respecto a la solución
        AUTHORIZER DATA                4-7: Sigla de la institución emisora de la    actual
                                       tarjeta.
S-103   ACCOUNT               X(28)    Identificación de la cuenta de acreditación   Identificación de la cuenta en
        IDENTIFICATION 2               1-2: Longitud del campo.                      formato “PBF”.
                                       3-N: Número de cuenta.
S-126   SECNDRY-RSRVD7-       X(998)   Área de Tokens – Ver definición del           Se informan datos asociados a
        PRVT                           token “QS” y “R8”                             la operatoria de Cobro de
                                                                                     préstamo con transferencia

   3.2.2 Respuesta de la transacción “F4” (crédito DEBIN)
   Mensaje tipo 0210

 Bit          Campo           Tipo                  Descripción                                  Detalles
P-001   SECONDARY BITMAP      X(16)    Bitmap secundario                             Aquí se informarán como
                                                                                     presentes en el mensaje los
                                                                                     campos que figuran a
                                                                                     continuación.
P-002   PAN                   X(19)    Primary Account Number                        Número de tarjeta
P-003   PROCESSING CODE       X(6)     Se informa en las siguientes                  F400XX
                                       posiciones:                                   Donde XX corresponde al tipo
                                       1-2: código de transacción.                   de cuenta origen
                                       3-4: tipo de cuenta desde la cual se
                                       debita.
                                       5-6: Se informa con ceros.
P-004   TRAN-AMT              9(12)    Monto de la operación                         Sin cambios respecto a la solución
                                       Formato: 9 enteros + 2 decimales              actual
P-007   TRANSMISSION DATE     9(10)    Fecha y hora de transmisión del mensaje       Sin cambios respecto a la solución
        AND TIME                                                                     actual
P-011   SYSTEMS TRACE          9(6)    Número de mensaje usado para                  Sin cambios respecto a la solución
        AUDIT NUMBER                   establecer la correspondencia de una          actual
                                       respuesta y su original
P-012   LOCAL TRANSACTION      9(6)    Hora local en que comenzó la transacción      Sin cambios respecto a la solución
        TIME                                                                         actual
P-013   LOCAL TRANSACTION      9(4)    Fecha calendario en que comenzó la            Sin cambios respecto a la solución
        DATE                           transacción                                   actual
P-015   SETTLEMENT DATE        9(4)    Fecha de negocio a que corresponde la         Sin cambios respecto a la solución
                                       transacción                                   actual. Link responderá aquí con
                                                                                     el mismo valor que responderá en
                                                                                     el campo P-017.
P-017   CAPTURE DATE           9(4)    Fecha de negocio en que la transacción        Sin cambios respecto a la solución
                                       fue procesada                                 actual
P-022   ENTRY-MODE             9(3)    Modo en que la operación ingresó a la         Sin cambios respecto a la solución
                                       terminal                                      actual
P-032   ACQUIRING             9(11)    Número de Identificación de la institución    Sin cambios respecto a la solución
        INSTITUTION                    a la que pertenece la terminal                actual
        IDENTIFICATION CODE
P-035   TRACK 2 DATA          X(37)    Track 2 de la tarjeta                         Sin cambios respecto a la solución
                                                                                     actual
P-037   RETRIEVAL             X(12)    Número asignado por el originador del         Sin cambios respecto a la solución
        REFERENCE NUMBER               mensaje para identificar una transacción.     actual
P-039   RESPONSE CODE          9(2)    00 = Aprobada.                                Estos códigos de retorno se
                                                                                     habilitaron para esta operatoria.
                                                                                          Referencia
                                       ANEXO
                                                                                          Vigente desde         29/06/2026
                                                                                          Capítulo                      1
                     ADAPTACION EN LA MENSAJERIA DE DEBIN
                                                                                          Página                        11

 Bit          Campo          Tipo                 Descripción                                  Detalles
P-041   CARD ACCEPTOR        X(16)   Identificador de la terminal que acepta la    Sin cambios respecto a la solución
        TERMINAL                     transacción.                                  actual
        IDENTIFICATION
P-045   TRACK 1 DATA         X(76)   Track 1 de la tarjeta                         En caso de que no venga
                                                                                   informado se enviará el texto
                                                                                   “SINTRACK1” seguido de
                                                                                   espacios en blanco hasta
                                                                                   completar el tamaño total del
                                                                                   campo.
P-049   TRANSACTION          9(3)    Código ISO de la moneda                       Código de moneda de la cuenta, o
        CURRENCY CODE                032 = Pesos                                   ceros si la respuesta es rechazo.
                                     840 = Dólares
P-054   ADD-AMTS            X(023)   1-3:Longitud del campo                        Sin cambios respecto a la solución
                                     4-23:Blancos                                  actual
P-055   PRI-RSRVD1-ISO      X(363)   1-3: Longitud del campo                       Se informan datos asociados a
                                     4-N: Ver debajo detalle de campo 55           la operatoria de DEBIN
P-060   TERMINAL DATA        X(15)   1-3: Longitud del campo.                      Sin cambios respecto a la solución
                                     4-7: Siglas institución dueña de la           actual
                                     terminal.
                                     8-11: Red lógica de la terminal.
                                     12-15: Diferencia horaria entre hora local
                                     de transacción y hora del sistema.
P-061   CARD ISSUER          X(16)   1-3: Longitud del campo.                      Sin cambios respecto a la solución
        AUTHORIZER DATA              4-7: Sigla de la institución emisora de la    actual
                                     tarjeta.
S-103   ACCOUNT              X(28)   Identificación de la cuenta de acreditación   Identificación de la cuenta en
        IDENTIFICATION 2             1-2: Longitud del campo.                      formato “PBF”.
                                     3-N: Número de cuenta.

   3.2.3 Reverso de la transacción “F4” (crédito DEBIN)
  Mensaje tipo 0420

 Bit          Campo          Tipo                 Descripción                                  Detalles
P-001   SECONDARY BITMAP     X(16)   Bitmap secundario                             Aquí se informarán como
                                                                                   presentes en el mensaje los
                                                                                   campos que figuran a
                                                                                   continuación.
P-002   PAN                  X(19)   Primary Account Number                        Número de tarjeta
P-003   PROCESSING CODE      X(6)    Se informa en las siguientes                  F400XX
                                     posiciones:                                   Donde XX corresponde al tipo
                                     1-2: código de transacción.                   de cuenta origen
                                     3-4: tipo de cuenta que recibe el débito.
                                     5-6: tipo de cuenta que recibe el
                                     crédito.
P-004   TRAN-AMT             9(12)   Monto de la operación                     Sin cambios respecto a la solución
                                     Formato: 9 enteros + 2 decimales          actual
P-007   TRANSMISSION DATE    9(10)   Fecha y hora de transmisión del mensaje Sin cambios respecto a la solución
        AND TIME                                                               actual
P-011   SYSTEMS TRACE        9(6)    Número de mensaje usado para              Sin cambios respecto a la solución
        AUDIT NUMBER                 establecer la correspondencia de una      actual
                                     respuesta y su original
P-012   LOCAL TRANSACTION    9(6)    Hora local en que comenzó la transacción Sin cambios respecto a la solución
        TIME                                                                   actual
P-013   LOCAL TRANSACTION    9(4)    Fecha calendario en que comenzó la        Sin cambios respecto a la solución
        DATE                         transacción                               actual
P-017   CAPTURE DATE         9(4)    Fecha de negocio en que la transacción    Sin cambios respecto a la solución
                                     fue procesada                             actual
P-022   ENTRY-MODE           9(3)    Modo en que la operación ingresó a la     Sin cambios respecto a la solución
                                     terminal                                  actual
                                                                                            Referencia
                                         ANEXO
                                                                                            Vigente desde         29/06/2026
                                                                                            Capítulo                      1
                    ADAPTACION EN LA MENSAJERIA DE DEBIN
                                                                                            Página                        12

 Bit          Campo           Tipo                  Descripción                                  Detalles
P-032   ACQUIRING             9(11)    Número de Identificación de la institución    Sin cambios respecto a la solución
        INSTITUTION                    a la que pertenece la terminal                actual
        IDENTIFICATION CODE
P-035   TRACK 2 DATA          X(37)    Track 2 de la tarjeta                         Sin cambios respecto a la solución
                                                                                     actual
P-037   RETRIEVAL             X(12)    Número asignado por el originador del         Sin cambios respecto a la solución
        REFERENCE NUMBER               mensaje para identificar una transacción.     actual
P-039   RESPONSE CODE          9(2)    00 = Aprobada.                                Estos códigos de retorno se
                                                                                     habilitaron para esta operatoria.
P-041   CARD ACCEPTOR         X(16)    Identificador de la terminal que acepta la    Sin cambios respecto a la solución
        TERMINAL                       transacción.                                  actual
        IDENTIFICATION
P-043   CARD ACCEPTOR         X(40)    1-22: Nombre del administrador del            Sin cambios respecto a la solución
        NAME                           Cajero.                                       actual
                                       23-35: Ciudad del Cajero.
                                       36-38: Estado del Cajero.
                                       39-40: País del Cajero.
P-045   TRACK 1 DATA          X(76)    Track 1 de la tarjeta                         En caso de que no venga
                                                                                     informado se enviará el texto
                                                                                     “SINTRACK1” seguido de
                                                                                     espacios en blanco hasta
                                                                                     completar el tamaño total del
                                                                                     campo.
P-049   TRANSACTION            9(3)    Código ISO de la moneda                       Sin cambios respecto a la solución
        CURRENCY CODE                  032 = Pesos                                   actual
                                       840 = Dólares
P-054   ADD-AMTS              X(023)   1-3: Longitud del campo                       Se informará tipo “B” para
                                       4-26: Ver debajo detalle de campo 54          identificar el cobro de préstamo
                                                                                     con transferencia
P-055   PRI-RSRVD1-ISO        X(363)   1-3: Longitud del campo                       Sin cambios respecto a la solución
                                       4-N: Ver debajo detalle de campo 55           actual
P-060   TERMINAL DATA         X(15)    1-3: Longitud del campo.                      Sin cambios respecto a la solución
                                       4-7: Siglas institución dueña de la           actual
                                       terminal.
                                       8-11: Red lógica de la terminal.
                                       12-15: Diferencia horaria entre hora local
                                       de transacción y hora del sistema.
P-061   CARD ISSUER           X(16)    1-3: Longitud del campo.                      Sin cambios respecto a la solución
        AUTHORIZER DATA                4-7: Sigla de la institución emisora de la    actual
                                       tarjeta.
S-090   ORIG-INFO             X(42)    1-4: ORIG-TYP: Tipo de mensaje original       Sin cambios respecto a la solución
                                       5-16: ORIG-SEQ-NUM: Secuencia de la           actual
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
S-103   ACCOUNT               X(28)    Identificación de la cuenta de acreditación   Identificación de la cuenta en
        IDENTIFICATION 2               1-2: Longitud del campo.                      formato “PBF”.
                                       3-N: Número de cuenta.
S-126   SECNDRY-RSRVD7-       X(998)   Área de Tokens – Ver definición del           Se informan datos asociados a
        PRVT                           token “QS” y “R8”                             la operatoria de Cobro de
                                                                                     préstamo con transferencia
                                                                                         Referencia
                                        ANEXO
                                                                                         Vigente desde         29/06/2026
                                                                                         Capítulo                       1
                    ADAPTACION EN LA MENSAJERIA DE DEBIN
                                                                                         Página                         13

   3.2.4 Respuesta al reverso de la transacción “F4” (crédito DEBIN)
  Mensaje tipo 0430

 Bit          Campo           Tipo                 Descripción                                Detalles
P-001   SECONDARY BITMAP      X(16)   Bitmap secundario                            Aquí se informarán como
                                                                                   presentes en el mensaje los
                                                                                   campos que figuran a
                                                                                   continuación.
P-002   PAN                   X(19)   Primary Account Number                       Número de tarjeta
P-003   PROCESSING CODE       X(6)    Se informa en las siguientes                 F400XX
                                      posiciones:                                  Donde XX corresponde al tipo
                                      1-2: código de transacción.                  de cuenta origen
                                      3-4: tipo de cuenta que recibe el débito.
                                      5-6: tipo de cuenta que recibe el
                                      crédito.
P-004   TRAN-AMT              9(12)   Monto de la operación                      Sin cambios respecto a la solución
                                      Formato: 9 enteros + 2 decimales           actual
P-007   TRANSMISSION DATE     9(10)   Fecha y hora de transmisión del mensaje Sin cambios respecto a la solución
        AND TIME                                                                 actual
P-011   SYSTEMS TRACE         9(6)    Número de mensaje usado para               Sin cambios respecto a la solución
        AUDIT NUMBER                  establecer la correspondencia de una       actual
                                      respuesta y su original
P-032   ACQUIRING             9(11)   Número de Identificación de la institución Sin cambios respecto a la solución
        INSTITUTION                   a la que pertenece la terminal             actual
        IDENTIFICATION CODE
P-035   TRACK 2 DATA          X(37)   Track 2 de la tarjeta                        Sin cambios respecto a la solución
                                                                                   actual
P-037   RETRIEVAL             X(12)   Número asignado por el originador del        Sin cambios respecto a la solución
        REFERENCE NUMBER              mensaje para identificar una transacción.    actual
P-039   RESPONSE CODE         9(2)    00 = Aprobada.                               Estos códigos de retorno se
                                                                                   habilitaron para esta operatoria.
P-041   CARD ACCEPTOR         X(16)   Identificador de la terminal que acepta la   Sin cambios respecto a la solución
        TERMINAL                      transacción.                                 actual
        IDENTIFICATION
P-043   CARD ACCEPTOR         X(40)   1-22: Nombre del administrador del           Sin cambios respecto a la solución
        NAME                          Cajero.                                      actual
                                      23-35: Ciudad del Cajero.
                                      36-38: Estado del Cajero.
                                      39-40: País del Cajero.
P-049   TRANSACTION           9(3)    Código ISO de la moneda                      Sin cambios respecto a la solución
        CURRENCY CODE                 032 = Pesos                                  actual
                                      840 = Dólares
P-060   TERMINAL DATA         X(15)   1-3: Longitud del campo.                     Sin cambios respecto a la solución
                                      4-7: Siglas institución dueña de la          actual
                                      terminal.
                                      8-11: Red lógica de la terminal.
                                      12-15: Diferencia horaria entre hora local
                                      de transacción y hora del sistema.
P-061   CARD ISSUER           X(16)   1-3: Longitud del campo.                     Sin cambios respecto a la solución
        AUTHORIZER DATA               4-7: Sigla de la institución emisora de la   actual
                                      tarjeta.
S-090   ORIG-INFO             X(42)   1-4: ORIG-TYP: Tipo de mensaje original      Sin cambios respecto a la solución
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
                                                                                          Referencia
                                        ANEXO
                                                                                          Vigente desde      29/06/2026
                                                                                          Capítulo                   1
                     ADAPTACION EN LA MENSAJERIA DE DEBIN
                                                                                          Página                     14

   3.3        Campos 54 – ADD-AMTS
Campo                       Tipo             Descripción
02 DEBIN.
  04 AMT                    PIC X(12)        Sin uso para esta operatoria
  04 TIPO-DEP               PIC X(01)        Identificador de Cobro de préstamo con transferencia
                                             Se informa el valor “B”
  04 FILLER                 PIC X(10)        Uso futuro.

   3.4        Redefinición del campo 55 - PRI-RSRVD1-ISO

 Nombre del campo                  Descripción                                                            Atributo
 LONGITUD                          Longitud del campo 55. El valor a informar es “247”.                   9(3)
 DEBIN
         ID                        Identificador de DEBIN                                                 X(32)
         CONCEPTO                  Concepto a definir por el BCRA                                         X(3)
         FIID-C                    FIID del comprador                                                     X(4)
         CUIT-C                    CUIT comprador                                                         X(11)
         CBU-C                     CBU del comprador                                                      X(22)
         NRO-CTA-C                 Cta PBF del comprador                                                  X(19)
         FIID-V                    FIID del vendedor                                                      X(4)
         CUIT-V                    CUIT vendedor                                                          X(11)
         CBU-V                     CBU del vendedor                                                       X(22)
         NRO-CTA-V                 Cta PBF del vendedor                                                   X(19)
         PAN                       Número de la tarjeta                                                   X(19)
         PAGADOR                   Nombre y apellido del pagador                                          X(40)
         MISMO-TITULAR             Cuenta pertenece al mismo titular.                                     X(1)
                                   Los valores posibles son:
                                   “S”: Cuenta propia.
                                   “P”: Cuenta propia compartida.
                                   “N”: Cuenta de terceros.
         PREAUTORIZACION           Si el Debin se debita por preautorización (S/N)                        X(1)
         ORIGEN                    Los valores posibles son:                                              X(1)
                                   “D” = Debin.
                                   “T” = Transferencia.
                                   “C” = Contracargo
                                   “P” = Debin PULL
                                   “B” = Cobro de préstamo con transferencia
         SCORING                   Puntaje del SCORING (0-100)                                            X(3)
         ID-CONTRACARGO            Identificador del CONTRA-CARGO                                         X(32)
         MOTIVO                    Motivo del CONTRA-CARGO                                                X(3)
                                                                                                      Referencia
                                                     ANEXO
                                                                                                      Vigente desde          29/06/2026
                                                                                                      Capítulo                        1
                     ADAPTACION EN LA MENSAJERIA DE DEBIN
                                                                                                      Página                          15

  3.5         Descripción del Campo 126
     Descripción de Tokens:

Los tokens son datos específicos que pueden ser informados en el campo 126. Cuando se quiere agregar
un token, el sistema agrega el header de tokens y a continuación los tokens de la transacción.

  Header de tokens:

El header de tokens se agrega al mensaje cuando se incorpora el primer token y se actualiza cada
vez que un token subsecuente se agrega.

Contiene los campos que se detallan a continuación:

     Nombre                       Formato                           Descripción
     Delimitador                  X(01)                             Valor fijo “&”
     Filler                       X(01)                             “”
                                                                    Indica la cantidad de tokens informados en el mensaje.
                                                                    El header es considerado un token más, es decir, si el campo
     Cantidad de Tokens           X(05)
                                                                    contiene el valor 00002, indicando que hay dos tokens en el
                                                                    mensaje; el header y uno adicional.
                                                                    Indica la longitud total de la información de todos los tokens;
     Longitud                     X(05)                             la longitud total del header, más la longitud de cada token
                                                                    adicional adherido al mensaje.

Tokens:

Los tokens incluidos en el mensaje se informan luego del header de tokens. Cada uno de ellos
presenta el formato token header + token Data.

  3.5.1 Token “QS”

Token Header
Campo                     Formato         Valor      Descripción
EYE CATCHER               X(2)            “! ”       Identificador literal.
TKN-ID                    X(2)            “QS”       Nombre o Identificador único de la estructura de datos.
                                                     Indica el largo total de los datos informado en el campo (alineado con ceros a
TKN-LGTH                  9(5)            “00420”
                                                     izquierda).
USER-FLD                  X(1)            “”         Blanco.
Token Data

Campo                     Formato         Descripción

ID                        X(32)           Identificador de DEBIN
CONCEPTO                  X(3)            Concepto
FIID-C                    X(4)            FIID del comprador
CUIT-C                    X(11)           CUIT comprador
                                                                                  Referencia
                                      ANEXO
                                                                                  Vigente desde   29/06/2026
                                                                                  Capítulo              1
                  ADAPTACION EN LA MENSAJERIA DE DEBIN
                                                                                  Página                16

CBU-C              X(22)   CBU del comprador

NRO-CTA-C          X(19)   Cta PBF del comprador

FIID-V             X(4)    FIID del vendedor

CUIT-V             X(11)   CUIT vendedor
CBU-V              X(22)   CBU del vendedor
NRO-CTA-V          X(19)   Cta PBF del vendedor

PAN                X(19)   Número de la tarjeta

PAGADOR            X(40)   Nombre y apellido del pagador
                           Cuenta pertenece al mismo titular.
                           Los valores posibles son:
MISMO-TITULAR      X(1)    “S”: Cuenta propia.
                           “P”: Cuenta propia compartida.
                           “N”: Cuenta de terceros.
PREAUTORIZACION    X(1)    Si el Debin se debita por preautorización (S/N)
                           Los valores posibles son:
                           “D” = Debin.
                           “T” = Transferencia.
ORIGEN             X(1)
                           “C” = Contracargo
                           “P” = Debin PULL
                           “B”: Cobro préstamo con transferencia

SCORING            X(3)    Puntaje del SCORING (0-100)

ID-CONTRACARGO     X(32)   Identificador del CONTRA-CARGO

MOTIVO             X(3)    Motivo del CONTRA-CARGO

                           Identificador de Crédito Forzado enviado por Coelsa.

FORZADO            X(1)    Los valores posibles son:
                           “N” o “ ”: Crédito de Debin no forzado.
                           “S”: Crédito de debin forzado.
                           Identificador del tipo de operación (COELSA)

                           Los valores posibles son:

                           •    DEBIN (DEBIN SPOT)
                           •    PREAU (DEBIN PREAUTORIZADO)
                           •    DEBQR (DEBIN QR)
                           •    TRXIN (TRANSFERENCIA)
                           •    CASHO (CASHOUT)
TIPO-OPERACION-            •    CONQR (CONTRACARGO QR)
                   X(5)    •    CONCA (CONTRACARGO DEBIN PREAUTORIZADO)
COELSA
                           •    DEVOL (DEVOLUCION DE TRANSFERENCIA O CASHOUT)
                           •    FEPDI (FACTURA ELECTRONICA – PAGO DIRECTO INMEDIATO)
                           •    RESCO (RESCATE COMISION COELSA)
                           •    DEVRE (DEVOLUCION RESCATE COMISION COELSA)
                           •    COMAD (COMISION ADQUIRENTE)
                           •    DEVCA (DEVOLUCION COMISION ADQUIRENTE)
                           •    COMBI (COMISION BILLETERA)
                           •    DEVCB (DEVOLUCION COMISION BILLETERA)
                           •    COMCO (COMSION COELSA)
                           •    DEVCO (DEVOLUSION COMISION COELSA)

CVU-COMPRADOR      X(22)   CVU del comprador
CUIT-CVU-C         X11)    CUIT del titular de la CVU Comprador
                                                                                            Referencia
                                             ANEXO
                                                                                            Vigente desde         29/06/2026
                                                                                            Capítulo                         1
                ADAPTACION EN LA MENSAJERIA DE DEBIN
                                                                                            Página                           17

TITULAR-CVU-C      X(40)        Nombre del titular de la CVU Comprador.

CVU-VENDEDOR       X(22)        CVU del vendedor
CUIT-CVU-V         X(11)        CUIT del titular de la CVU Vendedor
TITULAR-CVU-V      X(40)        Nombre del titular de la CVU Vendedor.
FILLER             X(21)        Uso futuro

 3.5.2 Token “R8” (Nuevo)

Token Header
Campo                   Format Valor          Descripción
                        o
EYE CATCHER             X(2)   “! ”           Identificador literal.
TKN-ID                  X(2)      “R8”        Nombre o Identificador único de la estructura de datos.

                                              Indica el largo total de los datos informado en el campo (alineado con ceros
TKN-LGTH                9(5)      “00092”
                                              a izquierda).

USER-FLD                X(1)      “”          Blanco.
Token Data
Campo                   Format    Descripción
                        o
ID-PRESTAMO             X(32)     Identificador del préstamo.
ID-COBRO                X(32)     Identificador del cobro del préstamo.
AUTH-ID-RESP            X(06)     Identificador del cobro, generado por el Administrador.
                                  Identifica la etapa del cobro del préstamo.

                                  Valores posibles:
ETAPA                   X(01)     A: débito de la cuenta del usuario y acreditación a la cuenta del Administrador del
                                  esquema de transferencia.
                                  B: débito a la cuenta del Administrador del esquema de transferencia y crédito a la
                                  cuenta del Proveedor No Financiero de Crédito (PNFC).

                                  Identificador del tipo de préstamo.

                                  Valores posibles:
TIPO-COBRO              X(01)
                                  1: Préstamo con desembolso
                                  2: Préstamo sin desembolso"
                                  3: Refinanciación

* COD-BCRA-PSPCP-ORIG   X(05)     Identificador del Proveedor del Cuenta origen

COD-BCRA-PSPCP-DEST     X(05)     Identificador del Proveedor del Cuenta destino

CUOTA-CUOTAS            X(09)     Descripción cuota. Ejemplo: “0001/0012”
FILLER                  X(01)     Uso futuro
                                                                               Referencia
                                    ANEXO
                                                                               Vigente desde           29/06/2026
                                                                               Capítulo                       1
                 ADAPTACION EN LA MENSAJERIA DE DEBIN
                                                                               Página                         18

4. Extract de transacciones
No se realizarán modificaciones sobre el formato de los campos informados en el extract de
transacciones.

Marcamos con color rojo los cambio efectuados en la estructura del resgistro.

POSIC.              NOMBRE DEL
          NIVEL                         CONTENIDO DEL CAMPO                               TIPO PICTURE
RELAT.                CAMPO
066-093     06    PAN                   Número de tarjeta                                 AN    X(28)
   ..       ..    ..                    ..                                                 ..   ..
109-112     04    TYP                   Tipo de mensaje asociado con el registro.
                                        Los valores posibles son:
                                          0210
                                          0220
                                          0420
247-252     04    TRAN-CDE              Código de Transacción
247-248     06    T-CDE                 Código de Operación B24.                          AN    X(02)
                                        Valores posibles:
                                        “F3”: Debito DEBIN
                                        “F4”: Crédito DEBIN
249-250     06    T-FROM                Tipo de Cuenta Desde.                             AN    X(02)
251-252     06    T-TO                  Tipo de Cuenta Hacia                              AN    X(02)
   ..       ..           ..             ..                                                 ..       ..
253-281     04    FROM-ACCT             Número de cuenta Desde                            AN    X(28)
281-281     04    TIPO-TRAN             Ex campo TIPO-DEP.                                AN    X( 01)
                                        Tipo de depósitos / Tipo de transacción.
                                        Los valores posibles son los indicados en
                                        Códigos del Sistema – Códigos de Tipo de
                                        Transacción.
                                        Informar una letra "B" para Cobro con
                                        Transferencia (CXT).

282-309     04    TO-ACCT               Número de cuenta Hacia                            AN    X(28)
   ..       ..    ..                    ..                                                 ..   ..
311-329     04    AMT-1                 Monto de la transacción                            N    9(19)
379-381     04    RESP-CDE              Código de respuesta.
   ..       ..           ..             ..                                                 ..          ..
434-441     06    CUOTA-CUOTAS          Se informará el número de cuota y la               N         X (08)
                                        cantidad de cuotas total. (Opcional)
                                        Ejemplo “00010012”.
                                        4 posiciones para CUOTA y CUOTAS
   ..       ..    ..                    ..                                                 ..       ..
475-478     04    ORIG-CRNCY-CDE        Código de moneda origen.                           N    9(03)
                                        Valores posibles:
                                        ‘032’: Pesos Argentinos.
                                        ‘840’: Dólares Estadounidenses.
   ..       ..            ..            ..                                                 ..          ..
631-877     06    DATOS-                                                                  AN         X(247)
                  TRANSACCIONALES
631-877     06    DEBIN –         Redefines DATOS-TRANSACCIONALES                         AN         X(247)
                  CRÉDITO/DÉBITO  (se usa solo para operaciones de DEBIN)
                                                                                      Referencia
                                            ANEXO
                                                                                      Vigente desde       29/06/2026
                                                                                      Capítulo                   1
                       ADAPTACION EN LA MENSAJERIA DE DEBIN
                                                                                      Página                     19

     POSIC.                  NOMBRE DEL
                NIVEL                           CONTENIDO DEL CAMPO                              TIPO PICTURE
     RELAT.                    CAMPO
     631-662      08     ID                     Identificador de COELSA                          AN      X(32)
     663-665      08     CONCEPTO               Concepto a definir por el BCRA. (“CXT”)          AN      X(03)
     666-669      08     FIID-C                 FIID del comprador                               AN      X(04)
     670-680      08     CUIT.C                 CUIT comprador                                   AN      X(11)
     681-702      08     CBU-C                  CBU del comprador                                AN      X(22)
     703-721      08     NRO-CTA-C              Cta PBF del comprador                            AN      X(19)
     722-725      08     FIID-V                 FIID del vendedor                                AN      X(04)
     726-736      08     CUIT-V                 CUIT vendedor                                    AN      X(11)
     737-758      08     CBU.V                  CBU del vendedor                                 AN      X(22)
     759-777      08     NRO-CTA-V              Cta PBF del vendedor                             AN      X(19)
     778-796      08     PAN                    Número de la tarjeta                             AN      X(19)
     797-836      08     PAGADOR                Nombre y apellido del pagador                    AN      X(40)
     837-837      08     MISMO-TITULAR          Cuenta pertenece al mismo titular.               AN      X(01)
                                                Los valores posibles son:
                                                “S”: Cuenta propia.
                                                “P”: Cuenta propia compartida.
                                                “N”: Cuenta de terceros.
     838-838      08     PREAUTORIZACION        Si el Debin se debita por preautorización        AN      X(01)
                                                (S/N)
     839-839      08     ORIGEN                 Los valores posibles son:                        AN      X(01)
                                                “D” = Debin.
                                                “T” = Transferencia.
                                                “C” = Contracargo
                                                “P” = Debin PULL
                                                “B”: Cobro préstamo con transferencia
     840-842      08     SOCORING               Puntaje del SCORING (0-100)                      AN      X(03)
     843-874      08     ID-COBRO               Identificador del ID-COBRO                       AN      X(32)
     875-877      08     MOTIVO                 Motivo del CONTRA-CARGO                          AN      X(03)

NOTA: Los valores de offset informados toman como base la documentación incluida en la NPC002-001
(Manual del Sistema Base 24), donde en su Capítulo III.4 (Ciclo de Negocios\Extract R6) se especifica que
la posición 1 de offset corresponde al primer byte del campo denominado PREFIX, por consiguiente y para
mayor comprensión, en el siguiente gráfico se detalla el formato del Extract que debe ser tenido en cuenta.
                       TAPE HEADER              FILE HEADER                                    BLOQUES

 000154000072THA1605311700000.... 000076FH ..D1Y
 000908000902DR02123.......................00000000000000000000N
 000908000902DR02123.....................0000000000000000000000N
 000908000902DR02123.....................0000000000000000000000N
 ...............................................................
                          DATA RECORD
 000908000902DR02123.....................0000000000000000000000N
 000908000902DR02123.....................0000000000000000000000N
 000178000086FTTLF     ...........000000001I000086TT...000019

                                     FILE TRAILER                                     TAPE TRAILER

    5.PREFIX
        Historial
             CHARACTERdeDEcambios:
                (6 BYTES)
                           BLOQUE         PREFIX CHARACTER DE REGISTRO
                                                         (8 BYTES)
        No forma parte del OFFSET             Incluye el BYTE 1 del OFFSET
          del diseño de registro         del diseño del registro correspondiente
                                                                                           Referencia
                                              ANEXO
                                                                                           Vigente desde      29/06/2026
                                                                                           Capítulo                 1
                    ADAPTACION EN LA MENSAJERIA DE DEBIN
                                                                                           Página                   20

Se informan las últimas 5 (cinco) modificaciones realizadas sobre el documento.

        Fecha de Modificación:   29/06/2026
    5    Cambios efectuados:     Se incorporo el Token R8 en HTH y se agregaron campos en el extract de TLF
            Modificado por:      Servicios Core Transaccional
        Fecha de Modificación:   16/01/2024
    4    Cambios efectuados:     Se incorporan campos en el token QS y se ajusta el tamaño de 318 a 420
            Modificado por:      Servicios Core Transaccional
        Fecha de Modificación:   14/12/2023
    3    Cambios efectuados:     Se ajusta el tamaño del token QS de 316 a 318
            Modificado por:      Servicios Core Transaccional
        Fecha de Modificación:   25/09/2023
    2    Cambios efectuados:     Se agranda el filler del token QS
            Modificado por:      Servicios Core Transaccional
        Fecha de Modificación:   20/09/2023
    1    Cambios efectuados:     Versión original del documento.
            Modificado por:      Servicios Core Transaccional
