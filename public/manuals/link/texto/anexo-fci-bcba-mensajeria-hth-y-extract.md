> **CONFIDENCIAL — Red LINK.** Uso interno exclusivo. NO publicar en la sección Documentación Técnica ni compartir con terceros.

# LINK — Anexo FCI BCBA · Mensajería HTH y Extract (F1 / F2)

                                                                   Referencia
       FONDO COMUN DE INVERSION PARA BCBA                          Vigente
                                                                                09/09/2024
                                                                   desde
                                                                   Capítulo         1
              MENSAJERIA HTH Y EXTRACT
                                                                   Página           1




Nuevas operaciones de Débito y Crédito para
    Fondo común de inversión (BCBA)


       MENSAJERIA HOST TO HOST
                  Y
              EXTRACT



            Este documento contiene información CONFIDENCIAL
     y tal información no puede ser cedida a terceros por ningún motivo

      Para su divulgación se debe contar con el permiso por escrito del
           dueño de la información que contiene este documento
                                                                                                   Referencia
                        FONDO COMUN DE INVERSION PARA BCBA                                         Vigente
                                                                                                                        09/09/2024
                                                                                                   desde
                                                                                                   Capítulo                   1
                                 MENSAJERIA HTH Y EXTRACT
                                                                                                   Página                     2




INDICE

 1.   Objetivo.................................................................................................................... 3
 2.   Descripción ............................................................................................................. 3
 3.   Transacciones de Base 24 ..................................................................................... 5
 4.   Mensajería Host to Host ......................................................................................... 5
 5    Archivo Diario de Transacciones (Extract de TLF) ............................................ 13
 5.   Historial de Cambio .............................................................................................. 16
                                                                                  Referencia
                     FONDO COMUN DE INVERSION PARA BCBA                           Vigente
                                                                                                  09/09/2024
                                                                                  desde
                                                                                  Capítulo             1
                             MENSAJERIA HTH Y EXTRACT
                                                                                  Página               3




1. Objetivo
  Detallar las adecuaciones que Base24 realizará en la mensajería host to host y extract para las
  transacciones asociadas a la funcionalidad “fondo común de inversión” para Banco Ciudad.

2. Descripción
  Se incorporará un nuevo tipo de transacción para las operaciones “F1” y “F2” a fin de que la entidad
  pueda identificar los débitos y créditos correspondientes a la operatoria de sus fondos común de
  inversión de los clientes del Banco Ciudad.

  El tipo de transacción será informado en el Token “RL” dentro del campo 126 de la mensajería Host to
  Host.

  Si bien el Banco utilizará inicialmente la operación “F2” , en el presente documento se especificará tanto
  la transacción “F1” como la “F2”.

  Terminales

  Banco Ciudad podrá utilizar estas nuevas operaciones exclusivamente desde las siguientes terminales:

  •   Homebanking Custom: terminales “B3” y “D4”
  •   Bielletara BUEPP: terminal “D1”,
  •   Banca empresa: terminales “D0” Y “45”.

  Nivel de autorización

  Las operaciones serán autorizadas on/off en las terminales de Hombanking custom y billetera Buepp,
  mientras que en las terminales de Banca Empresa sólo podrán ser autorizadas de manera on line.

  Asimismo, será posible configurar las operaciones para que se resuelvan on-line en todas las
  terminales. Es decir, que se aprueben únicamente cuando el banco se encuentra en línea.

  Control de límites

  Link no realizará control de límites sobre las transacciones.

  Control Tarjeta/Cuenta

  Dado que las operaciones se realizarán con tarjetas virtuales, Base24 no realizará el control de la
  relación Tarjeta/Cuenta.

  Impacto en saldo de Link (PBF)

      •   Operaciones autorizadas por Link

      Los débitos y créditos serán impactados en los saldos del PBF (Positive Balance File).

      •   Operaciones autorizadas por la entidad

      Se actualizará el saldo del PBF con el saldo informado por la entidad en los mensajes 0210 de las
      operaciones.

  Impacting en refresh
                                                                              Referencia
                   FONDO COMUN DE INVERSION PARA BCBA                         Vigente
                                                                                              09/09/2024
                                                                              desde
                                                                              Capítulo             1
                           MENSAJERIA HTH Y EXTRACT
                                                                              Página               4



Link colocará el valor del campo “IMP-IND” en el extract con el valor “1”.

La entidad deberá considerar dicho campo en el archivo extract para informar el saldo correctamente en
el refresh de PBF.

Monto máximo permitido

El monto máximo permitido será $9999999999,99 correspondiente a la longitud del campo estándar de
importe, campo 004, de la mensajería ISO8583 .

Moneda

Las operaciones podrán realizarse tanto en moneda pesos como en dólares.

Reversos

Las operaciones admitirán reversos por time out cuando la entidad responda fuera de tiempo. No se
aceptarán reversos provenientes desde el canal.

Se informarán a la entidad en la mensajería Host to Host mediante el tipo de mensaje 0420.

Control de duplicidad

Base24 evitará la duplicidad de transacciones utilizando como clave los siguientes datos:

    •   FIID
    •   CANAL
    •   CODIGO-FCI
    •   TIPO-OPER
    •   FCI-SEQ-NUM

Es fundamental asegurar que la combinación de dichos campos proporcione un identificador univoco
por transacción.

En el caso de repetición de la clave de una operación ya aprobada , Base24 rechazará la nueva
operación.

SAF

En caso de que la entidad no se encuentre en línea y la operación sea autorizada por Link, quedará
registrada en SAF.

En consecuencia, cuando el Banco vuelva a estar en línea se informarán las operaciones aprobadas por
Link mediante el tipo de mensaje 0220.

Es importante destacar que, en caso de reverso, también se grabará en SAF y será informado a la
entidad con el tipo de mensaje 0420.

Tarjetas robadas/perdidas

Link mantendrá las definiciones sobre la operatoria de las tarjetas en estado “2”: perdida y “3”: robada
en las terminales “B3”, “D4”,“D0”,”D1” Y “45” .
                                                                                                Referencia
                          FONDO COMUN DE INVERSION PARA BCBA                                    Vigente
                                                                                                                     09/09/2024
                                                                                                desde
                                                                                                Capítulo                 1
                                 MENSAJERIA HTH Y EXTRACT
                                                                                                Página                   5



