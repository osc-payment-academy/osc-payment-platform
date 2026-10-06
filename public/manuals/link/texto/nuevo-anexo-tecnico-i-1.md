> **CONFIDENCIAL — Red LINK.** Uso interno exclusivo. NO publicar en la sección Documentación Técnica ni compartir con terceros.

# LINK — Nuevo Anexo Técnico I 1

                                                           Referencia
                      ANEXO
                                                           Vigente desde   23/06/2026

   COBRO CON TRANSFERENCIAS (BCRA A-8406)                  Capítulo            1

           MENSAJERIA HTH Y EXTRACT                        Página              1

                              ANEXO
COBRO CON TRANSFERENCIAS (BCRA A-8406)
          MENSAJERIA HTH Y EXTRACT

           Este documento contiene información CONFIDENCIAL
   y tal información no puede ser cedida a terceros por ningún motivo

    Para su divulgación se debe contar con el permiso por escrito del
         dueño de la información que contiene este documento
                                                                                                             Referencia
                                                    ANEXO
                                                                                                             Vigente desde              23/06/2026

                      COBRO CON TRANSFERENCIAS (BCRA A-8406)                                                 Capítulo                             1

                                   MENSAJERIA HTH Y EXTRACT                                                  Página                               2

INDICE
 1.  Objetivo .................................................................................................. 3
 2.  Descripción general............................................................................... 3
 3.  Características generales ..................................................................... 3
 4.  Mensajería Host to Host ........................................................................ 4
   3.1   Transacciones ............................................................................................................ 4
   3.2   Terminal ...................................................................................................................... 4
   3.3   Transacción “09” – Tipo-tran “B” ............................................................................ 4
     Mensaje 0200 ....................................................................................................................... 4
     Mensaje 0210 ....................................................................................................................... 6
     Mensaje 0220 ....................................................................................................................... 7
     Mensaje 0230 ....................................................................................................................... 9
     Mensaje 0420 ..................................................................................................................... 10
     Mensaje 0430 ..................................................................................................................... 12
     Redefinición del campo 55 - PRI-RSRVD1-ISO .............................................................. 13
     Tokens ................................................................................................................................ 14
   3.4   Transacción “29” Tipo-tran “B” ............................................................................. 18
     Mensaje 0220 ..................................................................................................................... 18
     Mensaje 0230 ..................................................................................................................... 20
     Mensaje 0420 ..................................................................................................................... 21
     Mensaje 0430 ..................................................................................................................... 22
     Redefinición del campo 55 - PRI-RSRVD1-ISO .............................................................. 23
     Tokens ................................................................................................................................ 24
 5.       Extract................................................................................................... 28
 5.1      Extract de transacciones .................................................................... 28
 5.2      Extract de transferencias .................................................................... 28
 6.       Observaciones ..................................................................................... 33
                                                                                  Referencia
                                          ANEXO
                                                                                  Vigente desde     23/06/2026

                      COBRO CON TRANSFERENCIAS (BCRA A-8406)                      Capítulo               1

                               MENSAJERIA HTH Y EXTRACT                           Página                 3

     1. Objetivo
Describir las adecuaciones que realizará link en la mensajería Host to Host y archivos Extracts, en virtud
de lo establecido en la comunicación A- 8406 del Banco Central de la República Argentina.

     2. Descripción general

En referencia a la Circular Comercial “Cobro con Transferencias (Normativa BCRA A8406)”, y conforme a
las definiciones allí establecidas para la operatoria de Cobro con Transferencia (CCT), se detallan a
continuación las adecuaciones que serán incorporadas en Base24.

Estas adecuaciones se encuentran orientadas a soportar el nuevo instrumento de cobro interoperable
definido por la normativa, destinado inicialmente al cobro recurrente de cuotas de préstamos mediante
Transferencias Inmediatas (CBU/CVU), e impactarán tanto en la mensajería Host to Host (HTH) como
en los archivos de extracts.

En línea con lo establecido en la normativa, link implementará la solución de cobro de préstamos con
transferencias utilizando el instrumento de Transferencias Inmediatas, dentro del esquema de pago
administrado por link.

A los fines de su identificación, BCRA estableció que la operatoria definida como Cobro con
Transferencia (CCT) será referida mediante el motivo “CXT”, el cual será utilizado en la mensajería y
archivos.

     3. Características generales
A efectos de permitir la correcta identificación de la nueva operatoria, se utilizarán los siguientes tipos de
transferencia:

     •   Tipo-Tran “B”: corresponde a un nuevo tipo de transferencia y será utilizado para identificar
         las operaciones de Cobro con Transferencia.

     •   Tipo-Tran “I”: corresponde a un tipo de transferencia existente, el cual será reutilizado para la
         distribución y liquidación de las tasas de intercambio entre las partes intervinientes.

         En el contexto de la operatoria de Cobro con Transferencia, estas transacciones podrán ser
         diferenciadas del resto mediante la utilización del motivo “CXT” y el ID de canal
         “CXT_INTERCHANGE”. No obstante, este tipo de transacción mantendrá su estructura, y
         formatos actuales en la mensajería y en los archivos extracts.

Las nuevas operaciones mantendrán la estructura estándar de transferencias en la mensajería Host to
Host, incorporando adicionalmente los siguientes tokens:
         • Token “QY”: Contendrá los datos de las cuentas participantes de la operación,
            permitiendo identificar tanto la cuenta debitada como el resto de las cuentas intervinientes.

         •   Token “R8”:Incluirá información específica de la operatoria de Cobro con Transferencia.
                                                                                      Referencia
                                          ANEXO
                                                                                      Vigente desde         23/06/2026

                    COBRO CON TRANSFERENCIAS (BCRA A-8406)                            Capítulo                    1

                            MENSAJERIA HTH Y EXTRACT                                  Página                      4

En el extract de transferencias, en su versión “ORIG/DEST”, se incorporarán nuevas redefiniciones que
permitirán informar de manera diferenciada los datos correspondientes a las operaciones identificadas
como tipo-tran “B”.

    4. Mensajería Host to Host
    3.1 Transacciones

     Transacción       Tipo de transacción        Descripción
         09                      B                Débito de transferencia - CXT
         29                      B                Crédito de transferencia - CXT
         09                       I               Débito por Distribución de tasa de intercambio
         29                       I               Crédito por Distribución de tasa de intercambio

    3.2 Terminal

    Tipo de terminal    Descripción
    A9                  Débitos y Créditos cursados por el Administrador del esquema de transferencias
                        inmediatas link.
    00                  Créditos informados por el Administrador del esquema de transferencias
                        inmediatas NewPay

    3.3 Transacción “09” – Tipo-tran “B”

    Mensaje 0200

      Bit          Campo          Tipo                 Descripción                               Detalles
    P-001   SECONDARY BITMAP      X(16)    Bitmap secundario                          Aquí se informarán como
                                                                                      presentes en el mensaje los
                                                                                      campos que figuran a
                                                                                      continuación.
    P-003   PROCESSING CODE       X(6)     Se informa en las siguientes               Se completa con “09XX00”
                                           posiciones:                                Donde XX corresponde al tipo
                                           1-2: código de transacción.                de cuenta.
                                           3-4: tipo de cuenta que recibe el débito.
                                           5-6: tipo de cuenta que recibe el
                                           crédito.
    P-004   TRAN-AMT              9(12)    Monto de la operación                     Sin cambios respecto a la solución
                                           Formato: 10 enteros + 2 decimales         actual.

    P-007   TRANSMISSION DATE     9(10)    Fecha y hora de transmisión del mensaje    Sin cambios respecto a la solución
            AND TIME                                                                  actual
    P-011   SYSTEMS TRACE         9(6)     Número de mensaje usado para               Sin cambios respecto a la solución
            AUDIT NUMBER                   establecer la correspondencia de una       actual
                                           respuesta y su original
    P-012   LOCAL TRANSACTION     9(6)     Hora local en que comenzó la transacción   Sin cambios respecto a la solución
            TIME                                                                      actual
    P-013   LOCAL TRANSACTION     9(4)     Fecha calendario en que comenzó la         Sin cambios respecto a la solución
            DATE                           transacción                                actual
    P-015   SETL-DAT              9(4)     Fecha de negocio a que corresponde la      Sin cambios respecto a la solución
                                           transacción. Formato mmdd.                 actual
    P-017   CAPTURE DATE          9(4)     Fecha de negocio en que la transacción     Sin cambios respecto a la solución
                                           fue procesada                              actual
                                                                                       Referencia
                                        ANEXO
                                                                                       Vigente desde          23/06/2026

                 COBRO CON TRANSFERENCIAS (BCRA A-8406)                                Capítulo                     1

                           MENSAJERIA HTH Y EXTRACT                                    Página                       5

 Bit          Campo            Tipo                   Descripción                                  Detalles
P-032   ACQUIRING              9(11)     Número de Identificación de la institución    Sin cambios respecto a la solución
        INSTITUTION                      a la que pertenece la terminal                actual
        IDENTIFICATION CODE
P-035   TRACK 2 DATA           X(37)     Track 2 de la tarjeta                         Número de tarjeta

                                                                                       Valores posibles:
                                                                                       Tarjeta del usuario.
                                                                                       Tarjeta virtual genérica:
                                                                                       9999+FIID+000000000 (9999:
                                                                                       Valor fijo, FIID: Identificador de
                                                                                       la entidad originante,
                                                                                       000000000: Valor Fijo)
P-037   RETRIEVAL              X(12)     Número asignado por el originador del         Sin cambios respecto a la solución
        REFERENCE NUMBER                 mensaje para identificar una transacción.     actual
P-038   AUTH-ID-RESP            X(6)     Código de identificación de respuesta         Identificador de la operación ,
                                         de transacción.                               generado por el Administrador
                                                                                       del esquema.
P-041   CARD ACCEPTOR          X(16)     Identificador de la terminal que acepta       Valores posibles:
        TERMINAL                         la transacción.                               ADMLINKCXT : cobro iniciado
        IDENTIFICATION                                                                 con Administrador link
                                                                                       ADMPRISMACXT: cobro
                                                                                       iniciado con administrador
                                                                                       NewPay
P-043   CARD ACCEPTOR          X(40)     El formato es:                                Sin cambios respecto a la solución
        NAME                             1-22: Nombre del administrador del            actual
                                         Cajero.
                                         23-35: Ciudad del Cajero.
                                         36-38: Estado del Cajero.
                                         39-40: País del Cajero.
P-049   TRANSACTION             9(3)     Código ISO de la moneda                       Sin cambios respecto a la
        CURRENCY CODE                    032 = Pesos                                   solución actual
P-054   ADD-AMTS               X(023)    El formato es:                                Sin cambios respecto a la solución
                                         1-3: Longitud del campo                       actual
                                         4-23: Se informan blancos.
P-055   PRI-RSRVD1-ISO         X(120)    El formato es:                                Se informan datos asociados a
                                         1-3: Longitud del campo                       la operatoria de Transferencias
                                         4-120: Ver debajo detalle de campo 55
P-060   TERMINAL DATA          X(15)     El formato es:
                                         1-3: Longitud del campo.
                                         4-7: Siglas institución dueña de la
                                         terminal.
                                         8-11: Red lógica de la terminal.
                                         12-15: Diferencia horaria entre hora local
                                         de transacción y hora del sistema.