3. Transacciones de Base 24

       Cod. Transacción   Tipo-Tran Descripción
   F1XX00                    M       DEBITO ASOCIADO A FCI
   F200XX                    M       CREDITO ASOCIADO A FCI

 XX: corresponde al tipo de cuenta



4. Mensajería Host to Host
   Las transacciones asociadas a esta funcionalidad se enviarán a las entidades mediante mensajería
   Host to Host.


   4.1. Códigos de Transacción

       Cod. Transacción   Tipo-Tran Descripción
   F1XX00                    M       DEBITO ASOCIADO A FCI
   F200XX                    M       CREDITO ASOCIADO A FCI

 XX: corresponde al tipo de cuenta


   4.2. Requerimiento de la Transacción “F1XX00”

   Mensaje tipo 0200

 Bit            Campo            Tipo                   Descripción                               Detalles
P-001    SECONDARY BITMAP        X(16)    Bitmap secundario                            Aquí se informarán como
                                                                                       presentes en el mensaje los
                                                                                       campos que figuran a
                                                                                       continuación.
P-003    PROCESSING CODE          X(6)    Se informa en las siguientes                 Valor fijo “F1XX00”
                                          posiciones:
                                          1-2: código de transacción.
                                          3-4: tipo de cuenta que recibe el débito.
                                          5-6: tipo de cuenta que recibe el crédito.
P-004    TRAN-AMT                 9(12)   Monto de la operación                        Se informa el importe
                                          Formato: 10 enteros + 2 decimales
P-007    TRANSMISSION DATE        9(10)   Fecha y hora de transmisión del mensaje      Sin cambios respecto a la
         AND TIME                                                                      solución actual
P-011    SYSTEMS TRACE            9(6)    Número de mensaje usado para establecer Sin cambios respecto a la
         AUDIT NUMBER                     la correspondencia de una respuesta y su solución actual
                                          original
P-012    LOCAL TRANSACTION        9(6)    Hora local en que comenzó la transacción Sin cambios respecto a la
         TIME                                                                          solución actual
P-013    LOCAL TRANSACTION        9(4)    Fecha calendario en que comenzó la           Sin cambios respecto a la
         DATE                             transacción                                  solución actual
P-015    SETL-DAT                 9(4)    Fecha de negocio a que corresponde la        Sin cambios respecto a la
                                          transacción. Formato mmdd.                   solución actual
P-017    CAPTURE DATE             9(4)    Fecha de negocio en que la transacción       Sin cambios respecto a la
                                          fue procesada                                solución actual
P-032    ACQUIRING                9(11)   Número de Identificación de la institución a Sin cambios respecto a la
         INSTITUTION                      la que pertenece la terminal                 solución actual
         IDENTIFICATION CODE
P-035    TRACK 2 DATA            X(37)    Track 2 de la tarjeta                        Sin cambios respecto a la
                                                                                       solución actual
P-037    RETRIEVAL               X(12)    Número asignado por el originador del        Sin cambios respecto a la
         REFERENCE NUMBER                 mensaje para identificar una transacción.    solución actual
P-041    CARD ACCEPTOR           X(16)    Identificador de la terminal que acepta la   Sin cambios respecto a la
         TERMINAL                         transacción.                                 solución actual
         IDENTIFICATION
                                                                                                Referencia
                         FONDO COMUN DE INVERSION PARA BCBA                                     Vigente
                                                                                                                       09/09/2024
                                                                                                desde
                                                                                                Capítulo                   1
                              MENSAJERIA HTH Y EXTRACT
                                                                                                Página                     6



 Bit          Campo            Tipo                  Descripción                                  Detalles
P-042   CRD-ACCPT-ID-CDE       X(15)   Identificador de la institución dueña de la Sin cambios respecto a la
                                       terminal.                                   solución actual
                                       Siempre relleno con BLANCOS. Para otros
                                       dispositivos que no sean cajeros
                                       automáticos, en este campo se informará
                                       'CIT, lo cual indica que se deberá validar
                                       clave telefónica en lugar de pin de cajero

P-043   CARD ACCEPTOR          X(40)   1-22: Nombre del administrador del Cajero.      Sin cambios respecto a la
        NAME                           23-35: Ciudad del Cajero.                       solución actual
                                       36-38: Estado del Cajero.
                                       39-40: País del Cajero.
P-049   TRANSACTION            9(3)    Código ISO de la moneda                         Sin cambios respecto a la
        CURRENCY CODE                  032 = Pesos                                     solución actual
                                       840 = Dólares
P-052   PERSONAL               X(16)   Clave de identificación personal (PIN) del      Se enviarán 16 “F”.
        IDENTIFICATION                 tarjetahabiente, encriptado por la clave de     Es opcional se configura por
        NUMBER DATA                    comunicación.                                   entidad
P-054   ADD-AMTS              X(023)   1-3:Longitud del campo                          Redefinición utilizada para FCI
                                       4-23: Ver debajo detalle de campo 54
P-060   PRI-RSRVD1-PRVT        X(12)   1-3: Longitud del campo.                        Sin cambios respecto a la
                                       4-7: Siglas institución dueña de la terminal.   solución actual.
                                       8-11: Red lógica de la terminal.
                                       12-15: Diferencia horaria entre hora local
                                       de transacción y hora del sistema.
P-061   PRI-RSRVD2-PRVT        X(13)   El formato es:                                  Sin cambios respecto a la
                                       Posiciones 01-03 = Indicador de longitud.       solución actual
                                       El valor a informar es `013`.
                                       Posiciones 04-07 = Número de la
                                       Institución emisora de la tarjeta.
                                       Posiciones 08-11 = Código que identifica a
                                       la RED. El valor a informar es`PRO1`.
                                       Posiciones 12-15 = Tipos de cuentas
                                       involucradas en la transacción.
                                       Posiciones 16-16 = El valor a informar es
                                       `P`.
P-062   PRI-RSRVD3-PRVT        X(25)   Se informa el tipo de terminal                  Sin cambios respecto a la
                                                                                       solución actual
P-063   PRI-RSRVD4-PRVT        X(16)   El formato es:                                  Sin cambios respecto a la
                                       Posiciones 01-03 = Indicador de longitud.       solución actual
                                       El valor a informar es `016`.
                                       Posiciones 04-19 = Pin Offset.
S-100   RCV-INST               9(11)   El formato es:                                  Sin cambios respecto a la
                                       Posiciones 01-02 = Indicador de longitud.       solución actual
                                       El valor a informar es `11`.
                                        Posiciones 03-13= Valor del campo,
                                       alineado a izquierda y relleno con
                                       BLANCOS.
S-102   ACCOUNT                X(28)   El formato es:                                  Sin cambios respecto a la
        IDENTIFICATION 1               Posiciones 01-02 = Indicador de longitud.       solución actual
                                       El valor a informar es `28`.
                                       Posiciones 03-30 = Valor del campo,
                                       alineado a izquierda y relleno con
                                       BLANCOS.
S-103   ACCOUNT                X(28)   Identificación de la cuenta destino             Sin cambios respecto a la
        IDENTIFICATION 2               El formato es:                                  solución actual
                                       Posiciones 01-02 = Indicador de longitud.
                                       El valor a informar es `28`.
                                       Posiciones 03-30 = Valor del campo,
                                       alineado a izquierda y relleno con
                                       BLANCOS.
S-120   SECNDRY-RSRVD1-        X(33)   El formato es :                                 Sin cambios respecto a la
        PRVT                           Posiciones 01-03 = Indicador de longitud.       solución actual
                                       Fijo "033".
                                       Posiciones 04-28 = Valor del campo,
                                       alineado a izquierda y relleno con blancos.
                                       Posiciones 29-32 = Sucursal del cajero.
                                       Posiciones 33-36 = Región del cajero.
S-126   SECNDRY-RSRVD7-        X(34)   Se informan los tokens.                         Se informa el tipo-tran en el
        PRVT                           Ver debajo detalle de token                     Token “RL”
                                                                                              Referencia
                       FONDO COMUN DE INVERSION PARA BCBA                                     Vigente
                                                                                                                    09/09/2024
                                                                                              desde
                                                                                              Capítulo                  1
                              MENSAJERIA HTH Y EXTRACT
                                                                                              Página                    7



 Bit          Campo           Tipo                   Descripción                               Detalles
S-127   SECNDRY-RSRVD8-       X(43)    El formato es:                              Sin cambios respecto a la
        PRVT                           Posiciones 01-03 = Indicador de longitud.   solución actual
                                       El valor a informar es "043".
                                       Posiciones 04-07 = Indica la región a la
                                       cuál pertenece el ATM, para transacciones
                                       en dólares.
                                       Los valores posibles son:
                                       "0000" = CAPITAL Y GRAN BUENOS
                                       AIRES.
                                       "0001" = USHUAIA.
                                       "0002" = RESTO INTERIOR DEL PAIS.
                                       "0005" = URUGUAY / BRASIL / CIRRUS.
                                       Los cuatro campos siguientes deberán
                                       contener los valores informados en la
                                       consulta de tipo de cambio, si la misma fue
                                       la transacción anterior y dentro del último
                                       minuto. En caso contrario, informar
                                       CEROS.

   4.3. Respuesta del Requerimiento de la Transacción “F1XX00”

   Mensaje tipo 0210

 Bit          Campo           Tipo                   Descripción                               Detalles
P-001   SECONDARY BITMAP      X(16)    Bitmap secundario                            Aquí se informarán como
                                                                                    presentes en el mensaje los
                                                                                    campos que figuran a
                                                                                    continuación.
P-003   PROCESSING CODE        X(6)    Se informa en las siguientes                 Valor fijo “F1XX00”
                                       posiciones:
                                       1-2: código de transacción.
                                       3-4: tipo de cuenta que recibe el débito.
                                       5-6: tipo de cuenta que recibe el crédito
P-004   TRAN-AMT               9(12)   Monto de la operación                        Se informa el importe
                                       Formato: 10 enteros + 2 decimales
P-007   TRANSMISSION DATE      9(10)   Fecha y hora de transmisión del mensaje      Sin cambios respecto a la
        AND TIME                                                                    solución actual
P-011   SYSTEMS TRACE          9(6)    Número de mensaje usado para establecer Sin cambios respecto a la
        AUDIT NUMBER                   la correspondencia de una respuesta y su solución actual
                                       original
P-012   LOCAL TRANSACTION      9(6)    Hora local en que comenzó la transacción Sin cambios respecto a la
        TIME                                                                        solución actual
P-013   LOCAL TRANSACTION      9(4)    Fecha calendario en que comenzó la           Sin cambios respecto a la
        DATE                           transacción                                  solución actual
P-015   SETTLEMENT DATE        9(4)    Fecha de negocio a que corresponde la        Sin cambios respecto a la
                                       transacción                                  solución actual. Link responderá
                                                                                    aquí con el mismo valor que
                                                                                    responderá en el campo P-017.
P-017   CAPTURE DATE           9(4)    Fecha de negocio en que la transacción       Sin cambios respecto a la
                                       fue procesada                                solución actual
P-032   ACQUIRING              9(11)   Número de Identificación de la institución a Sin cambios respecto a la
        INSTITUTION                    la que pertenece la terminal                 solución actual
        IDENTIFICATION CODE
P-035   TRACK 2 DATA          X(37)    Track 2 de la tarjeta                        Sin cambios respecto a la
                                                                                    solución actual
P-037   RETRIEVAL             X(12)    Número asignado por el originador del        Sin cambios respecto a la
        REFERENCE NUMBER               mensaje para identificar una transacción.    solución actual
P-039   RESPONSE CODE          9(2)    00 = Aprobada.                               Sin cambios respecto a la
                                                                                    solución actual.
P-041   CARD ACCEPTOR         X(16)    Identificador de la terminal que acepta la   Sin cambios respecto a la
        TERMINAL                       transacción.                                 solución actual
        IDENTIFICATION