P-061   CARD ISSUER            X(16)     El formato es:                                Sin cambios respecto a la solución
        AUTHORIZER DATA                  1-3: Longitud del campo.                      actual
                                         4-7: Sigla de la institución emisora de la
                                         tarjeta.
P-062   PRI-RSRVD3-PRVT        X(25)     Se informa el tipo de terminal                Se informará “A9”
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
        PRVT                             tokens “PE”, “Q7”, “QU”,“QY” y “R8”           la operatoria de
                                                                                       TRANSFERENCIAS
                                                                                     Referencia
                                      ANEXO
                                                                                     Vigente desde         23/06/2026

                COBRO CON TRANSFERENCIAS (BCRA A-8406)                               Capítulo                    1

                          MENSAJERIA HTH Y EXTRACT                                   Página                      6

 Bit          Campo           Tipo                  Descripción                                 Detalles
S-127   SECNDRY-RSRVD8-       X(43)    El formato es:                                Sin cambios respecto a la solución
        PRVT                           Posiciones 01-03 = Indicador de longitud.     actual
                                       El valor a informar es `043`.
                                       Posiciones 04-46 = Si es cruzada se
                                       informa el tipo de cambio. De lo contrario,
                                       se informarán ceros.

Mensaje 0210

 Bit          Campo           Tipo                  Descripción                                 Detalles
P-001   SECONDARY BITMAP      X(16)    Bitmap secundario                             Aquí se informarán como
                                                                                     presentes en el mensaje los
                                                                                     campos que figuran a
                                                                                     continuación.
P-003   PROCESSING CODE        X(6)    Se informa en las siguientes                  Se completa con “09XX00”
                                       posiciones:                                   Donde XX corresponde al tipo
                                       1-2: código de transacción.                   de cuenta.
                                       3-4: tipo de cuenta que recibe el débito.
                                       5-6: tipo de cuenta que recibe el
                                       crédito.
P-004   TRAN-AMT              9(12)    Monto de la operación                     Sin cambios respecto a la solución
                                       Formato: 10 enteros + 2 decimales         actual.

P-007   TRANSMISSION DATE     9(10)    Fecha y hora de transmisión del mensaje       Sin cambios respecto a la solución
        AND TIME                                                                     actual
P-011   SYSTEMS TRACE          9(6)    Número de mensaje usado para                  Sin cambios respecto a la solución
        AUDIT NUMBER                   establecer la correspondencia de una          actual
                                       respuesta y su original
P-012   LOCAL TRANSACTION      9(6)    Hora local en que comenzó la transacción      Sin cambios respecto a la solución
        TIME                                                                         actual
P-013   LOCAL TRANSACTION      9(4)    Fecha calendario en que comenzó la            Sin cambios respecto a la solución
        DATE                           transacción                                   actual
P-015   SETL-DAT               9(4)    Fecha de negocio a que corresponde la         Sin cambios respecto a la solución
                                       transacción. Formato mmdd.                    actual
P-017   CAPTURE DATE           9(4)    Fecha de negocio en que la transacción        Sin cambios respecto a la solución
                                       fue procesada                                 actual
P-032   ACQUIRING             9(11)    Número de Identificación de la institución    Sin cambios respecto a la solución
        INSTITUTION                    a la que pertenece la terminal                actual
        IDENTIFICATION CODE
P-035   TRACK 2 DATA          X(37)    Track 2 de la tarjeta                         Sin cambios respecto a la solución
                                                                                     actual
P-037   RETRIEVAL             X(12)    Número asignado por el originador del         Sin cambios respecto a la solución
        REFERENCE NUMBER               mensaje para identificar una transacción.     actual
P-038   AUTH-ID-RESP           X(6)    Código de identificación de respuesta         Identificador de la operación ,
                                       de transacción.                               generado por el Administrador
                                                                                     del esquema.
P-039   RESPONSE CODE          9(2)    00 = Aprobada.                                Sin cambios respecto a la
                                                                                     solución actual
P-041   CARD ACCEPTOR         X(16)    Identificador de la terminal que acepta       Valores posibles:
        TERMINAL                       la transacción.                               ADMLINKCXT : cobro iniciado
        IDENTIFICATION                                                               con Administrador link
                                                                                     ADMPRISMACXT: cobro
                                                                                     iniciado con administrador
                                                                                     NewPay
P-043   CARD ACCEPTOR         X(40)    El formato es:                                Sin cambios respecto a la solución
        NAME                           1-22: Nombre del administrador del            actual
                                       Cajero.
                                       23-35: Ciudad del Cajero.
                                       36-38: Estado del Cajero.
                                       39-40: País del Cajero.
P-049   TRANSACTION            9(3)    Código ISO de la moneda                       Sin cambios respecto a la solución
        CURRENCY CODE                  032 = Pesos                                   actual
                                                                                       Referencia
                                        ANEXO
                                                                                       Vigente desde          23/06/2026

                 COBRO CON TRANSFERENCIAS (BCRA A-8406)                                Capítulo                     1

                           MENSAJERIA HTH Y EXTRACT                                    Página                       7

 Bit          Campo            Tipo                   Descripción                                  Detalles
P-054   ADD-AMTS               X(023)    El formato es:                                Sin cambios respecto a la solución
                                         1-3: Longitud del campo                       actual
                                         4-23: Se informan blancos.
P-055   PRI-RSRVD1-ISO         X(120)    El formato es:                                Se informan datos asociados a
                                         1-3: Longitud del campo                       la operatoria de Transferencias
                                         4-120: Ver debajo detalle de campo 55
P-060   TERMINAL DATA          X(15)     El formato es:                                Sin cambios respecto a la solución
                                         1-3: Longitud del campo.                      actual
                                         4-7: Siglas institución dueña de la
                                         terminal.
                                         8-11: Red lógica de la terminal.
                                         12-15: Diferencia horaria entre hora local
                                         de transacción y hora del sistema.
P-061   CARD ISSUER            X(16)     El formato es:                                Sin cambios respecto a la solución
        AUTHORIZER DATA                  1-3: Longitud del campo.                      actual
                                         4-7: Sigla de la institución emisora de la
                                         tarjeta.
P-062   PRI-RSRVD3-PRVT        X(25)     Se informa el tipo de terminal                Se informará “A9”
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
S-127   SECNDRY-RSRVD8-        X(43)     El formato es:                                Sin cambios respecto a la solución
        PRVT                             Posiciones 01-03 = Indicador de longitud.     actual
                                         El valor a informar es `043`.
                                         Posiciones 04-46 = Si es cruzada se
                                         informa el tipo de cambio. De lo contrario,
                                         se informarán ceros.

Mensaje 0220

 Bit          Campo            Tipo                   Descripción                                  Detalles
P-001   SECONDARY BITMAP       X(16)     Bitmap secundario                             Aquí se informarán como
                                                                                       presentes en el mensaje los
                                                                                       campos que figuran a
                                                                                       continuación.
P-003   PROCESSING CODE         X(6)     Se informa en las siguientes                  Se completa con “09XX00”
                                         posiciones:                                   Donde XX corresponde al tipo
                                         1-2: código de transacción.                   de cuenta.
                                         3-4: tipo de cuenta que recibe el débito.
                                         5-6: tipo de cuenta que recibe el
                                         crédito.
P-004   TRAN-AMT               9(12)     Monto de la operación                     Sin cambios respecto a la solución
                                         Formato: 10 enteros + 2 decimales         actual.

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
                                                                                     Referencia
                                       ANEXO
                                                                                     Vigente desde         23/06/2026

                COBRO CON TRANSFERENCIAS (BCRA A-8406)                               Capítulo                    1

                          MENSAJERIA HTH Y EXTRACT                                   Página                      8

 Bit          Campo           Tipo                   Descripción                                Detalles
P-017   CAPTURE DATE           9(4)     Fecha de negocio en que la transacción       Sin cambios respecto a la solución
                                        fue procesada                                actual
P-032   ACQUIRING             9(11)     Número de Identificación de la institución   Sin cambios respecto a la solución
        INSTITUTION                     a la que pertenece la terminal               actual
        IDENTIFICATION CODE
P-035   TRACK 2 DATA          X(37)     Track 2 de la tarjeta                        Sin cambios respecto a la solución
                                                                                     actual
P-035   TRACK 2 DATA          X(37)     Track 2 de la tarjeta                        Número de tarjeta

                                                                                     Valores posibles:
                                                                                     Tarjeta del usuario.
                                                                                     Tarjeta virtual genérica:
                                                                                     9999+FIID+000000000 (9999:
                                                                                     Valor fijo, FIID: Identificador de
                                                                                     la entidad originante,
                                                                                     000000000: Valor Fijo)
P-037   RETRIEVAL             X(12)     Número asignado por el originador del        Sin cambios respecto a la solución
        REFERENCE NUMBER                mensaje para identificar una transacción.    actual
P-038   AUTH-ID-RESP           X(6)     Código de identificación de respuesta        Identificador de la operación ,
                                        de transacción.                              generado por el Administrador
                                                                                     del esquema.
P-039   RESPONSE CODE          9(2)     00 = Aprobada.                               Sin cambios respecto a la solución
                                                                                     actual
P-041   CARD ACCEPTOR         X(16)     Identificador de la terminal que acepta      Valores posibles:
        TERMINAL                        la transacción.                              ADMLINKCXT : cobro iniciado
        IDENTIFICATION                                                               con Administrador link
                                                                                     ADMPRISMACXT: cobro
                                                                                     iniciado con administrador
                                                                                     NewPay
P-043   CARD ACCEPTOR         X(40)     El formato es:                               Sin cambios respecto a la solución
        NAME                            1-22: Nombre del administrador del           actual
                                        Cajero.
                                        23-35: Ciudad del Cajero.
                                        36-38: Estado del Cajero.
                                        39-40: País del Cajero.
P-049   TRANSACTION            9(3)     Código ISO de la moneda                      Sin cambios respecto a la solución
        CURRENCY CODE                   032 = Pesos                                  actual
P-054   ADD-AMTS              X(023)    El formato es:                               Sin cambios respecto a la solución
                                        1-3: Longitud del campo                      actual
                                        4-23: Se informan blancos.
P-055   PRI-RSRVD1-ISO        X(120)    El formato es:                               Se informan datos asociados a
                                        1-3: Longitud del campo                      la operatoria de Transferencias
                                        4-120: Ver debajo detalle de campo 55
P-060   TERMINAL DATA         X(15)     El formato es:                               Sin cambios respecto a la solución
                                        1-3: Longitud del campo.                     actual
                                        4-7: Siglas institución dueña de la
                                        terminal.
                                        8-11: Red lógica de la terminal.
                                        12-15: Diferencia horaria entre hora local
                                        de transacción y hora del sistema.
P-061   CARD ISSUER           X(16)     El formato es:                               Sin cambios respecto a la solución
        AUTHORIZER DATA                 1-3: Longitud del campo.                     actual
                                        4-7: Sigla de la institución emisora de la
                                        tarjeta.