P-045   TRACK 1 DATA          X(76)    Track 1 de la tarjeta                        En caso de que no venga
                                                                                    informado se enviará el texto
                                                                                    “SINTRACK1” seguido de
                                                                                    espacios en blanco hasta
                                                                                    completar el tamaño total del
                                                                                    campo.
                                                                                               Referencia
                        FONDO COMUN DE INVERSION PARA BCBA                                     Vigente
                                                                                                                  09/09/2024
                                                                                               desde
                                                                                               Capítulo                 1
                             MENSAJERIA HTH Y EXTRACT
                                                                                               Página                   8



 Bit          Campo           Tipo                  Descripción                                  Detalles
P-049   TRANSACTION           9(3)    Código ISO de la moneda                         Código de moneda de la cuenta,
        CURRENCY CODE                 032 = Pesos                                     o ceros si la respuesta es
                                      840 = Dólares                                   rechazo.
P-054   ADD-AMTS             X(023)   1-3:Longitud del campo                          Redefinición utilizada para FCI
                                      4-23: Ver debajo detalle de campo 54
P-060   TERMINAL DATA         X(15)   1-3: Longitud del campo.                        Sin cambios respecto a la
                                      4-7: Siglas institución dueña de la terminal.   solución actual
                                      8-11: Red lógica de la terminal.
                                      12-15: Diferencia horaria entre hora local
                                      de transacción y hora del sistema.
P-061   CARD ISSUER           X(16)   1-3: Longitud del campo.                        Sin cambios respecto a la
        AUTHORIZER DATA               4-7: Sigla de la institución emisora de la      solución actual
                                      tarjeta.
S-102   ACCOUNT               X(28)   El formato es:                                  Sin cambios respecto a la
        IDENTIFICATION 1              Posiciones 01-02 = Indicador de longitud.       solución actual
                                      El valor a informar es `28`.
                                      Posiciones 03-30 = Valor del campo,
                                      alineado a izquierda y relleno con
                                      BLANCOS.
S-103   ACCOUNT               X(28)   Identificación de la cuenta destino             Sin cambios respecto a la
        IDENTIFICATION 2              El formato es:                                  solución actual
                                      Posiciones 01-02 = Indicador de longitud.
                                      El valor a informar es `28`.
                                      Posiciones 03-30 = Valor del campo,
                                      alineado a izquierda y relleno con
                                      BLANCOS.
S-120   SECNDRY-RSRVD1-       X(33)   El formato es :                                 Sin cambios respecto a la
        PRVT                          Posiciones 01-03 = Indicador de longitud.       solución actual
                                      Fijo "033".
                                      Posiciones 04-28 = Valor del campo,
                                      alineado a izquierda y relleno con blancos.
                                      Posiciones 29-32 = Sucursal del cajero.
                                      Posiciones 33-36 = Región del cajero.
S-124   SECNDRY-RSRVD5-        X      El formato es:                                  Sin cambios respecto a la
        PRVT                          Posiciones 01-03 = Indicador de longitud.       solución actual
                                      El valor a informar es "001".
                                      Posiciones 04-04 = Los valores posibles
                                      son: "0" = CERO.
                                            " " = BLANCO.
S-125   SECNDRY-RSRVD6-        X      El formato es:                                  Sin cambios respecto a la
        PRVT                          Posiciones 01-03 = Indicador de longitud.       solución actual
                                      El valor a informar es `001`.
                                      Posiciones 04-04 = Los valores posibles
                                      son: `0` = CERO.
                                            `1` = UNO.
                                            `2` = DOS.
S-127   SECNDRY-RSRVD8-       X(43)   El formato es:                                  Sin cambios respecto a la
        PRVT                          Posiciones 01-03 = Indicador de longitud.       solución actual
                                      El valor a informar es "043".
                                      Posiciones 04-07 = Indica la región a la
                                      cuál pertenece el ATM, para transacciones
                                      en dólares.
                                      Los valores posibles son:
                                      "0000" = CAPITAL Y GRAN BUENOS
                                      AIRES.
                                      "0001" = USHUAIA.
                                      "0002" = RESTO INTERIOR DEL PAIS.
                                      "0005" = URUGUAY / BRASIL / CIRRUS.
                                      Los cuatro campos siguientes deberán
                                      contener los valores informados en la
                                      consulta de tipo de cambio, si la misma fue
                                      la transacción anterior y dentro del último
                                      minuto. En caso contrario, informar
                                      CEROS.
                                                                                                Referencia
                         FONDO COMUN DE INVERSION PARA BCBA                                     Vigente
                                                                                                                     09/09/2024
                                                                                                desde
                                                                                                Capítulo                 1
                              MENSAJERIA HTH Y EXTRACT
                                                                                                Página                   9



   4.4. Requerimiento de la Transacción “F200XX”

   Mensaje tipo 0200

 Bit          Campo            Tipo                  Descripción                                  Detalles
P-001   SECONDARY BITMAP       X(16)   Bitmap secundario                               Aquí se informarán como
                                                                                       presentes en el mensaje los
                                                                                       campos que figuran a
                                                                                       continuación.
P-003   PROCESSING CODE        X(6)    Se informa en las siguientes                    Valor fijo “F200XX”
                                       posiciones:
                                       1-2: código de transacción.
                                       3-4: tipo de cuenta que recibe el débito.
                                       5-6: tipo de cuenta que recibe el crédito.
P-004   TRAN-AMT               9(12)   Monto de la operación                        Se informa el importe
                                       Formato: 10 enteros + 2 decimales
P-007   TRANSMISSION DATE      9(10)   Fecha y hora de transmisión del mensaje      Sin cambios respecto a la
        AND TIME                                                                    solución actual
P-011   SYSTEMS TRACE          9(6)    Número de mensaje usado para establecer Sin cambios respecto a la
        AUDIT NUMBER                   la correspondencia de una respuesta y su solución actual
                                       original
P-012   LOCAL TRANSACTION      9(6)    Hora local en que comenzó la transacción Sin cambios respecto a la
        TIME                                                                        solución actual
P-013   LOCAL TRANSACTION      9(4)    Fecha calendario en que comenzó la           Sin cambios respecto a la
        DATE                           transacción                                  solución actual
P-015   SETL-DAT               9(4)    Fecha de negocio a que corresponde la        Sin cambios respecto a la
                                       transacción. Formato mmdd.                   solución actual
P-017   CAPTURE DATE           9(4)    Fecha de negocio en que la transacción       Sin cambios respecto a la
                                       fue procesada                                solución actual