P-062   PRI-RSRVD3-PRVT       X(25)     Se informa el tipo de terminal               Se informará “A9”
                                                                                       Referencia
                                        ANEXO
                                                                                       Vigente desde          23/06/2026

                   COBRO CON TRANSFERENCIAS (BCRA A-8406)                              Capítulo                     1

                           MENSAJERIA HTH Y EXTRACT                                    Página                       9

 Bit          Campo            Tipo                   Descripción                                  Detalles
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
        PRVT                             tokens “PE”, “Q7”, “QU”,“QY” y “R8”           la operatoria de
                                                                                       TRANSFERENCIAS
S-127   SECNDRY-RSRVD8-        X(43)     El formato es:                                Sin cambios respecto a la solución
        PRVT                             Posiciones 01-03 = Indicador de longitud.     actual
                                         El valor a informar es `043`.
                                         Posiciones 04-46 = Si es cruzada se
                                         informa el tipo de cambio. De lo contrario,
                                         se informarán ceros.

Mensaje 0230

 Bit          Campo            Tipo                   Descripción                                  Detalles
P-001   SECONDARY BITMAP       X(16)     Bitmap secundario                             Aquí se informarán como
                                                                                       presentes en el mensaje los
                                                                                       campos que figuran a
                                                                                       continuación.
P-003   PROCESSING CODE         X(6)     Se informa en las siguientes                  Se completa con “09XX00”
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
                                                                                      Referencia
                                       ANEXO
                                                                                      Vigente desde          23/06/2026

                 COBRO CON TRANSFERENCIAS (BCRA A-8406)                               Capítulo                     1

                           MENSAJERIA HTH Y EXTRACT                                   Página                      10

 Bit          Campo            Tipo                  Descripción                                  Detalles
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
P-039   RESPONSE CODE           9(2)    00 = Aprobada.                                Sin cambios respecto a la solución
                                                                                      actual
P-041   CARD ACCEPTOR          X(16)    Identificador de la terminal que acepta       Valores posibles:
        TERMINAL                        la transacción.                               ADMLINKCXT : cobro iniciado
        IDENTIFICATION                                                                con Administrador link
                                                                                      ADMPRISMACXT: cobro
                                                                                      iniciado con administrador
                                                                                      NewPay
P-043   CARD ACCEPTOR          X(40)    El formato es:                                Sin cambios respecto a la solución
        NAME                            1-22: Nombre del administrador del            actual
                                        Cajero.
                                        23-35: Ciudad del Cajero.
                                        36-38: Estado del Cajero.
                                        39-40: País del Cajero.
P-049   TRANSACTION             9(3)    Código ISO de la moneda                       Sin cambios respecto a la solución
        CURRENCY CODE                   032 = Pesos                                   actual
S-102   ACCOUNT                X(28)    Identificación de la cuenta Origen            Sin cambios respecto a la solución
        IDENTIFICATION 1                1-3: Longitud del campo.                      actual
                                        4-28: Número de cuenta.
S-103   ACCOUNT                X(28)    Identificación de la cuenta de acreditación   Identificación de la cuenta en
        IDENTIFICATION 2                1-3: Longitud del campo.                      formato “PBF”.
                                        4-28: Número de cuenta.

Mensaje 0420

 Bit          Campo            Tipo                  Descripción                                  Detalles
P-001   SECONDARY BITMAP       X(16)    Bitmap secundario                             Aquí se informarán como
                                                                                      presentes en el mensaje los
                                                                                      campos que figuran a
                                                                                      continuación.
P-002   PAN                    X(19)    Primary Account Number                        Número de tarjeta
P-003   PROCESSING CODE        X(6)     Se informa en las siguientes                  Se completa con “09XX00”
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
                                                                                      Referencia
                                       ANEXO
                                                                                      Vigente desde         23/06/2026

                COBRO CON TRANSFERENCIAS (BCRA A-8406)                                Capítulo                    1

                          MENSAJERIA HTH Y EXTRACT                                    Página                     11

 Bit          Campo           Tipo                   Descripción                                 Detalles
P-017   CAPTURE DATE           9(4)     Fecha de negocio en que la transacción        Sin cambios respecto a la solución
                                        fue procesada                                 actual
P-022   ENTRY-MODE             9(3)     Modo en que la operación ingresó a la         Sin cambios respecto a la solución
                                        terminal                                      actual
P-032   ACQUIRING             9(11)     Número de Identificación de la institución    Sin cambios respecto a la solución
        INSTITUTION                     a la que pertenece la terminal                actual
        IDENTIFICATION CODE
P-035   TRACK 2 DATA          X(37)     Track 2 de la tarjeta                         Sin cambios respecto a la solución
                                                                                      actual
P-035   TRACK 2 DATA          X(37)     Track 2 de la tarjeta                         Número de tarjeta

                                                                                      Valores posibles:
                                                                                      Tarjeta del usuario.
                                                                                      Tarjeta virtual genérica:
                                                                                      9999+FIID+000000000 (9999:
                                                                                      Valor fijo, FIID: Identificador de
                                                                                      la entidad originante,
                                                                                      000000000: Valor Fijo)
P-037   RETRIEVAL             X(12)     Número asignado por el originador del         Sin cambios respecto a la solución
        REFERENCE NUMBER                mensaje para identificar una transacción.     actual
P-038   AUTH-ID-RESP           X(6)     Código de identificación de respuesta         Identificador de la operación ,
                                        de transacción.                               generado por el Administrador
                                                                                      del esquema.
P-039   RESPONSE CODE          9(2)     Código de respuesta:                          Sin cambios respecto a la solución
                                        00 = Aprobada.                                actual
P-041   CARD ACCEPTOR         X(16)     Identificador de la terminal que acepta       Valores posibles:
        TERMINAL                        la transacción.                               ADMLINKCXT : cobro iniciado
        IDENTIFICATION                                                                con Administrador link
                                                                                      ADMPRISMACXT: cobro
                                                                                      iniciado con administrador
                                                                                      NewPay
P-043   CARD ACCEPTOR         X(40)     El formato es:                                Sin cambios respecto a la solución
        NAME                            1-22: Nombre del administrador del            actual
                                        Cajero.
                                        23-35: Ciudad del Cajero.
                                        36-38: Estado del Cajero.
                                        39-40: País del Cajero.
P-049   TRANSACTION            9(3)     Código ISO de la moneda                       Sin cambios respecto a la solución
        CURRENCY CODE                   032 = Pesos                                   actual
                                        840 = Dólares
P-052   PERSONAL              X(16)     Clave de identificación personal (PIN) del    Se enviarán 16 “F”.
        IDENTIFICATION                  tarjetahabiente, encriptado por la clave de   Es opcional se configura por
        NUMBER DATA                     comunicación.                                 entidad
P-054   ADD-AMTS              X(023)    El formato es:                                Sin cambios respecto a la solución
                                        1-3: Longitud del campo                       actual
                                        4-23: Se informan blancos.
P-055   PRI-RSRVD1-ISO        X(120)    El formato es:                                Se informan datos asociados a
                                        1-3: Longitud del campo                       la operatoria de Transferencias
                                        4-120: Ver debajo detalle de campo 55
P-060   TERMINAL DATA         X(15)     El formato es:                                Sin cambios respecto a la solución
                                        1-3: Longitud del campo.                      actual
                                        4-7: Siglas institución dueña de la
                                        terminal.
                                        8-11: Red lógica de la terminal.
                                        12-15: Diferencia horaria entre hora local
                                        de transacción y hora del sistema.
P-061   CARD ISSUER           X(16)     El formato es:                                Sin cambios respecto a la solución
        AUTHORIZER DATA                 1-3: Longitud del campo.                      actual
                                        4-7: Sigla de la institución emisora de la
                                        tarjeta.
P-062   PRI-RSRVD3-PRVT       X(25)     Se informa el tipo de terminal                Se informará “A9”
                                                                                       Referencia
                                        ANEXO
                                                                                       Vigente desde          23/06/2026

                 COBRO CON TRANSFERENCIAS (BCRA A-8406)                                Capítulo                     1

                           MENSAJERIA HTH Y EXTRACT                                    Página                      12

 Bit          Campo            Tipo                   Descripción                                  Detalles
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
        PRVT                             tokens “PE”, “Q7” , “QU”, “QY” y “R8”         la operatoria de
                                                                                       TRANSFERENCIAS
S-127   SECNDRY-RSRVD8-        X(43)     El formato es:                                Sin cambios respecto a la solución
        PRVT                             Posiciones 01-03 = Indicador de longitud.     actual
                                         El valor a informar es `043`.
                                         Posiciones 04-46 = Si es cruzada se
                                         informa el tipo de cambio. De lo contrario,
                                         se informarán ceros.

Mensaje 0430

 Bit          Campo            Tipo                   Descripción                                  Detalles
P-001   SECONDARY BITMAP       X(16)     Bitmap secundario                             Aquí se informarán como
                                                                                       presentes en el mensaje los
                                                                                       campos que figuran a
                                                                                       continuación.
P-002   PAN                    X(19)     Primary Account Number                        Número de tarjeta
P-003   PROCESSING CODE        X(6)      Se informa en las siguientes                  Se completa con “09XX00”
                                         posiciones:                                   Donde XX corresponde al tipo
                                         1-2: código de transacción.                   de cuenta.
                                         3-4: tipo de cuenta que recibe el débito.
                                         5-6: tipo de cuenta que recibe el
                                         crédito.
P-004   TRAN-AMT               9(12)     Monto de la operación                     Sin cambios respecto a la solución
                                         Formato: 10 enteros + 2 decimales         actual.

P-007   TRANSMISSION DATE      9(10)     Fecha y hora de transmisión del mensaje       Sin cambios respecto a la solución
        AND TIME                                                                       actual
P-011   SYSTEMS TRACE           9(6)     Número de mensaje usado para                  Sin cambios respecto a la solución
        AUDIT NUMBER                     establecer la correspondencia de una          actual
                                         respuesta y su original
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
                                                                                     Vigente desde         23/06/2026

                   COBRO CON TRANSFERENCIAS (BCRA A-8406)                            Capítulo                      1

                           MENSAJERIA HTH Y EXTRACT                                  Página                       13

  Bit           Campo          Tipo                  Descripción                                Detalles
P-041    CARD ACCEPTOR         X(16)    Identificador de la terminal que acepta      Valores posibles:
         TERMINAL                       la transacción.                              ADMLINKCXT : cobro iniciado
         IDENTIFICATION                                                              con Administrador link
                                                                                     ADMPRISMACXT: cobro
                                                                                     iniciado con administrador
                                                                                     NewPay
P-043    CARD ACCEPTOR         X(40)    1-22: Nombre del administrador del           Sin cambios respecto a la solución
         NAME                           Cajero.                                      actual
                                        23-35: Ciudad del Cajero.
                                        36-38: Estado del Cajero.
                                        39-40: País del Cajero.
P-049    TRANSACTION            9(3)    Código ISO de la moneda                      Sin cambios respecto a la solución
         CURRENCY CODE                  032 = Pesos                                  actual
                                        840 = Dólares
P-060    TERMINAL DATA         X(15)    1-3: Longitud del campo.                     Sin cambios respecto a la solución
                                        4-7: Siglas institución dueña de la          actual
                                        terminal.
                                        8-11: Red lógica de la terminal.
                                        12-15: Diferencia horaria entre hora local
                                        de transacción y hora del sistema.
P-061    CARD ISSUER           X(16)    1-3: Longitud del campo.                     Sin cambios respecto a la solución
         AUTHORIZER DATA                4-7: Sigla de la institución emisora de la   actual
                                        tarjeta.
S-090    ORIG-INFO             X(42)    1-4: ORIG-TYP: Tipo de mensaje original      Sin cambios respecto a la solución
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

Redefinición del campo 55 - PRI-RSRVD1-ISO

Nombre del campo                  Descripción                                                              Atributo
LONGITUD                          Longitud del campo 55. El valor a informar es “120”.                     9(3)
TRANSFERENCIA
    TRACK2                       Contiene datos del Track 2 de la tarjeta alineado a izquierda y           X(40)
                                 rellenos con blancos.

                                 Valores posibles:
                                 Tarjeta del usuario
                                 Tarjeta virtual genérica: 9999+FIID+000000000 (9999: Valor fijo,
                                 FIID: Identificador de la entidad originante, 000000000: Valor Fijo)
    CA                                                                                                     X(2)
    MARCA-TIT                    Redefinición del campo CA.
             MISMO-TITULAR       Se indica la condición de titularidad del                                 X(1)
                                 ordenante de la transferencia frente a la cuenta
                                 destino.
                                 Los valores que pueden informarse en este campo
                                 son:
                                 “S”: Cuenta propia.
                                 “C”: Cuenta propia compartida.
                                 “N”: Cuenta de terceros.
                                                                                             Referencia
                                             ANEXO
                                                                                             Vigente desde         23/06/2026

                      COBRO CON TRANSFERENCIAS (BCRA A-8406)                                 Capítulo                      1

                                MENSAJERIA HTH Y EXTRACT                                     Página                       14

               FILLER                    Se informan BLANCOS                                                       X(1)
    FR-ACCT                              Número de cuenta de origen
               FIID                      Institución Emisora de la cuenta origen                                   X(4)
               TYP                       Tipo de cuenta origen                                                     X(2)
               ACCT-NUM                  Número de cuenta origen                                                   X(19)
    TO-ACCT                              Número de cuenta destino
               FIID                      Institución Emisora de la cuenta destino                                  X(4)
               TYP                       Tipo de cuenta destino                                                    X(2)
               ACCT-NUM                  Número de cuenta destino                                                  X(19)
               FIID-DESC                 Institución a la cual pertenece la cuenta destino                         X(13)
    FR-ACCT-TYP                          Se informa Blanco                                                         X(1)
    TO-ACCT-TYP                          Se informa Blanco                                                         X(1)
    TIPO-TRAN                            Se informará “B”                                                          X(1)
    MOTIVO                               Se informará “CXT”                                                        X(3)
    FILLER                               Se deberá informar BLANCOS                                                X(9)

Tokens

Token “PE”

Token Header

Campo                   Formato     Valor       Descripción
EYE CATCHER              X(2)       “! ”        Identificador literal.
TKN-ID                   X(2)       “PE”        Nombre o Identificador único de la estructura de datos.
                                                Indica el largo total de los datos informado en el campo (alineado con ceros a
TKN-LGTH                 9(5)       “00156”
                                                izquierda).
USER-FLD                 X(1)       “”          Blanco.
 Token Data

Campo                   Formato     Descripción

 MOTIVO                  X(3)       Se informará “CXT”
REFERENCIA               X(12)      Referencia
                                    Tipo de cuenta de destino.
                                    Valores posibles:
TIPO-CTA-DEST            X(02)
                                    01 = Cuenta corriente en pesos.
                                    11 = Caja de ahorro en pesos.

CDI-ORIG                 X(11)      CDI, DNI o CUIL del titular de la cuenta origen de la transferencia (CBU de origen).

CDI-DEST                 X(11)      CDI, DNI o CUIL del titular de la cuenta destino de la transferencia (CBU de destino).
                                   Se indica la condición de titularidad del ordenante de la transferencia frente a la cuenta
                                   destino.

MISMO-TITULAR            X(01)     Valores posibles:
                                   “S”: Cuenta propia.
                                   “C”: Cuenta propia compartida.
                                   “N”: Cuenta de terceros.
                                                                                            Referencia
                                            ANEXO
                                                                                            Vigente desde          23/06/2026

                     COBRO CON TRANSFERENCIAS (BCRA A-8406)                                 Capítulo                      1

                               MENSAJERIA HTH Y EXTRACT                                     Página                       15

  NOMBRE                 X(22)      Nombre del titular de la cuenta destino de la transferencia. (CBU de destino).
                                   Track 2 de tarjeta de débito del usuario.

                                   Valores posibles:
  TRACK2                 X(40)     Tarjeta del usuario.
                                   Tarjeta virtual genérica: 9999+FIID+000000000 (9999: Valor fijo, FIID: Identificador de la
                                   entidad originante, 000000000: Valor Fijo)

  FR-ACCT.FIID           X(04)      FIID banco emisor.
  FR-ACCT.TYP            X(02)      Tipo de cuenta de origen.

  FR-ACCT.ACCT-NUM       X(19)      Número de cuenta de origen.

  TO-ACCT.FIID           X(04)      FIID banco receptor de los fondos.
  TO-ACCT.FIID-CPF       X(04)      FIID del banco receptor para Base24. (idem a TO-ACCT. FIID)
  TO-ACCT.TYP            X(02)      Tipo de cuenta de destino.

  TO-ACCT.ACCT-NUM       X(19)      Número de cuenta de destino.

  Token “Q7”

Token Header
Campo                 Formato    Valor        Descripción

EYE CATCHER            X(2)       “! ”        Identificador literal.
TKN-ID                 X(2)       “Q7”        Nombre o Identificador único de la estructura de datos.
TKN-LGTH               9(5)       “00240”     Indica el largo total de los datos informado en el campo (alineado con ceros

USER-FLD               X(1)       “”          a izquierda).
                                              Blanco.
 Token Data
 Campo                Formato     Descripción
NÚMERO DE CBU          9(22)      Número de CBU dela cuenta de destino .
TIPO-PERSONA           X(1)       Tipo de Persona Titular.

                                   Valores posibles:
                                  “F”: Persona física.
                                  “J”: Persona jurídica.

                                  Se informará blanco.
TITULAR-1-CDI          9(11)      CUIL-CDI/CUIT del 1er. titular de la cuenta de destino (CBU destino)

TITULAR-1-NOMBRE       X(40)      El/los apellido/s y el/los nombre/s del primer titular de la cuenta de destino. (CBU destino)

TITULAR-2-CDI          9(11)      Se informan blancos.
TITULAR-2-NOMBRE       X(40)      Se informan blancos.
TITULAR-3-CDI          9(11)      Se informan blancos.
TITULAR-3-NOMBRE       X(40)      Se informan blancos.
NUM-CTA-BCRIA          X(19)      El número de cuenta asociado a la cbu destino

                                  Se informarán blancos.

RED-DEST               X(01)      Se indica la red del destinatario de la transferencia

                                  L: LINK
                                  B: BANELCO
                                  C:COELSA
BANCO-DESTINO          X(22)      Nombre del banco al que se transfieren los fondos.
NOMBRE-ORIG            X(22)      Nombre del titular de la cuenta origen (CBU origen).
                                                                                     Referencia
                                         ANEXO
                                                                                     Vigente desde          23/06/2026

                  COBRO CON TRANSFERENCIAS (BCRA A-8406)                             Capítulo                     1

                           MENSAJERIA HTH Y EXTRACT                                  Página                      16

  Token “QY”

  El presente token contendrá la información de las cuentas intervinientes en la operación, la cual
  será informada en función de la etapa transaccional correspondiente. A continuación, se detallan los
  datos incluidos:

  Etapa A:
Token Header
Campo                  Formato   Valor     Descripción

EYE CATCHER             X(2)     “! ”      Identificador literal.
TKN-ID                  X(2)     “QY”      Nombre o Identificador único de la estructura de datos.
TKN-LGTH                9(5)     “00308”   Indica el largo total de los datos informado en el campo (alineado con ceros

USER-FLD                X(1)     “”        a izquierda).
                                           Blanco.
 Token Data
 Campo                 Formato    Descripción
ORIG-REAL                         Datos de la cuenta en la que se realiza el débito – Usuario solicitante del préstamo
   NOMBRE-ORIG-REAL     X(22)     Nombre del usuario
   CUIT-ORIG-REAL       9(11)     Número de CUIT del usuario
   CBU-ORIG-REAL        9(22)     Número de CBU del origen
   CVU-ORIG-REAL        9(22)     Número de la CVU del usuario
DEST-REAL                         Datos de la cuenta en la que se realiza el crédito – Administrador
   NOMBRE-DEST-REAL     X(22)     Nombre del titular de la cuenta asociada a la CBU del administrador
   CUIT-DEST-REAL       9(11)     Número de CUIT del titular de la cuenta asociada a la CBU del administrador
   CBU-DEST-REAL        9(22)     Número de CBU del administrador
   CVU-DEST-REAL        9(22)     Se completa con Blancos.
ORIG-INF
   NOMBRE-ORIG-INF      X(22)     Se completa con Blancos.
   CUIT-ORIG-INF        9(11)     Se completa con Blancos.
   CBU-ORIG-INF         9(22)     Se completa con Blancos.
   CVU-ORIG-INF         9(22)     Se completa con Blancos.
DEST-INF                          Datos de la cuenta en la que se realiza el crédito – PNFC
   NOMBRE-DEST-INF      X(22)     Nombre del titular de la cuenta asociada al PNFC
   CUIT-DEST-INF        9(11)     Número de CUIT del titular de la cuenta asociada al PNFC
   CBU-DEST-INF         9(22)     Número de CBU de destino.
   CVU-DEST-INF         9(22)     Número de la CVU del PNFC

  Etapa B:
Token Header
Campo                  Formato   Valor     Descripción

EYE CATCHER             X(2)     “! ”      Identificador literal.
TKN-ID                  X(2)     “QY”      Nombre o Identificador único de la estructura de datos.
TKN-LGTH                9(5)     “00308”   Indica el largo total de los datos informado en el campo (alineado con ceros

USER-FLD                X(1)     “”        a izquierda).
                                           Blanco.
 Token Data
 Campo                 Formato    Descripción
ORIG-REAL                         Datos de la cuenta en la que se realiza el débito - Administrador
   NOMBRE-ORIG-REAL     X(22)     Nombre del titular de la cuenta asociada a la CBU del administrador
   CUIT-ORIG-REAL       9(11)     Número de CUIT del titular de la cuenta asociada a la CBU del administrador
   CBU-ORIG-REAL        9(22)     Número de CBU del administrador
                                                                                         Referencia
                                          ANEXO
                                                                                         Vigente desde          23/06/2026

                 COBRO CON TRANSFERENCIAS (BCRA A-8406)                                  Capítulo                        1

                          MENSAJERIA HTH Y EXTRACT                                       Página                      17

   CVU-ORIG-REAL       9(22)        Se completa con Blancos.
DEST-REAL                           Datos de la cuenta en la que se realiza el crédito - PNFC
   NOMBRE-DEST-REAL    X(22)        Nombre del titular de la cuenta asociada al PNFC
   CUIT-DEST-REAL      9(11)        Número de CUIT del titular de la cuenta asociada al PNFC
   CBU-DEST-REAL       9(22)        Número de CBU de destino.
   CVU-DEST-REAL       9(22)        Número de la CVU del PNFC