P-032   ACQUIRING              9(11)   Número de Identificación de la institución a Sin cambios respecto a la
        INSTITUTION                    la que pertenece la terminal                 solución actual
        IDENTIFICATION CODE
P-035   TRACK 2 DATA           X(37)   Track 2 de la tarjeta                           Sin cambios respecto a la
                                                                                       solución actual
P-037   RETRIEVAL              X(12)   Número asignado por el originador del           Sin cambios respecto a la
        REFERENCE NUMBER               mensaje para identificar una transacción.       solución actual
P-041   CARD ACCEPTOR          X(16)   Identificador de la terminal que acepta la      Sin cambios respecto a la
        TERMINAL                       transacción.                                    solución actual
        IDENTIFICATION
P-042   CRD-ACCPT-ID-CDE       X(15)   Identificador de la institución dueña de la Sin cambios respecto a la
                                       terminal.                                   solución actual
                                       Siempre relleno con BLANCOS. Para otros
                                       dispositivos que no sean cajeros
                                       automáticos, en este campo se informará
                                       'CIT, lo cual indica que se deberá validar
                                       clave telefónica en lugar de pin de cajero

P-043   CARD ACCEPTOR          X(40)   1-22: Nombre del administrador del Cajero.      Sin cambios respecto a la
        NAME                           23-35: Ciudad del Cajero.                       solución actual
                                       36-38: Estado del Cajero.
                                       39-40: País del Cajero.
P-049   TRANSACTION            9(3)    Código ISO de la moneda                         Sin cambios respecto a la
        CURRENCY CODE                  032 = Pesos                                     solución actual
                                       840 = Dólares
P-052   PERSONAL               X(16)   Clave de identificación personal (PIN) del      Se enviarán 16 “F”.
        IDENTIFICATION                 tarjetahabiente, encriptado por la clave de     Es opcional se configura por
        NUMBER DATA                    comunicación.                                   entidad
P-054   ADD-AMTS              X(023)   1-3:Longitud del campo                          Redefinición utilizada para FCI
                                       4-23: Ver debajo detalle de campo 54
P-060   PRI-RSRVD1-PRVT        X(12)   1-3: Longitud del campo.                        Sin cambios respecto a la
                                       4-7: Siglas institución dueña de la terminal.   solución actual.
                                       8-11: Red lógica de la terminal.
                                       12-15: Diferencia horaria entre hora local
                                       de transacción y hora del sistema.
                                                                                           Referencia
                      FONDO COMUN DE INVERSION PARA BCBA                                   Vigente
                                                                                                                  09/09/2024
                                                                                           desde
                                                                                           Capítulo                   1
                           MENSAJERIA HTH Y EXTRACT
                                                                                           Página                    10



 Bit          Campo         Tipo                 Descripción                                 Detalles
P-061   PRI-RSRVD2-PRVT     X(13)   El formato es:                                Sin cambios respecto a la
                                    Posiciones 01-03 = Indicador de longitud.     solución actual
                                    El valor a informar es `013`.
                                    Posiciones 04-07 = Número de la
                                    Institución emisora de la tarjeta.
                                    Posiciones 08-11 = Código que identifica a
                                    la RED. El valor a informar es`PRO1`.
                                    Posiciones 12-15 = Tipos de cuentas
                                    involucradas en la transacción.
                                    Posiciones 16-16 = El valor a informar es
                                    `P`.
P-062   PRI-RSRVD3-PRVT     X(25)   Se informa el tipo de terminal                Sin cambios respecto a la
                                                                                  solución actual
P-063   PRI-RSRVD4-PRVT     X(16)   El formato es:                                Sin cambios respecto a la
                                    Posiciones 01-03 = Indicador de longitud.     solución actual
                                    El valor a informar es `016`.
                                    Posiciones 04-19 = Pin Offset.
S-100   RCV-INST            9(11)   El formato es:                                Sin cambios respecto a la
                                    Posiciones 01-02 = Indicador de longitud.     solución actual
                                    El valor a informar es `11`.
                                     Posiciones 03-13= Valor del campo,
                                    alineado a izquierda y relleno con
                                    BLANCOS.
S-102   ACCOUNT             X(28)   El formato es:                                Sin cambios respecto a la
        IDENTIFICATION 1            Posiciones 01-02 = Indicador de longitud.     solución actual
                                    El valor a informar es `28`.
                                    Posiciones 03-30 = Valor del campo,
                                    alineado a izquierda y relleno con
                                    BLANCOS.
S-103   ACCOUNT             X(28)   Identificación de la cuenta destino           Sin cambios respecto a la
        IDENTIFICATION 2            El formato es:                                solución actual
                                    Posiciones 01-02 = Indicador de longitud.
                                    El valor a informar es `28`.
                                    Posiciones 03-30 = Valor del campo,
                                    alineado a izquierda y relleno con
                                    BLANCOS.
S-120   SECNDRY-RSRVD1-     X(33)   El formato es :                               Sin cambios respecto a la
        PRVT                        Posiciones 01-03 = Indicador de longitud.     solución actual
                                    Fijo "033".
                                    Posiciones 04-28 = Valor del campo,
                                    alineado a izquierda y relleno con blancos.
                                    Posiciones 29-32 = Sucursal del cajero.
                                    Posiciones 33-36 = Región del cajero.
S-126   SECNDRY-RSRVD7-     X(34)   Se informan los tokens.                       Se informa el tipo-tran en el
        PRVT                        Ver debajo detalle de tokens                  Token “RL”
S-127   SECNDRY-RSRVD8-     X(43)   El formato es:                                Sin cambios respecto a la
        PRVT                        Posiciones 01-03 = Indicador de longitud.     solución actual
                                    El valor a informar es "043".
                                    Posiciones 04-07 = Indica la región a la
                                    cuál pertenece el ATM, para transacciones
                                    en dólares.
                                    Los valores posibles son:
                                    "0000" = CAPITAL Y GRAN BUENOS
                                    AIRES.
                                    "0001" = USHUAIA.
                                    "0002" = RESTO INTERIOR DEL PAIS.
                                    "0005" = URUGUAY / BRASIL / CIRRUS.
                                    Los cuatro campos siguientes deberán
                                    contener los valores informados en la
                                    consulta de tipo de cambio, si la misma fue
                                    la transacción anterior y dentro del último
                                    minuto. En caso contrario, informar
                                    CEROS.

   4.5. Respuesta del Requerimiento de la Transacción “F2XX00”

   Mensaje tipo 0210

 Bit          Campo         Tipo                 Descripción                                 Detalles
                                                                                                Referencia
                        FONDO COMUN DE INVERSION PARA BCBA                                      Vigente
                                                                                                                     09/09/2024
                                                                                                desde
                                                                                                Capítulo                 1
                              MENSAJERIA HTH Y EXTRACT
                                                                                                Página                  11



 Bit          Campo           Tipo                   Descripción                                  Detalles
P-001   SECONDARY BITMAP      X(16)    Bitmap secundario                               Aquí se informarán como
                                                                                       presentes en el mensaje los
                                                                                       campos que figuran a
                                                                                       continuación.
P-003   PROCESSING CODE        X(6)    Se informa en las siguientes                    Valor fijo “F200XX”
                                       posiciones:
                                       1-2: código de transacción.
                                       3-4: tipo de cuenta que recibe el débito.
                                       5-6: tipo de cuenta que recibe el crédito
P-004   TRAN-AMT               9(12)   Monto de la operación                           Se informa el importe
                                       Formato: 10 enteros + 2 decimales
P-007   TRANSMISSION DATE      9(10)   Fecha y hora de transmisión del mensaje      Sin cambios respecto a la
        AND TIME                                                                    solución actual
P-011   SYSTEMS TRACE          9(6)    Número de mensaje usado para establecer Sin cambios respecto a la
        AUDIT NUMBER                   la correspondencia de una respuesta y su solución actual
                                       original
P-012   LOCAL TRANSACTION      9(6)    Hora local en que comenzó la transacción Sin cambios respecto a la
        TIME                                                                        solución actual
P-013   LOCAL TRANSACTION      9(4)    Fecha calendario en que comenzó la           Sin cambios respecto a la
        DATE                           transacción                                  solución actual
P-015   SETTLEMENT DATE        9(4)    Fecha de negocio a que corresponde la        Sin cambios respecto a la
                                       transacción                                  solución actual. Link responderá
                                                                                    aquí con el mismo valor que
                                                                                    responderá en el campo P-017.
P-017   CAPTURE DATE           9(4)    Fecha de negocio en que la transacción       Sin cambios respecto a la
                                       fue procesada                                solución actual
P-032   ACQUIRING              9(11)   Número de Identificación de la institución a Sin cambios respecto a la
        INSTITUTION                    la que pertenece la terminal                 solución actual
        IDENTIFICATION CODE
P-035   TRACK 2 DATA          X(37)    Track 2 de la tarjeta                           Sin cambios respecto a la
                                                                                       solución actual
P-037   RETRIEVAL             X(12)    Número asignado por el originador del           Sin cambios respecto a la
        REFERENCE NUMBER               mensaje para identificar una transacción.       solución actual
P-039   RESPONSE CODE          9(2)    00 = Aprobada.                                  Sin cambios respecto a la
                                                                                       solución actual.
P-041   CARD ACCEPTOR         X(16)    Identificador de la terminal que acepta la      Sin cambios respecto a la
        TERMINAL                       transacción.                                    solución actual
        IDENTIFICATION
P-045   TRACK 1 DATA          X(76)    Track 1 de la tarjeta                           En caso de que no venga
                                                                                       informado se enviará el texto
                                                                                       “SINTRACK1” seguido de
                                                                                       espacios en blanco hasta
                                                                                       completar el tamaño total del
                                                                                       campo.
P-049   TRANSACTION            9(3)    Código ISO de la moneda                         Código de moneda de la cuenta,
        CURRENCY CODE                  032 = Pesos                                     o ceros si la respuesta es
                                       840 = Dólares                                   rechazo.
P-054   ADD-AMTS              X(023)   1-3:Longitud del campo
                                       4-23: Ver debajo detalle de campo 54
P-060   TERMINAL DATA         X(15)    1-3: Longitud del campo.                        Sin cambios respecto a la
                                       4-7: Siglas institución dueña de la terminal.   solución actual
                                       8-11: Red lógica de la terminal.
                                       12-15: Diferencia horaria entre hora local
                                       de transacción y hora del sistema.
P-061   CARD ISSUER           X(16)    1-3: Longitud del campo.                        Sin cambios respecto a la
        AUTHORIZER DATA                4-7: Sigla de la institución emisora de la      solución actual
                                       tarjeta.
S-102   ACCOUNT               X(28)    El formato es:                                  Sin cambios respecto a la
        IDENTIFICATION 1               Posiciones 01-02 = Indicador de longitud.       solución actual
                                       El valor a informar es `28`.
                                       Posiciones 03-30 = Valor del campo,
                                       alineado a izquierda y relleno con
                                       BLANCOS.
S-103   ACCOUNT               X(28)    Identificación de la cuenta destino             Sin cambios respecto a la
        IDENTIFICATION 2               El formato es:                                  solución actual
                                       Posiciones 01-02 = Indicador de longitud.
                                       El valor a informar es `28`.
                                       Posiciones 03-30 = Valor del campo,
                                       alineado a izquierda y relleno con
                                       BLANCOS.
                                                                                               Referencia
                      FONDO COMUN DE INVERSION PARA BCBA                                       Vigente
                                                                                                                      09/09/2024
                                                                                               desde
                                                                                               Capítulo                   1
                              MENSAJERIA HTH Y EXTRACT
                                                                                               Página                    12



 Bit          Campo            Tipo                  Descripción                                 Detalles
S-120    SECNDRY-RSRVD1-        X(33)   El formato es :                               Sin cambios respecto a la
         PRVT                           Posiciones 01-03 = Indicador de longitud.     solución actual
                                        Fijo "033".
                                        Posiciones 04-28 = Valor del campo,
                                        alineado a izquierda y relleno con blancos.
                                        Posiciones 29-32 = Sucursal del cajero.
                                        Posiciones 33-36 = Región del cajero.