ORIG-INF                            Datos de la cuenta en la que se realiza el débito – Usuario solicitante del préstamo
   NOMBRE-ORIG-INF     X(22)        Nombre del usuario
   CUIT-ORIG-INF       9(11)        Número de CUIT del usuario
   CBU-ORIG-INF        9(22)        Número de CBU del origen
   CVU-ORIG-INF        9(22)        Número de la CVU del usuario
DEST-INF
   NOMBRE-DEST-INF     X(22)        Se completa con Blancos.
   CUIT-DEST-INF       9(11)        Se completa con Blancos.
   CBU-DEST-INF        9(22)        Se completa con Blancos.
   CVU-DEST-INF        9(22)        Se completa con Blancos.

  Token “QU”

Token Header
Campo                 Formato Valor          Descripción

EYE CATCHER            X(2)       “! ”       Identificador literal.
TKN-ID                 X(2)       “QU”       Nombre o Identificador único de la estructura de datos.
TKN-LGTH               9(5)       “00020”    Indica el largo total de los datos informado en el campo (alineado con ceros

USER-FLD               X(1)       “”         a izquierda).
                                             Blanco.
 Token Data
 Campo                Formato Descripción
CANAL-ID               X(20)      Identificador del canal.

                                  Valores posibles:

                                  CXT_ACEPTADOR_LINK: el aceptador inicia la transacción con Administrador link.
                                  CXT_ACEPTADOR_PROC: el aceptador inicia la transacción con Administrador NewPay.

  Token “R8” (Nuevo)

  Token Header
  Campo                 Format Valor           Descripción
  EYE CATCHER           oX(2)  “! ”             Identificador literal.
  TKN-ID                  X(2)     “R8”         Nombre o Identificador único de la estructura de datos.
                                                Indica el largo total de los datos informado en el campo (alineado con
  TKN-LGTH                9(5)     “00092”
                                                ceros a izquierda).

  USER-FLD                X(1)     “”           Blanco.
   Token Data
   Campo                Format Descripción
                        o
   ID-PRESTAMO           X(32) Identificador del préstamo.
   ID-COBRO               X(32)    Identificador del cobro del préstamo.
  AUTH-ID-RESP            X(06)    Identificador del cobro, generado por el Administrador.
                                                                                       Referencia
                                         ANEXO
                                                                                       Vigente desde         23/06/2026

                 COBRO CON TRANSFERENCIAS (BCRA A-8406)                                Capítulo                    1

                         MENSAJERIA HTH Y EXTRACT                                      Página                     18

                                 Identifica la etapa del cobro del préstamo.

                                 Valores posibles:
ETAPA                    X(01)
                                 A: débito de la cuenta del usuario y acreditación a la cuenta del Administrador del
                                 esquema de transferencia.
                                 B: débito a la cuenta del Administrador del esquema de transferencia y crédito a la
                                 cuenta del Proveedor No Financiero de Crédito (PNFC).

                                 Identificador del tipo de préstamo.

TIPO-COBRO               X(01)   Valores posibles:
                                 1: Préstamo con desembolso
                                 2: Préstamo sin desembolso
                                 3: Refinanciación
COD-BCRA-PSPCP-ORIG      X(05)   Identificador del Proveedor del Cuenta origen
COD-BCRA-PSPCP-DEST      X(05)   Identificador del Proveedor del Cuenta destino
CUOTA-CUOTAS             X(09)   Descripción cuota. Ejemplo: 9999/9999
FILLER                   X(01)   Uso futuro

3.4 Transacción “29” Tipo-tran “B”

Mensaje 0220

 Bit           Campo             Tipo                  Descripción                                Detalles
P-001    SECONDARY BITMAP        X(16)    Bitmap secundario                            Aquí se informarán como
                                                                                       presentes en el mensaje los
                                                                                       campos que figuran a
                                                                                       continuación.
P-003    PROCESSING CODE         X(6)     Se informa en las siguientes                 Se completa con “2900XX”
                                          posiciones:                                  Donde XX corresponde al tipo
                                          1-2: código de transacción.                  de cuenta.
                                          3-4: tipo de cuenta que recibe el débito.
                                          5-6: tipo de cuenta que recibe el
                                          crédito.
P-004    TRAN-AMT                9(12)    Monto de la operación                     Sin cambios respecto a la solución
                                          Formato: 10 enteros + 2 decimales         actual.

P-007    TRANSMISSION DATE       9(10)    Fecha y hora de transmisión del mensaje      Sin cambios respecto a la solución
         AND TIME                                                                      actual
P-011    SYSTEMS TRACE           9(6)     Número de mensaje usado para                 Sin cambios respecto a la solución
         AUDIT NUMBER                     establecer la correspondencia de una         actual
                                          respuesta y su original
P-012    LOCAL TRANSACTION       9(6)     Hora local en que comenzó la transacción     Sin cambios respecto a la solución
         TIME                                                                          actual
P-013    LOCAL TRANSACTION       9(4)     Fecha calendario en que comenzó la           Sin cambios respecto a la solución
         DATE                             transacción                                  actual
P-015    SETL-DAT                9(4)     Fecha de negocio a que corresponde la        Sin cambios respecto a la solución
                                          transacción. Formato mmdd.                   actual
P-017    CAPTURE DATE            9(4)     Fecha de negocio en que la transacción       Sin cambios respecto a la solución
                                          fue procesada                                actual
P-032    ACQUIRING               9(11)    Número de Identificación de la institución   Sin cambios respecto a la solución
         INSTITUTION                      a la que pertenece la terminal               actual
         IDENTIFICATION CODE
P-035    TRACK 2 DATA            X(37)    Track 2 de la tarjeta                        Tarjeta virtual genérica:
                                                                                       9999+FIID+0 (9999: Valor fijo,
                                                                                       FIID: Identificador de la entidad)
P-037    RETRIEVAL               X(12)    Número asignado por el originador del        Sin cambios respecto a la solución
         REFERENCE NUMBER                 mensaje para identificar una transacción.    actual
P-038    AUTH-ID-RESP            X(6)     Código de identificación de respuesta        Identificador de la operación ,
                                          de transacción.                              generado por el Administrador
                                                                                       del esquema.
                                                                                       Referencia
                                        ANEXO
                                                                                       Vigente desde          23/06/2026

                   COBRO CON TRANSFERENCIAS (BCRA A-8406)                              Capítulo                     1

                           MENSAJERIA HTH Y EXTRACT                                    Página                      19

 Bit          Campo            Tipo                   Descripción                                  Detalles
P-039   RESPONSE CODE           9(2)     00 = Aprobada.                                Sin cambios respecto a la solución
                                                                                       actual
P-041   CARD ACCEPTOR          X(16)     Identificador de la terminal que acepta       Valores posibles:
        TERMINAL                         la transacción.                               ADMLINKCXT : cobro iniciado
        IDENTIFICATION                                                                 con Administrador link
                                                                                       ADMPRISMACXT: cobro
                                                                                       iniciado con administrador
                                                                                       NewPay
P-043   CARD ACCEPTOR          X(40)     El formato es:                                Sin cambios respecto a la solución
        NAME                             1-22: Nombre del administrador del            actual
                                         Cajero.
                                         23-35: Ciudad del Cajero.
                                         36-38: Estado del Cajero.
                                         39-40: País del Cajero.
P-049   TRANSACTION             9(3)     Código ISO de la moneda                       Sin cambios respecto a la solución
        CURRENCY CODE                    032 = Pesos                                   actual
P-054   ADD-AMTS               X(023)    El formato es:                                Sin cambios respecto a la solución
                                         1-3: Longitud del campo                       actual
                                         4-23: Se informan blancos.
P-055   PRI-RSRVD1-ISO         X(120)    El formato es:                                Se informan datos asociados a
                                         1-3: Longitud del campo                       la operatoria de Transferencias
                                         4-120: Ver debajo detalle de campo 55
P-060   TERMINAL DATA          X(15)     El formato es:                                Sin cambios respecto a la solución
                                         1-3: Longitud del campo.                      actual
                                         4-7: Siglas institución dueña de la
                                         terminal.
                                         8-11: Red lógica de la terminal.
                                         12-15: Diferencia horaria entre hora local
                                         de transacción y hora del sistema.
P-061   CARD ISSUER            X(16)     El formato es:                                Sin cambios respecto a la solución
        AUTHORIZER DATA                  1-3: Longitud del campo.                      actual
                                         4-7: Sigla de la institución emisora de la
                                         tarjeta.
P-062   PRI-RSRVD3-PRVT        X(25)     Se informa el tipo de terminal                Valores posibles:
                                                                                        “A9”
                                                                                        “00”
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
        PRVT                             tokens “PE”, “Q7”, “QU”,“QY” y “R8”           la operatoria de
                                                                                       TRANSFERENCIAS
                                                                                     Referencia
                                      ANEXO
                                                                                     Vigente desde         23/06/2026

                COBRO CON TRANSFERENCIAS (BCRA A-8406)                               Capítulo                    1

                          MENSAJERIA HTH Y EXTRACT                                   Página                     20

 Bit          Campo           Tipo                  Descripción                                 Detalles
S-127   SECNDRY-RSRVD8-       X(43)    El formato es:                                Sin cambios respecto a la solución
        PRVT                           Posiciones 01-03 = Indicador de longitud.     actual
                                       El valor a informar es `043`.
                                       Posiciones 04-46 = Si es cruzada se
                                       informa el tipo de cambio. De lo contrario,
                                       se informarán ceros.

Mensaje 0230

 Bit          Campo           Tipo                  Descripción                                 Detalles
P-001   SECONDARY BITMAP      X(16)    Bitmap secundario                             Aquí se informarán como
                                                                                     presentes en el mensaje los
                                                                                     campos que figuran a
                                                                                     continuación.
P-003   PROCESSING CODE        X(6)    Se informa en las siguientes                  Se completa con “2900XX”
                                       posiciones:                                   Donde XX corresponde al tipo
                                       1-2: código de transacción.                   de cuenta.
                                       3-4: tipo de cuenta que recibe el débito.
                                       5-6: tipo de cuenta que recibe el
                                       crédito.
P-004   TRAN-AMT              9(12)    Monto de la operación                     Sin cambios respecto a la solución
                                       Formato: 10 enteros + 2 decimales         actual

P-007   TRANSMISSION DATE     9(10)    Fecha y hora de transmisión del mensaje       Sin cambios respecto a la solución
        AND TIME                                                                     actual
P-011   SYSTEMS TRACE          9(6)    Número de mensaje usado para                  Sin cambios respecto a la solución
        AUDIT NUMBER                   establecer la correspondencia de una          actual
                                       respuesta y su original
P-012   LOCAL TRANSACTION      9(6)    Hora local en que comenzó la transacción      Sin cambios respecto a la solución
        TIME                                                                         actual
P-013   LOCAL TRANSACTION      9(4)    Fecha calendario en que comenzó la            Sin cambios respecto a la solución
        DATE                           transacción                                   actual
P-015   SETL-DAT               9(4)    Fecha de negocio a que corresponde la         Sin cambios respecto a la solución
                                       transacción. Formato mmdd.                    actual
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
P-039   RESPONSE CODE          9(2)    00 = Aprobada.                                Sin cambios respecto a la solución
                                                                                     actual