S-124    SECNDRY-RSRVD5-         X      El formato es:                                Sin cambios respecto a la
         PRVT                           Posiciones 01-03 = Indicador de longitud.     solución actual
                                        El valor a informar es "001".
                                        Posiciones 04-04 = Los valores posibles
                                        son: "0" = CERO.
                                              " " = BLANCO.
S-125    SECNDRY-RSRVD6-         X      El formato es:                                Sin cambios respecto a la
         PRVT                           Posiciones 01-03 = Indicador de longitud.     solución actual
                                        El valor a informar es `001`.
                                        Posiciones 04-04 = Los valores posibles
                                        son: `0` = CERO.
                                              `1` = UNO.
                                              `2` = DOS.
S-126    SECNDRY-RSRVD7-        X(34)   Se informan los tokens.                       Se informa el tipo-tran en el
         PRVT                           Ver debajo detalle de tokens                  Token “RL”
S-127    SECNDRY-RSRVD8-        X(43)   El formato es:                                Sin cambios respecto a la
         PRVT                           Posiciones 01-03 = Indicador de longitud.     solución actual
                                        El valor a informar es "043".
                                        Posiciones 04-07 = Indica la región a la
                                        cuál pertenece el ATM, para transacciones
                                        en dólares.
                                        Los valores posibles son:
                                        "0000" = CAPITAL Y GRAN BUENOS
                                        AIRES.
                                        "0001" = USHUAIA.
                                        "0002" = RESTO INTERIOR DEL PAIS.
                                        "0005" = URUGUAY / BRASIL / CIRRUS.
                                        Los cuatro campos siguientes deberán
                                        contener los valores informados en la
                                        consulta de tipo de cambio, si la misma fue
                                        la transacción anterior y dentro del último
                                        minuto. En caso contrario, informar
                                        CEROS.



   4.6. Redefinición del campo 54 (ADD-AMTS)

   Nombre del campo               Descripción                                                       Atributo
   LONGITUD                       Longitud del campo 54. El valor a informar es “120”.              9(3)
   FCI
             NRO-SOLICITUD
                   FIID           Dato conformado por HB                                            X(04)
                   CANAL          Código correspondiente al canal                                   X(02)
                   CODIGO-FCI     FCI seleccionado                                                  X(05)
                   TIPO-OPER      Tipo de operación:                                                X(01)
                                  “S”: suscripción
                                  “A”: anulación
                   FCI-SEQ-                                                                         X(07)
                                  Número secuencial
                   NUM
             CBU                  Nro. De CBU asociado a la cuenta de la trx.                       X(22)
             NRO-                 Dato definido por el banco                                        X(40)
             CUOTAPARTISTA
   FILLER                         Uso Futuro. Se informarán BLANCOS                                 X(39)



   4.7. Descripción del campo 126
                                                                                     Referencia
                        FONDO COMUN DE INVERSION PARA BCBA                           Vigente
                                                                                                    09/09/2024
                                                                                     desde
                                                                                     Capítulo               1
                             MENSAJERIA HTH Y EXTRACT
                                                                                     Página                 13




Descripción de Tokens:

Los tokens son datos específicos que pueden ser informados en el campo 126. Cuando se quiere
agregar un token, el sistema agrega el header de tokens y a continuación los tokens de la transacción.

Header de tokens:

El header de tokens se agrega al mensaje cuando se incorpora el primer token y se actualiza cada
vez que un token subsecuente se agrega.

Contiene los campos que se detallan a continuación:

 Nombre                     Formato               Descripción
 Delimitador                X(01)                 Valor fijo “&”
 Filler                     X(01)                 “”
                                                  Indica la cantidad de tokens informados en el
                                                  mensaje.
 Cantidad de Tokens         X(05)                 El header es considerado un token más, es decir, si
                                                  el campo contiene el valor 00002, indicando que hay
                                                  dos tokens en el mensaje; el header y uno adicional.
                                                  Indica la longitud total de la información de todos los
 Longitud                   X(05)                 tokens; la longitud total del header, más la longitud
                                                  de cada token adicional adherido al mensaje.


Tokens:

Los tokens incluidos en el mensaje se informan luego del header de tokens. Cada uno de ellos
presenta el formato token header + token Data.

TOKEN “RL”

 Token Header
 Campo
                                      Formato         Valor        Descripción
 EYE CATCHER
                                      X(02)           “! ”         Identificador literal.

 TKN-ID
                                      X(02)           “RL”         Nombre o Identificador único de la
                                                                   estructura de datos.
 TKN-LGTH                                                          Indica el largo total de los datos
                                      9(05)           “00012”      informado en el campo (alineado con
                                                                   ceros a izquierda).
 USER-FLD
                                      X(01)           “”           Blanco.



 Token Data

 Campo                                Formato         Descripción

 CANT-TAGS                             X(02)          Indica la cantidad de Tags informados en el
                                                      Token.
   TAGS
            DELIMITADOR DE TAG         X(01)          Valor: “|” (pipe)

               TAG-ID                 X(04)           Códigos de TAG:
                                                      “TYP1”: Tipo de transacción
                                                                                                 Referencia
                      FONDO COMUN DE INVERSION PARA BCBA                                         Vigente
                                                                                                                      09/09/2024
                                                                                                 desde
                                                                                                 Capítulo                  1
                               MENSAJERIA HTH Y EXTRACT
                                                                                                 Página                    14



               TAG-LGTH                  X(02)                  Indica el largo del dato informado en el tag.
               TAG-VALUE                 X(01)                  Valor contenido en el Tag: “M”
               DELIMITADOR DE TAG        X(01)                   Valor : “|” (pipe)
     FILLER                              X(01)                  Uso Futuro



5   Archivo Diario de Transacciones (Extract de TLF)