P-041   CARD ACCEPTOR         X(16)    Identificador de la terminal que acepta       Valores posibles:
        TERMINAL                       la transacción.                               ADMLINKCXT : cobro iniciado
        IDENTIFICATION                                                               con Administrador link
                                                                                     ADMPRISMACXT: cobro
                                                                                     iniciado con administrador
                                                                                     NewPay
P-043   CARD ACCEPTOR         X(40)    El formato es:                                Sin cambios respecto a la solución
        NAME                           1-22: Nombre del administrador del            actual
                                       Cajero.
                                       23-35: Ciudad del Cajero.
                                       36-38: Estado del Cajero.
                                       39-40: País del Cajero.
P-049   TRANSACTION            9(3)    Código ISO de la moneda                       Sin cambios respecto a la solución
        CURRENCY CODE                  032 = Pesos                                   actual
                                                                                      Referencia
                                       ANEXO
                                                                                      Vigente desde          23/06/2026

                 COBRO CON TRANSFERENCIAS (BCRA A-8406)                               Capítulo                     1

                           MENSAJERIA HTH Y EXTRACT                                   Página                      21

 Bit          Campo            Tipo                  Descripción                                  Detalles
S-102   ACCOUNT                X(28)    Identificación de la cuenta Origen            Sin cambios respecto a la solución
        IDENTIFICATION 1                1-3: Longitud del campo.                      actual
                                        4-28: Número de cuenta.
S-103   ACCOUNT                X(28)    Identificación de la cuenta de acreditación   Identificación de la cuenta en
        IDENTIFICATION 2                1-3: Longitud del campo.                      formato “PBF”.
                                        4-28: Número de cuenta.

Mensaje 0420

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
P-035   TRACK 2 DATA           X(37)    Track 2 de la tarjeta                         Tarjeta virtual genérica:
                                                                                      9999+FIID+0 (9999: Valor fijo,
                                                                                      FIID: Identificador de la entidad)
P-037   RETRIEVAL              X(12)    Número asignado por el originador del         Sin cambios respecto a la solución
        REFERENCE NUMBER                mensaje para identificar una transacción.     actual
P-038   AUTH-ID-RESP            X(6)    Código de identificación de respuesta         Identificador de la operación ,
                                        de transacción.                               generado por el Administrador
                                                                                      del esquema.
P-039   RESPONSE CODE           9(2)    Código de respuesta:                          Sin cambios respecto a la solución
                                        00 = Aprobada.                                actual
P-041   CARD ACCEPTOR          X(16)    Identificador de la terminal que acepta       Valores posibles:
        TERMINAL                        la transacción.                               ADMLINKCXT : cobro iniciado
        IDENTIFICATION                                                                con Administrador link
                                                                                      ADMPRISMACXT: cobro
                                                                                      iniciado con administrador
                                                                                      NewPay
                                                                                       Referencia
                                        ANEXO
                                                                                       Vigente desde          23/06/2026

                 COBRO CON TRANSFERENCIAS (BCRA A-8406)                                Capítulo                      1

                           MENSAJERIA HTH Y EXTRACT                                    Página                        22

 Bit          Campo            Tipo                   Descripción                                  Detalles
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
P-060   TERMINAL DATA          X(15)     El formato es:                                Sin cambios respecto a la solución
                                         1-3: Longitud del campo.                      actual
                                         4-7: Siglas institución dueña de la
                                         terminal.
                                         8-11: Red lógica de la terminal.
                                         12-15: Diferencia horaria entre hora local
                                         de transacción y hora del sistema.
P-061   CARD ISSUER            X(16)     El formato es:                                Sin cambios respecto a la solución
        AUTHORIZER DATA                  1-3: Longitud del campo.                      actual
                                         4-7: Sigla de la institución emisora de la
                                         tarjeta.
P-062   PRI-RSRVD3-PRVT        X(25)     Se informa el tipo de terminal                Valores posibles:
                                                                                        “A9”
                                                                                        “00”
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
        PRVT                             tokens “PE”, “Q7” , “QU”, “QY” y “R8”         la operatoria de
                                                                                       TRANSFERENCIAS

Mensaje 0430

 Bit          Campo            Tipo                   Descripción                                  Detalles
P-001   SECONDARY BITMAP       X(16)     Bitmap secundario                             Aquí se informarán como
                                                                                       presentes en el mensaje los
                                                                                       campos que figuran a
                                                                                       continuación.
P-002   PAN                    X(19)     Primary Account Number                        Número de tarjeta
                                                                                    Referencia
                                      ANEXO
                                                                                    Vigente desde         23/06/2026

                   COBRO CON TRANSFERENCIAS (BCRA A-8406)                           Capítulo                    1

                          MENSAJERIA HTH Y EXTRACT                                  Página                     23

  Bit         Campo           Tipo                  Descripción                                Detalles
P-003   PROCESSING CODE        X(6)    Se informa en las siguientes                 Se completa con “2900XX”
                                       posiciones:                                  Donde XX corresponde al tipo
                                       1-2: código de transacción.                  de cuenta.
                                       3-4: tipo de cuenta que recibe el débito.
                                       5-6: tipo de cuenta que recibe el
                                       crédito.
P-004   TRAN-AMT              9(12)    Monto de la operación                        Sin cambios respecto a la solución
                                       Formato: 10 enteros + 2 decimales            actual.

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
P-041   CARD ACCEPTOR         X(16)    Identificador de la terminal que acepta      Valores posibles:
        TERMINAL                       la transacción.                              ADMLINKCXT : cobro iniciado
        IDENTIFICATION                                                              con Administrador link
                                                                                    ADMPRISMACXT: cobro
                                                                                    iniciado con administrador
                                                                                    NewPay
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

Redefinición del campo 55 - PRI-RSRVD1-ISO

Nombre del campo                 Descripción                                                              Atributo
                                                                                             Referencia
                                             ANEXO
                                                                                             Vigente desde         23/06/2026

                      COBRO CON TRANSFERENCIAS (BCRA A-8406)                                 Capítulo                      1

                                MENSAJERIA HTH Y EXTRACT                                     Página                       24

LONGITUD                                 Longitud del campo 55. El valor a informar es “120”.                      9(3)
TRANSFERENCIA
    TRACK2                               Contiene datos del Track 2 de la tarjeta alineado a izquierda y           X(40)
                                         rellenos con blancos.

                                         Valores posibles:
                                         Tarjeta del usuario
                                         Tarjeta virtual genérica: 9999+FIID+000000000 (9999: Valor fijo,
                                         FIID: Identificador de la entidad originante, 000000000: Valor Fijo)
    CA                                                                                                             X(2)
    MARCA-TIT                            Redefinición del campo CA.
               MISMO-TITULAR             Se indica la condición de titularidad del                                 X(1)
                                         ordenante de la transferencia frente a la cuenta
                                         destino.
                                         Valores posibles:
                                         “S”: Cuenta propia.
                                         “C”: Cuenta propia compartida.
                                         “N”: Cuenta de terceros.
               FILLER                    Se informan BLANCOS                                                       X(1)
    FR-ACCT                              Número de cuenta de origen
               FIID                      Institución Emisora de la cuenta origen                                   X(4)
               TYP                       Tipo de cuenta origen                                                     X(2)
               ACCT-NUM                  Número de cuenta origen                                                   X(19)
    TO-ACCT                              Número de cuenta destino
               FIID                      Institución Emisora de la cuenta destino                                  X(4)
               TYP                       Tipo de cuenta destino                                                    X(2)
               ACCT-NUM                  Número de cuenta destino                                                  X(19)
               FIID-DESC                 Institución a la cual pertenece la cuenta destino                         X(13)
    FR-ACCT-TYP                          Se informa Blanco                                                         X(1)
    TO-ACCT-TYP                          Se informa Blanco                                                         X(1)
    TIPO-TRAN                            Se informará “B”                                                          X(1)
    MOTIVO                               Se informará “CXT”                                                        X(3)
    FILLER                               Se deberá informar BLANCOS                                                X(9)

Tokens

Token “PE”

Token Header

Campo                   Formato     Valor       Descripción
EYE CATCHER              X(2)       “! ”        Identificador literal.
TKN-ID                   X(2)       “PE”        Nombre o Identificador único de la estructura de datos.
                                                Indica el largo total de los datos informado en el campo (alineado con ceros a
TKN-LGTH                 9(5)       “00156”
                                                izquierda).
USER-FLD                 X(1)       “”          Blanco.
 Token Data
                                                                                           Referencia
                                            ANEXO
                                                                                           Vigente desde          23/06/2026

                     COBRO CON TRANSFERENCIAS (BCRA A-8406)                                Capítulo                        1

                               MENSAJERIA HTH Y EXTRACT                                    Página                       25

  Campo                 Formato     Descripción

  MOTIVO                X(3)        Se informará “CXT”
  REFERENCIA            X(12)      Referencia sobre el cobro con transferencia
                                   Tipo de cuenta de destino.

  TIPO-CTA-DEST         X(02)      Valores posibles:
                                   01 = Cuenta corriente en pesos.
                                   11 = Caja de ahorro en pesos.

  CDI-ORIG              X(11)       CDI, DNI o CUIL del titular de la cuenta origen de la transferencia (CBU de origen).

  CDI-DEST              X(11)       CDI, DNI o CUIL del titular de la cuenta destino de la transferencia (CBU de destino).
                                   Se indica la condición de titularidad del ordenante de la transferencia frente a la cuenta
                                   destino.

  MISMO-TITULAR         X(01)      Valores posibles:
                                   “S”: Cuenta propia.
                                   “C”: Cuenta propia compartida.
                                   “N”: Cuenta de terceros.
  NOMBRE                X(22)       Nombre del titular de la cuenta destino de la transferencia. (CBU de destino).
                                   Track 2 de tarjeta de débito del usuario.

                                   Valores posibles:
  TRACK2                X(40)      Tarjeta del usuario
                                   Tarjeta virtual genérica: 9999+FIID+000000000 (9999: Valor fijo, FIID: Identificador de la
                                   entidad originante, 000000000: Valor Fijo)

  FR-ACCT.FIID          X(04)       FIID banco emisor.
  FR-ACCT.TYP           X(02)       Tipo de cuenta de origen.

  FR-ACCT.ACCT-NUM      X(19)       Número de cuenta de origen.

  TO-ACCT.FIID          X(04)       FIID banco receptor de los fondos.
  TO-ACCT.FIID-CPF      X(04)       FIID del banco receptor para Base24. (idem a TO-ACCT. FIID)
  TO-ACCT.TYP           X(02)       Tipo de cuenta de destino.

  TO-ACCT.ACCT-NUM      X(19)       Número de cuenta de destino.

  Token “Q7”

Token Header
Campo                 Formato     Valor       Descripción

EYE CATCHER            X(2)       “! ”        Identificador literal.
TKN-ID                 X(2)       “Q7”        Nombre o Identificador único de la estructura de datos.
TKN-LGTH               9(5)       “00240”     Indica el largo total de los datos informado en el campo (alineado con ceros

USER-FLD               X(1)       “”          a izquierda).
                                              Blanco.
 Token Data
 Campo                Formato     Descripción
NÚMERO DE CBU          9(22)      Número de CBU dela cuenta de destino .
TIPO-PERSONA           X(1)       Tipo de Persona Titular. Los valores posibles son:

                                  “F”: Persona física.
                                  “J”: Persona jurídica.

                                  Se informará blanco.
                                                                                          Referencia
                                           ANEXO
                                                                                          Vigente desde          23/06/2026

                   COBRO CON TRANSFERENCIAS (BCRA A-8406)                                 Capítulo                      1

                             MENSAJERIA HTH Y EXTRACT                                     Página                       26

TITULAR-1-CDI        9(11)      CUIL-CDI/CUIT del 1er. titular de la cuenta de destino (CBU destino)

TITULAR-1-NOMBRE     X(40)      El/los apellido/s y el/los nombre/s del primer titular de la cuenta de destino. (CBU destino)

TITULAR-2-CDI        9(11)      Se informan blancos.
TITULAR-2-NOMBRE     X(40)      Se informan blancos.
TITULAR-3-CDI        9(11)      Se informan blancos.
TITULAR-3-NOMBRE     X(40)      Se informan blancos.
NUM-CTA-BCRIA        X(19)      El número de cuenta asociado a la cbu destino

                                Se informarán blancos.

RED-DEST             X(01)      Se indica la red del destinatario de la transferencia

                                L: LINK
                                B: BANELCO
                                C:COELSA
BANCO-DESTINO        X(22)      Nombre del banco al que se transfieren los fondos.
NOMBRE-ORIG          X(22)      Nombre del titular de la cuenta origen (CBU origen).

  Token “QY”

  El presente token contendrá la información de las cuentas intervinientes en la operación, la cual
  será informada en función de la etapa transaccional correspondiente. A continuación, se detallan los
  datos incluidos:

  Etapa A:
Token Header
Campo                   Formato    Valor      Descripción

EYE CATCHER             X(2)        “! ”      Identificador literal.
TKN-ID                  X(2)        “QY”      Nombre o Identificador único de la estructura de datos.
TKN-LGTH                9(5)        “00308”   Indica el largo total de los datos informado en el campo (alineado con ceros

USER-FLD                X(1)        “”        a izquierda).
                                              Blanco.
 Token Data
 Campo                  Formato     Descripción
ORIG-REAL                           Datos de la cuenta en la que se realiza el débito – Usuario solicitante del préstamo
   NOMBRE-ORIG-REAL     X(22)       Nombre del usuario
   CUIT-ORIG-REAL       9(11)       Número de CUIT del usuario
   CBU-ORIG-REAL        9(22)       Número de CBU del origen
   CVU-ORIG-REAL        9(22)       Número de la CVU del usuario
DEST-REAL                           Datos de la cuenta en la que se realiza el crédito – Administrador
   NOMBRE-DEST-REAL     X(22)       Nombre del titular de la cuenta asociada a la CBU del administrador
   CUIT-DEST-REAL       9(11)       Número de CUIT del titular de la cuenta asociada a la CBU del administrador
   CBU-DEST-REAL        9(22)       Número de CBU del administrador
   CVU-DEST-REAL        9(22)       Se completa con Blancos.
ORIG-INF
   NOMBRE-ORIG-INF      X(22)       Se completa con Blancos.
   CUIT-ORIG-INF        9(11)       Se completa con Blancos.
   CBU-ORIG-INF         9(22)       Se completa con Blancos.
   CVU-ORIG-INF         9(22)       Se completa con Blancos.
DEST-INF                            Datos de la cuenta en la que se realiza el crédito – PNFC
   NOMBRE-DEST-INF      X(22)       Nombre del titular de la cuenta asociada al PNFC
   CUIT-DEST-INF        9(11)       Número de CUIT del titular de la cuenta asociada al PNFC
   CBU-DEST-INF         9(22)       Número de CBU de destino.
   CVU-DEST-INF         9(22)       Número de la CVU del PNFC
                                                                                        Referencia
                                          ANEXO
                                                                                        Vigente desde          23/06/2026

               COBRO CON TRANSFERENCIAS (BCRA A-8406)                                   Capítulo                     1

                         MENSAJERIA HTH Y EXTRACT                                       Página                      27

  Etapa B:
Token Header
Campo                 Formato     Valor      Descripción

EYE CATCHER           X(2)        “! ”        Identificador literal.
TKN-ID                X(2)        “QY”        Nombre o Identificador único de la estructura de datos.
TKN-LGTH              9(5)        “00308”     Indica el largo total de los datos informado en el campo (alineado con ceros

USER-FLD              X(1)        “”          a izquierda).
                                              Blanco.
 Token Data
 Campo                Formato     Descripción
ORIG-REAL                         Datos de la cuenta en la que se realiza el débito - Administrador
   NOMBRE-ORIG-REAL   X(22)       Nombre del titular de la cuenta asociada a la CBU del administrador
   CUIT-ORIG-REAL     9(11)       Número de CUIT del titular de la cuenta asociada a la CBU del administrador
   CBU-ORIG-REAL      9(22)       Número de CBU del administrador
   CVU-ORIG-REAL      9(22)       Se completa con Blancos.
DEST-REAL                         Datos de la cuenta en la que se realiza el crédito - PNFC
   NOMBRE-DEST-REAL   X(22)       Nombre del titular de la cuenta asociada al PNFC
   CUIT-DEST-REAL     9(11)       Número de CUIT del titular de la cuenta asociada al PNFC
   CBU-DEST-REAL      9(22)       Número de CBU de destino.
   CVU-DEST-REAL      9(22)       Número de la CVU del PNFC
ORIG-INF                          Datos de la cuenta en la que se realiza el débito – Usuario solicitante del préstamo
   NOMBRE-ORIG-INF    X(22)       Nombre del usuario
   CUIT-ORIG-INF      9(11)       Número de CUIT del usuario
   CBU-ORIG-INF       9(22)       Número de CBU del origen
   CVU-ORIG-INF       9(22)       Número de la CVU del usuario
DEST-INF
   NOMBRE-DEST-INF    X(22)       Se completa con Blancos.
   CUIT-DEST-INF      9(11)       Se completa con Blancos.
   CBU-DEST-INF       9(22)       Se completa con Blancos.
   CVU-DEST-INF       9(22)       Se completa con Blancos.

  Token “QU”

Token Header
Campo                 Formato Valor        Descripción

EYE CATCHER           X(2)      “! ”        Identificador literal.
TKN-ID                X(2)      “QU”        Nombre o Identificador único de la estructura de datos.
TKN-LGTH              9(5)      “00020”     Indica el largo total de los datos informado en el campo (alineado con ceros

USER-FLD              X(1)      “”          a izquierda).
                                            Blanco.
 Token Data
 Campo                Formato Descripción
CANAL-ID              X(20)     Identificador del canal.

                                Valores posibles:

                                CXT_ACEPTADOR_LINK: el aceptador inicia la transacción con Administrador link.
                                CXT_ACEPTADOR_PROC: el aceptador inicia la transacción con Administrador NewPay.
                                                                                         Referencia
                                          ANEXO
                                                                                         Vigente desde         23/06/2026

                COBRO CON TRANSFERENCIAS (BCRA A-8406)                                   Capítulo                       1

                           MENSAJERIA HTH Y EXTRACT                                      Página                     28

Token “R8” (Nuevo)

Token Header
Campo                     Format Valor        Descripción
EYE CATCHER               oX(2)  “! ”          Identificador literal.
TKN-ID                     X(2)    “R8”        Nombre o Identificador único de la estructura de datos.
                                               Indica el largo total de los datos informado en el campo (alineado con
TKN-LGTH                   9(5)    “00092”
                                               ceros a izquierda).

USER-FLD                   X(1)    “”          Blanco.
Token Data
Campo                     Format Descripción
                          o
ID-PRESTAMO                X(32) Identificador del préstamo.
ID-COBRO                   X(32)   Identificador del cobro del préstamo.
AUTH-ID-RESP               X(06)   Identificador del cobro, generado por el Administrador.

                                   Identifica la etapa del cobro del préstamo.

                                   Valores posibles:
ETAPA                      X(01)
                                   A: débito de la cuenta del usuario y acreditación a la cuenta del Administrador del
                                   esquema de transferencia.
                                   B: débito a la cuenta del Administrador del esquema de transferencia y crédito a la
                                   cuenta del Proveedor No Financiero de Crédito (PNFC).

                                   Identificador del tipo de préstamo.

TIPO-COBRO                 X(01)   Valores posibles:
                                   1: Préstamo con desembolso
                                   2: Préstamo sin desembolso"
                                   3: Refinanciación

COD-BCRA-PSPCP-ORIG        X(05)   Identificador del Proveedor del Cuenta origen
COD-BCRA-PSPCP-DEST        X(05)   Identificador del Proveedor del Cuenta destino
CUOTA-CUOTAS               X(09)   Descripción cuota. Ejemplo: 9999/9999
FILLER                     X(01)   Uso futuro

5.       Extract

5.1 Extract de transacciones

El extract de transacciones no tendrá modificaciones respecto a los datos que se informan para las
transferencias. Las entidades podrán identificar las operaciones mediante los siguientes datos:
    •    tipo-tran: “B” e “I”
     •   Term-typ: “A9”
     •   Canal: “CXT_ACEPTADOR_LINK” ,“CXT_ACEPTADOR_PROC” y “CXT_INTERCHANGE”

5.2 Extract de transferencias

En el extract de transferencias se incluirán dos nuevas redefiniciones, denominadas
“TRANSFERENCIA-COBRO-1” , “TRANSFERENCIA-COBRO-2” y “TRANSFERENCIA-COBRO-3”,
                                                                                Referencia
                                    ANEXO
                                                                                Vigente desde         23/06/2026

                    COBRO CON TRANSFERENCIAS (BCRA A-8406)                      Capítulo                    1

                          MENSAJERIA HTH Y EXTRACT                              Página                      29

con el objetivo de informar los datos asociados a los cobros mediante transferencia, identificados
bajo el tipo-tran “B”.

Por otra parte, las transacciones utilizadas para la distribución y liquidación de tasas de
intercambio, identificadas bajo el tipo-tran “I”, permanecerán sin modificaciones.

Denominación del archivo
     • ORIGmmdd (Para el archivo correspondiente a la entidad originante).
     • DESTmmdd (Para el archivo correspondiente a la entidad destinataria).

Formato de registro de Header (longitud del registro: 397 posiciones).

                                                TIPO y
NIVEL NOMBRE DEL CAMPO                OFFSET                CONTENIDO DEL CAMPO
                                                TAMAÑO
01      HEADER                        001       X (397)
02      TIPO-ARCHIVO                  001       X (25)      Para ORIGmmdd el valor del campo es
                                                            “TRANSFERENCIAS POR ORIGEN”.
                                                            Para DESTmmdd el valor del campo es
                                                            “TRANSFERENCIAS POR DEST”.
02      FECHA                         026       X (06)      Fecha generación del archivo (AAMMDD)
02      FILLER                        032       X (366)

Formato de registro de Datos (longitud del registro: 570 posiciones)

                                                   TIPO y
NIVEL    NOMBRE DEL CAMPO              OFFSET                    CONTENIDO DEL CAMPO
                                                   TAMAÑO