Las transacciones asociadas a esta funcionalidad quedarán registradas en el archivo Extract.
Los campos estándar para considerar serán los siguientes:

    POSIC.
               NIVEL NOMBRE DEL CAMPO            CONTENIDO DEL CAMPO                                      TIPO PICTURE
    RELAT.
     034-057    04    TERM                       IDENTIFICACION DE LA TERMINAL
     034-037    06    LN                         Sin modificaciones.                                      AN    X(04)
     038-041    06    FIID                       Sin modificaciones.                                      AN    X(04)
     042-057    06    TEM-ID                     Sin modificaciones.                                      AN    X(16)
     058-096    04    CRD                        IDENTIFICACION DE LA TARJETA
     058-061    06    LN                         Sin modificaciones.                                            X(04)
     062-065    06    FIID                       Sin modificaciones.                                            X(04)
     066-093    06    PAN                        Número de Tarjeta, tal cual aparece en el                      X(28)
                                                 TRACK 2 de la tarjeta.

     094-096    06    MBR-NUM                    Sin modificaciones.                                        N   9(03)
     …………..     ….    ……………………………………….           …………………………………................................              …   …….
     247-252    04    TRAN-CDE                   Código de Transacción
     247-248    06    T-CDE                      Código de transacción.                                   AN    X(02)
                                                 Valores posibles: “F1”
                                                                   “F2”
     249-250    06    T-FROM                     Tipo de Cuenta Desde.                                    AN    X(02)
     251-252    06    T-TO                       Tipo de Cuenta Hasta.                                    AN    X(02)
     …………..     ….    ……………………………………….           …………………………………................................            …     …….
     281-281    04    TIPO-TRAN                  Ex campo TIPO-DEP.                                       AN    X(01)
                                                 Se informará el valor “M”
     …………..     ….    ……………………………………….           …………………………………................................              …   …….
     379-381    04    RESP-CDE                   Código de respuesta.
     379-379    06    RESP-BYTE-1                Los valores posibles son:                                AN    X(01)
                                                 0: Tarjeta No capturada.
                                                 1: Tarjeta Capturada.
     380-381    06    RESP-BYTE-2                (Ver sección “Códigos de Respuesta”)                     AN    X(02)
     …………..     ….    ………………………………………. …………………………………................................                        …   …….
     631-877    06    DATOS-TRANSACCIONALES
     631-877    06    FONDO-COMUN-          Redefines DATOS-TRANSACCIONALES                               AN      X(247)
                      INVERSION             (Se utiliza para operaciones de Fondos
                                            Comunes de Inversión)
     631-634    08    CBU                   Nro. De CBU asociado a la cuenta de la trx.                   AN       X(22)
     678-877    08    FILLER                Campo No utilizado.                                           AN      X(225)
     …………..     ….    ………………………………………. …………………………………................................                      …     …….
     899-899    06    FILLER                Sin uso                                                       AN    X(01)
                                                                                         Referencia
                      FONDO COMUN DE INVERSION PARA BCBA                                 Vigente
                                                                                                              09/09/2024
                                                                                         desde
                                                                                         Capítulo                 1
                                MENSAJERIA HTH Y EXTRACT
                                                                                         Página                   15



     900-901    06    EMV-STATUS                  Los valores posibles son:                       AN      X(02)
                                                  “00”: Terminal NO EMV
                                                  “01”: Terminal EMV – Tarjeta NO EMV
                                                  (Sin datos EMV – Manual, ingreso manual)
                                                  “02”: Terminal EMV – Tarjeta NO EMV
                                                  (Sin datos EMV – Magstripe, ingreso por
                                                  Banda magnética en terminal EMV)
                                                  “04”: Terminal EMV – Tarjeta EMV
                                                  (Sin datos EMV – Fallback to Magstripe,
                                                  ingreso por Banda magnética a causa de
                                                  Fallback)
                                                  “05”: Terminal EMV – Tarjeta EMV
                                                  (Con datos EMV – Chip)
                                                  “07”: Operación Contactless
                                                  “08”: Terminal EMV – Tarjeta EMV
                                                  (Con datos EMV – Paypass-MappedContactless,
                                                  ingreso contactless de tarjeta
                                                  Paypass)
                                                  “09”: Operación sin Tarjeta con Huella.
                                                  “10”: Terminal NO EMV – Tarjeta EMV
                                                  (Sin datos EMV - Magstripe, ingreso por
                                                  Banda magnética)
                                                  “99”: Ninguna condición anterior
     902-902    06    ES-CHIP                     Indicador de tarjeta Chip.                        AN    X(01)
                                                  valores posibles:
                                                  S: Es tarjeta Chip
                                                  N: No es tarjeta Chip


NOTA: Los valores de offset informados toman como base la documentación incluida en la NPC002-001
(Manual del Sistema Base 24), donde en su Capítulo III.4 (Ciclo de Negocios\Extract R6) se especifica que
la posición 1 de offset corresponde al primer byte del campo denominado PREFIX, por consiguiente y para
mayor comprensión, en el siguiente gráfico se detalla el formato del Extract que debe ser tenido en cuenta.
                     TAPE HEADER              FILE HEADER                                       BLOQUES




 000154000072THA1605311700000.... 000076FH ..D1Y
 000908000902DR02123.......................00000000000000000000N
 000908000902DR02123.....................0000000000000000000000N
 000908000902DR02123.....................0000000000000000000000N
 ...............................................................
                          DATA RECORD
 000908000902DR02123.....................0000000000000000000000N
 000908000902DR02123.....................0000000000000000000000N
 000178000086FTTLF     ...........000000001I000086TT...000019

                                   FILE TRAILER                                       TAPE TRAILER




     PREFIX CHARACTER DE BLOQUE         PREFIX CHARACTER DE REGISTRO
                (6 BYTES)                              (8 BYTES)
       No forma parte del OFFSET            Incluye el BYTE 1 del OFFSET
          del diseño de registro       del diseño del registro correspondiente
                                                                                             Referencia
                                       FONDOS COMUNES
                                                                                             Vigente desde      15/07/2024
                                                                                             Capítulo                1
                                 MENSAJERIA HTH Y EXTRACT
                                                                                             Página                  16




5. Historial de Cambio
Se informan las últimas 5 (cinco) modificaciones realizadas sobre el documento.

    2   Fecha de Modificación:    09/09/2024
        Cambios efectuados:       Se corrige la longitud del campo “CANAL” dentro de la redefinición del CAMPO 54.
                                  Se corrige descripción del campo “CBU” del extract.
        Modificado por:           Servicios Core Transaccional
    1   Fecha de Modificación:    15/07/2024
        Cambios efectuados:       Versión original del documento.
        Modificado por:           Servicios Core Transaccional