01       DATOS                         001         X (570)
02       ORIG.                         001         X (26)
04       FIID                          001         X (04)        Fiid de la entidad originante.
                                                                 5892 si la entidad es BANELCO.
04       PAN                           005         X (19)        Número completo de la tarjeta. (1)
04       MEMBER                        024         X (03)        Miembro de la tarjeta. (1)
02       DEST.                         027         X (25)
04       FIID                          027         X (04)        Fiid de la entidad destino de los fondos
                                                                 asignado por link.

                                                                 5892 si la entidad es BANELCO.
                                                                 5893 si la entidad es COELSA.

04       CTA-TIPO                      031         X (02)        Tipo de cuenta destino de los fondos.
04       CTA-NRO                       033         X (19)        Número de cuenta destino de los fondos.
02       CTA-ORIG                      052         X (19)        Número de cuenta origen de los fondos. (1)
02       TYP                           071         X (04)        Tipo de mensaje:
                                                                 0210: para transferencias originadas y recibidas
                                                                 en Bancos de Red LINK.
                                                                 0220: para transferencias originadas en Red
                                                                 BANELCO.
                                                                 0420: Reversos.
02       TRAN-CDE                      075         X (06)        Código de transacción. (1)
                                                                     Referencia
                                  ANEXO
                                                                     Vigente desde          23/06/2026

                  COBRO CON TRANSFERENCIAS (BCRA A-8406)             Capítulo                     1

                        MENSAJERIA HTH Y EXTRACT                     Página                       30

                                              TIPO y
NIVEL   NOMBRE DEL CAMPO             OFFSET            CONTENIDO DEL CAMPO
                                              TAMAÑO
                                                       Referirse al documento denominado Códigos
                                                       de Transacciones.
02      RESP                         081      X (03)   Código de respuesta.
                                                       Referirse al documento denominado Códigos
                                                       de Respuesta.
02      POST-DATE                    084      X (06)   Día de negocio de la transacción.
02      TRAN-DATE                    090      X (06)   Día calendario de la transacción.
02      TRAN-TIME                    096      X (06)   Hora de la transacción.
02      TERM                         102      X (18)
04      FIID                         102      X (04)   Fiid de la terminal donde se realizó la
                                                       transacción.
                                                       5892 si es BANELCO.
04      ID                           106      X (12)   Denominación de la terminal donde se realizó la
                                                       transacción.
04      TYP                          118      X (02)   Tipo de terminal.

                                                       Valores posibles:
                                                       “A9”
                                                       “00”
02      SEQ                          120      X (12)   Número de secuencia.
02      AMT                          132      X (10)   Monto de la transacción. (2)
02      MONEDA                       142      X (03)   Moneda de la cuenta.
02      TIPO-CAMBIO                  145      X (10)   Tipo de cambio aplicado (actualmente sin uso).
02      TITULAR-CTA-DEST             155      X (01)   Se indica la condición de titularidad del
                                                       ordenante de la transferencia frente a la cuenta
                                                       destino.

                                                       Los valores que pueden informarse en este
                                                       campo son:
                                                       “S”: Cuenta propia.
                                                       “C”: Cuenta propia compartida.
                                                       “N”: Cuenta de terceros.
02      CDI                          156      X (11)   Número de CUIL/CUIT/CDI/DOCUMENTO del
                                                       originante
02      MOTIVO                       167      X (03)   Conceptos y motivos de Transferencia
                                                       (según B.C.R.A)

                                                       Se informará “CXT”
02      REFERENCIA                   170      X (12)   Referencia de la transferencia.

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
02      TRANSFERENCIA-COBRO-1        248      X(50)    Redefine RAZON-SOCIAL
                                                                     Referencia
                                 ANEXO
                                                                     Vigente desde          23/06/2026

                 COBRO CON TRANSFERENCIAS (BCRA A-8406)              Capítulo                       1

                        MENSAJERIA HTH Y EXTRACT                     Página                         31

                                             TIPO y
NIVEL   NOMBRE DEL CAMPO            OFFSET            CONTENIDO DEL CAMPO
                                             TAMAÑO
04      ETAPA                       248      (01)     Identifica la etapa del cobro del préstamo.

                                                      Valores posibles:
                                                      A: débito de la cuenta del usuario y
                                                      acreditación a la cuenta del Administrador del
                                                      esquema de transferencia.
                                                      B: débito a la cuenta del Administrador del
                                                      esquema de transferencia y crédito a la cuenta
                                                      del Proveedor No Financiero de Crédito
                                                      (PNFC).
04      AUTH-ID-RESP                249      (06)     Identificador del cobro con Transferencia,
                                                      generado por el administrador
04      ID-COBRO                    255      (32)     Identificador del cobro
04      CUOTA-CUOTAS                287      (09)     Descripción cuota. Ejemplo: 9999/9999
04      FILLER                      296      (02)     Uso Futuro.
02      NOMBRE-FANT                 298      X (50)   Nombre de fantasía del comercio (canales de
                                                      pago con transferencia).
02      TRANSFERENCIA-COBRO-2       298      X(50)    Redefine NOMBRE-FANT
04      ID-PRESTAMO                 298      (32)     Identificador del préstamo
04      FILLER                      330      (18)     Uso futuro
02      SUBCONCEPTO                 348      X(01)    Subconcepto de transferencias por lote
                                                      (generadas en la terminal “56”).
                                                      Los valores posibles son:
                                                      A – Beneficios
                                                      B – Honorarios
                                                      C – Proveedores
                                                      D – Judiciales
                                                      E – Fondo de Desempleo

                                                      Para el resto de las transferencias se
                                                      informará blanco.
02      TIPO-TRAN                   349      X (01)   Tipo de transacción

                                                      Valores posibles:
                                                      A: Devolución de pago con lectura de QR
                                                      B: Cobro con Transferencia
                                                      C: Transferencia CVU
                                                      D: Devolución total de pago PEI
                                                      E: Devolución parcial de pago PEI
                                                      I: Distribución de tasa de Intercambio
                                                      L: Transferencia PULL
                                                      P: Pago PEI
                                                      Q: Pago con lectura de QR
                                                      R: Transferencia inmediata entre personas
                                                      X: Transferencia por importe superior (TIS).
02      TRANSFERENCIA 3.0           350
04      AUTH-ID-RESP                350      X (06)   Identificador del pago con transferencia con
                                                      lectura de código QR.
04      CVU-DESTINO                 356      X (22)   CVU del destino.
04      CUIT-DESTINO                378      X (11)   CUIT del destino.
04      ID-BILLETERA                389      X (11)   CUIT de la Billetera.
04      CVU-BILLETERA               400      X (22)   CVU del usuario de la billetera.
                                                                       Referencia
                                   ANEXO
                                                                       Vigente desde          23/06/2026

                 COBRO CON TRANSFERENCIAS (BCRA A-8406)                Capítulo                      1

                          MENSAJERIA HTH Y EXTRACT                     Página                        32

                                               TIPO y
NIVEL   NOMBRE DEL CAMPO              OFFSET            CONTENIDO DEL CAMPO
                                               TAMAÑO
04      ID-QR                         422      X (64)   Identificador del QR .
04      DEV-AUTH-ID-RESP              486      X (06)   En las devoluciones de pago con transferencia
                                                        con lectura de código QR se informa el AUTH-
                                                        ID-RESP de la transacción original.
04      COD-BILL-BCRA                 492      X(05)    Identificador de la Billetera asignado por el
                                                        BCRA
04      TRANSF-TYPE                   497      X(01)    Tipo de transferencia:
                                                        0: PEI
                                                        1: Debin
                                                        2: T-PULL – UNICA VEZ
                                                        3: T-PULL- RECURRENTE
02      TRANSFERENCIA-PUSH-CVU        350               Redefinición de TRANSFERENCIA 3.0 (5)
04      CBU-DEST                      350      X(22)    CBU de la cuenta de destino de transferencias
04      CVU-ORIG-INF                  372      X(22)    CVU del originante de la transferencia
04      NOMBRE-CVU-ORIG               394      X(22)    Nombre del titular de la CVU origen de la
                                                        transferencia
04      CUIT-CVU-ORIG                 416      X(11)    CUIT del titular de la CVU origen de la
                                                        transferencia
04      CVU-DEST-INF                  427      X(22)    CVU del destinatario de la transferencia
04      NOMBRE-CVU-DEST               449      X(22)    Nombre del titular de la CVU destino de la
                                                        transferencia
04      CUIT-CVU-DEST                 471      X(11)    CUIT del titular de la CVU destino de la
                                                        transferencia
04      FILLER                        482      X(16)    Uso futuro
02      TRANSFERENCIA-COBRO-3         350               Redefinición de TRANSFERENCIA 3.0 (6)
04      CBU-DEST-REAL                 350      X(22)    CBU de la cuenta de destino de transferencias
04      CVU-ORIG-INF                  372      X(22)    CVU del originante de la transferencia
04      NOMBRE-ORIG-INF               394      X(22)    Nombre del titular de la CVU origen de la
                                                        transferencia
04      CUIT-ORIG-INF                 416      X(11)    CUIT del titular de la CVU origen de la
                                                        transferencia
04      CVU-DEST-INF                  427      X(22)    CVU del destinatario de la transferencia
04      NOMBRE-CVU-DEST               449      X(22)    Nombre del titular de la CVU destino de la
                                                        transferencia
04      CUIT-CVU-DEST                 471      X(11)    CUIT del titular de la CVU destino de la
                                                        transferencia
04      FILLER                        482      X(16)    Uso futuro
02      AMT-EXT2                      498      X(18)    Monto de la transacción. (4)
02      CBU-ORIG                      516      X(22)    CBU de la cuenta originante de la transferencia
02      TRANSF-ID                     538      X(19)    Código identificador de la transferencia,
                                                        originado por la PSP o canal originante.

                                                        Utilizado para Transferencias-Push-CVU (tipo-
                                                        tran “C”). Para el resto de las transferencias se
                                                        completa con Blancos.

02      FILLER                        557      X (14)   Para uso futuro.

Referencias:
                                                                        Referencia
                                   ANEXO
                                                                        Vigente desde     23/06/2026

                COBRO CON TRANSFERENCIAS (BCRA A-8406)                  Capítulo               1

                        MENSAJERIA HTH Y EXTRACT                        Página                33

(1) Para el caso de la entidad de destino estos campos serán informados con blancos.
(2) En este campo se informarán asteriscos.
(3) En este campo se informarán asteriscos.
(4) En este campo siempre se informará el importe de la transacción, independientemente de
la cantidad de dígitos que conformen el mismo. La entidad deberá utilizar este campo para
efectuar los controles habituales sobre estas transacciones.
(5) Se completarán los campos incluidos en la redefinición “Transferencias-push-cvu” para las
operaciones cuyo tipo-tran sea “C”.
(6) Se completarán los campos incluidos en las redefiniciones “TRANSFERENCIA-COBRO-1” y
“TRANSFERENCIA-COBRO-2” para las transferencias con tipo-tran “B”.

6. Observaciones
Las adecuaciones sobre el extract de transferencias se realizarán sobre la última versión vigente y
por ello , las entidades que soliciten la presente solución deben considerar que el importe de las
operaciones se informará en el campo “AMT-EXT2” independientemente de la cantidad de dígitos que
lo compongan.
