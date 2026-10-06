> **CONFIDENCIAL — Red LINK.** Uso interno exclusivo. NO publicar en la sección Documentación Técnica ni compartir con terceros.

# LINK — C-X-1-2-3_Conex_HtoH_ISO8583_Tipo de Msje_Fto de Msje



				X.		CONEXION HOST TO HOST - ISO 8583

				X.1.		INTRODUCCION

				X.2.		TIPOS DE MENSAJES

				X.3.		FORMATOS DE MENSAJES

				X.4.		FORMATOS DE REGISTRO

				X.5.		CODIGOS DE TRANSACCIONES

				X.6.		CODIGOS DE RESULTADO

				X.7.		CODIGOS DE TIPOS DE CUENTA

				X.8.		CODIGOS DE INDICATIVO DE REVERSOS

El proceso HOST INTERFACE es requerido por el sistema BASE-24 para coordinar y controlar todo el tráfico de mensajes que tiene lugar entre el citado sistema y los computadores (DPC) vinculados a la RED.

La transmisión  consiste en enviar  un mensaje de  requerimiento de transacción a un computador HOST y recibir un mensaje de respuesta a la transacción con la aprobación o el rechazo a la misma.

Las transacciones de reverso también pueden transmitirse a un computador HOST.

Provee la función de STORE-AND-FORWARD, que permite que los mensajes que son autorizados por el sistema BASE-24 mientras el HOST no se encuentra disponible, sean grabados en un archivo para su posterior envío al HOST, cuando se encuentre disponible nuevamente.

Los mensajes de requerimientos de transacciones y de STORE-AND-FORWARD se llevan a cabo en proceso de tiempo real por el módulo HOST INTERFACE.

Un pedido de transacción es un mensaje que tiene un formato de requerimiento que será autorizado por el computador HOST.

SECUENCIA DE MENSAJES DE TRANSACCION

							(1) REQUEST

							(2) REPLY

En la figura se puede apreciar el módulo HOST INTERFACE en el entorno del sistema BASE-24, enviando un requerimiento de transacción a un computador HOST.

En respuesta al requerimiento de transacción, el computador HOST envía un mensaje de respuesta de la transacción.

Los roles del módulo HOST INTERFACE y la aplicación desarrollada en el computador HOST pueden invertirse, con el computador HOST enviando mensajes de requerimiento y el sistema BASE-24 transmitiendo la respuesta, en el caso de haber cajeros conectados al citado computador HOST.

Por esta razón, definimos dos términos para el desarrollo de este documento:

REQUESTER:	
Es el programa que transmite un mensaje de requerimiento de transacción o control.
En nuestro caso, será el módulo HOST INTERFACE del sistema BASE-24.

RESPONDER:
Es el programa que recibe el mensaje de requerimiento de transacción o control y transmite la respuesta.
En nuestro caso, será el computador HOST de la Institución.

Además de los mensajes de transacciones se pueden transmitir mensajes para establecer y mantener la conexión de comunicación y mensajes de comandos para realizar funciones especiales entre el módulo HOST INTERFACE y el computador HOST.

La secuencia de mensajes posibles de requerimiento y de respuesta de transacciones entre el módulo HOST INTERFACE y el computador HOST son:

-  Mensajes de CONTROL.

-  Mensajes de TRANSACCIONES EN TIEMPO REAL.

-  Mensajes de REVERSO DE TRANSACCIONES EN TIEMPO REAL.

-  Mensajes de TRANSACCIONES DE STORE-AND-FORWARD.

-  Mensajes RECHAZADOS.

Cada mensaje tiene un código de tipo incluido en el mismo, que identifica el tipo de mensaje en sí.

Un mensaje enviado por el módulo HOST INTERFACE, espera una respuesta al mensaje enviado que debe corresponderse con el código de tipo que posee el mensaje de respuesta.

Los tipos de códigos para cada mensaje son:

REQUERIMIENTO
CODIGO DE TIPO

SECUENCIA DE TRANSACCION
RESPUESTA 
CODIGO DE TIPO

0800
Control

0810

0200
Transacciones en Tiempo Real

0210

0420
Reverso de Transacciones en Tiempo Real
0430

0220
Transacciones de STORE-AND-FORWARD
0230

0221
Transacciones de STORE-AND-FORWARD, debió ser reenviada
0230

0421
Reverso de Transacción que debió ser reenviada.
0430

9XXX
Mensaje rechazado donde XXX puede ser 200,220,420 por ej.

El mensaje de respuesta también contiene un código de resultado que será examinado por el sistema BASE-24.

MENSAJES DE CONTROL

Este mensaje se envía a través del módulo HOST INTERFACE al computador HOST para establecer y mantener la comunicación entre ambos o para que el computador HOST ejecute alguna función en particular.

Ante este mensaje, el computador HOST deberá responder con un mensaje de control, indicando si está comunicado con el sistema BASE-24 o si se habilitó para la función requerida.

SECUENCIA DE MENSAJES DE CONTROL

						(0800) CONTROL REQUEST

						(0810) CONTROL REPLY

MENSAJES DE TRANSACCIONES EN TIEMPO REAL

Las transacciones en tiempo real son mensajes de transacciones procesadas por el sistema BASE-24, mientras un cliente en un ATM o algún otro dispositivo conectado al sistema, espera una respuesta a su requerimiento.

La transacción es un requerimiento (REQUEST) solicitado por el cliente desde un ATM al sistema BASE-24, el cual será enviado al computador HOST de la Institución mediante el módulo HOST INTERFACE para su autorización.

El mensaje de respuesta al requerimiento de transacción (REPLY) indicará si la transacción fue aceptada o rechazada por el computador HOST, mediante el código de resultado.

Si la transacción es aceptada, el código de resultado será ceros. Caso contrario, el sistema BASE-24 tomará una acción de acuerdo al valor indicado en el código de resultado.

Una de las características de este módulo es el sensor de errores mientras espera una respuesta al requerimiento. Estos errores pueden ser de TIME-OUT o los producidos por errores de comunicación. 

Cuando se produce un error, se realiza un control del total de errores ocurridos contra el máximo permitido, especificado en la configuración del sistema. Si se supera dicho margen, el módulo HOST INTERFACE marcará en sus tablas internas que el computador HOST se encuentra inoperable.

Toda transacción que ingrese al sistema, estando el computador HOST inoperable, será rechazada.

Usando el método de autorización STAND-IN, el sistema BASE-24 podrá autorizar localmente la transacción, siendo registrada en el archivo STORE-AND-FORWARD.

SECUENCIA DE MENSAJES DE TRANSACCION EN TIEMPO REAL

	
								(0200) Tx REQUEST

								(0210) Tx REPLY

MENSAJES DE REVERSO DE TRANSACCIONES EN TIEMPO REAL

Para realizar un reverso a una transacción en tiempo real que fue previamente autorizada por el computador HOST y no completada satisfactoriamente, se transmite un mensaje de reverso de transacciones en tiempo real.

Un reverso ocurre después de recibir la aprobación de la transacción por parte del computador HOST y la transacción no puede completarse debido a alguna condición.

Por ejemplo:

-  Errores de comunicación entre el ATM y el sistema BASE-24.

-  El cliente canceló la transacción.

-  El cliente ó el ATM producen un TIMEOUT.

-  Fallas en los mecanismos del ATM.

La razón del reverso es especificada en el mensaje, de acuerdo a los códigos definidos a ese fin.

NOTA:

En el caso que no se reciba el ack del mensaje 0420, el sistema envía nuevamente el reverso exactamente con el mismo formato salvo que el tipo de mensaje lo modifica a 0421, indicando de dicha forma que el mensaje fue reenviado. 
En el caso que tampoco se reciba el ack del mensaje 0421, dicho mensaje volverá a enviarse como 0421.
El ack al que se hace referencia puede ser de protocolo, si el host no contempla mensajes 0430 o de aplicación si trabaja con mensajes 0430.

SECUENCIA DE MENSAJES DE REVERSO

				Tx REQUEST				(0200) Tx REQUEST

				 Tx APROBADA			(0210) Tx REPLY

								(MONTO ORIGINAL APROBADO)

				COMPLETION				(0420) REVERSO REQUEST
				 (NUEVO MONTO)			(NUEVO MONTO)

OTRA SECUENCIA DE MENSAJES DE REVERSO POSIBLE

				Tx REQUEST				(0200) Tx REQUEST

                  Reverso                    (0420) REVERSO REQUEST
			      (TIME OUT)			      (TIME OUT)
				
                  Tx APROBADA			(0210) Tx REPLY

								(MONTO ORIGINAL APROBADO)

                  Reverso                    (0420) REVERSO REQUEST
			      (210 TARDIO)			(210 TARDIO)

				FORZADO				(0220) FORZADO
				  (ON OFF)			     (ON OFF)
                  
                  Reverso                    (0420) REVERSO REQUEST
			      (NUEVO MONTO)			(NUEVO MONTO)

En principio los mensajes deberían llegar en tiempo, caso contrario, el host debe proceder de la siguiente manera:
   
CLAVE DE REVERSOS : identificación de la terminal + Fecha + Hora + número de secuencia

Como se ve en el ejemplo, una transacción puede tener hasta 3 reversos, según la secuencia que se produzca de acuerdo a los timers y fallas de hardware.
Mensajes 420: 

    A- Se genera cuando la respuesta del host no llego a Link en el timer especificado. Si el host tiene un requerimiento aprobado con esa clave, se deberá reversar. En dicho caso el codigo de reverso es 68 (Time out) y el campo 43 contendrá siempre en los primeros 38 bytes la leyenda : “** REVERSAL FOR LATE/UNSOL RESPONSE **”.
    B- Si el mensaje se genera por un 210 tardio, el mensaje no sera procesado por ser tardio. En dicho caso el codigo de reverso es 68 (Time out) y el campo 43 contendrá siempre en los primeros 38 bytes la leyenda : “** REVERSAL FOR LATE/UNSOL RESPONSE **”. Si ya se aplico el reverso al mensaje 0200 porque hubo time out y la transacción no quedo aprobada, no debe volver a reversarse. 
    C- Si el mensaje se genera por un reverso de hardware de ATM, porque no tenia suficientes billetes por ejemplo, el código de reverso respectivo será 32 (reverso parcial) y el campo 43 contendrá los datos respectivos del ATM. Si la transacción fue aprobada ON line, quiere decir que debe aplicarse al 0210, caso contrario, si fue autorizada OFF line, se envió el 0220 y debe aplicarse al 0220.
MENSAJES DE STORE-AND-FORWARD

Las transacciones de STORE-AND-FORWARD son almacenadas por el sistema BASE-24 en el archivo STORE-AND-FORWARD.

Estas serán enviadas al computador HOST, de acuerdo a la opción elegida, para ser registrada.

Se pueden almacenar en el archivo STORE-AND-FORWARD las siguientes transacciones:

-  Transacciones de reverso.

Se almacenan las transacciones de reverso y luego se envían al computador HOST.

-  Transacciones en tiempo real.

Estas transacciones ocurren cuando el método de autorización STAND-IN es utilizado por la Institución y el computador HOST no está disponible para autorización, ya sea por caídas o desconexión por parte de la Institución para otros procesos.

NOTA:

En el caso que no se reciba el ack del mensaje 0420 o 0220 de STORE-AND-FORWARD, el sistema envía nuevamente el mensaje exactamente con el mismo formato salvo que el tipo de mensaje lo modifica a 0421 o 0221 según corresponda, indicando de dicha forma que el mensaje fue reenviado. 
En el caso que tampoco se reciba el ack de dichos mensajes (0421 o 0221), los mismos volverán a enviarse como 0421 o 0221 según corresponda.
El ack al que se hace referencia puede ser de protocolo, si el host no contempla mensajes 0430 o 0230 o de aplicación si trabaja con mensajes 0430 o 0230.
Alguna de las opciones para transmisión de las transacciones son:

-  El módulo HOST INTERFACE transmitirá las transacciones de STORE-AND-FORWARD al computador HOST cuando se encuentre disponible.

-  El módulo HOST INTERFACE transmitirá las transacciones intercaladas con las de tiempo real o transmitirá todas las existentes en forma sucesiva, antes de enviar las de tiempo real.

-  El módulo de HOST INTERFACE podrá configurarse para enviar las transacciones de STORE-AMD-FORWARD de a una por vez o tantas como estaciones de salida tenga configuradas. En este último caso, el HOST deberá preveer que puede recibir un reverso de una transacción antes que su STORE-AND-FORWARD.

Los formatos de mensajes de intercambio entre el módulo HOST INTERFACE y el computador HOST están compuestos por una serie de datos comunes y, otros diferenciados, según el tipo de mensaje o el tipo de transacción.

Todos los datos numéricos se muestran en formato DISPLAY.

Los protocolos de comunicaciones que pueden utilizarse para conectar BASE-24 y el computador HOST son: BSC, SDLC y X.25.

En el caso del protocolo de comunicaciones TCP/IP, se debe tener en cuenta que en un paquete TCP pueden venir mas de un mensaje ISO. El mensaje TCP tiene un header, que es el que ven a continuación en el ejemplo, pero el protocolo a la aplicación, le hace llegar los datos puros (En el ejemplo: Associated Data -    70 bytes)

Entonces, de esos datos puros, hay que sacar los 2 bytes (son bytes) (En el ejemplo son .D)
.D en hexa es 0044 en ascii (que se ve en el ejemplo) que pasados a decimal son 68 y esa es la longitud del mensaje ISO que continua. 

Es decir, la aplicación debe leer 2 bytes, pasarlos a decimal y leer nuevamente por esa longitud obtenida. 
Luego debe volver a leer arbitrariamente 2 bytes, pasarlos nuevamente a decimal y volver a leer por la longitud obtenida. 
Y asi sucesivamente.

Si fueran 2 mensajes y medio ISO en un paquete TCP que sucede?

Cuando va a leer el 3er mensaje ISO, tendría que leer 68 (por ejemplo) y resulta que para terminar el paquete TCP tiene 30, entonces cuando recibe el próximo paquete lo primero que hace es lee 38 que le faltan para terminar el 3er mensaje ISO del paquete anterior y luego vuelve a iniciar el ciclo leyendo 2 bytes de longitud, convirtiéndolos a decimal para volver a leer por la longitud obtenida.

Recordar que son 2 bytes.

A continuación se muestra un ejemplo:

05/27/2002 15:35:23.641725 >000.010651 #18135          IP Out
Line   441 of \COMM.$LANA.T9551AFN.IPOUTC (15:18:18 on Mar 27 2001)
Object : Subnet         #SN1
IP Header :  45 00 00 6E 32 96 00 00 1E 06 93 1D C8 C8 04 09 0A 03 00 03
IP Version: 4   Hdr Len: 20  TTL: 30  TOS: 0    Xsum: 37661   Total Len: 110
Flags: (none)   ID: 12950 at Offset 0     Protocol: 6     (TCP)
Dest IP Address: 10.3.0.3                 Source IP Address: 200.200.4.9

TCP Header:  29 AE 10 6F 57 90 25 EF 09 AC 88 96 50 18 20 00 B0 00 00 00
Src Port: 10670 Seq: 1469064687    Window: 8192   Offset: 20    UrgPtr: 0
Dst Port: 4207  Ack: 162302102     Xsum  : 45056  Flags : ACK,PSH

                    Associated Data -    70 bytes
 000:   0044   4953   4F30   3034    3030   3030   3430   3038 .DISO00400004008
 008:   3030   3832   3230   3030    3030   3030   3030   3030 0082200000000000
 010:   3030   3034   3030   3030    3030   3030   3030   3030 0004000000000000
 018:   3030   3035   3237   3135    3335   3233   3030   3030 0005271535230000
 020:   3634   3330   3103                                     64301.          

MENSAJES RECHAZADOS:

Si el proceso recibe un mensaje ISO 0210 , lo parsea y verifica que los campos informados en el bitmap esten contenidos en el mensaje, también valida que los campos mandatorios existan, caso contrario no lo procesa.
Como no lo procesa, de alguna manera le avisa el proceso que le envió el mensaje, que dicha transacción no será tomada en cuenta. Entonces, devuelve el mensaje 0210 como 9210 indicando que ha sido rechazado.

FORMATO DE LOS MENSAJES:

Los mensajes constan de los siguiente campos:

    • encabezado literal que indica el inicio del mensaje
    • encabezado numérico
    • identificador del tipo de mensaje
    • bitmap primario que indica cuáles de los 64 primeros campos se incluyen en el mensaje
    • campos correspondientes al mensaje en orden numérico, de los cuales el primer campo es el bitmap secundario que indica cuáles de los 64 segundos campos se incluyen en el mensaje.

BITMAPS:

Cada bitmap, tanto el primario como el secundario, son campos alfanuméricos de 16 caracteres. Cada caracter hexadecimal se traduce a binario para que cada bit indique si el campo está incluido en el mensaje (1) o no (0). La posición de cada bit en todo bitmap representa el número del campo a analizar.

Cabe destacar que el bitmap secundario es opcional. En el bitmap primario se indica si el bitmap secundario (campo 64), está incluido en el mensaje o no con el bit número 1.

Es decir, el bitmap primario 9000 0000 0000 0000 se lee como que los campos que van en el mensaje son los campos número 1 y 4 (de los 64 primeros campos). 

Si el bitmap secundario es 1000 0001 0000 0000 se lee como que los campos que van en el mensaje son los campos número 68 y 96 (de los 64 segundos campos).

Por consiguiente, si en un mensaje se tienen estos bitmaps, esto quiere decir que además de los cuatro campos del encabezado del mensaje, se tendrá el bitmap secundario, el campo 4, el campo 68 y el campo 96.

CAMPOS OBLIGATORIOS DE CADA MENSAJE:

Nombre del campo
Atributo
start-of-base24-header-indicator
X(3)
base24-header
9(9)
message-type-identifier
9(4)
primary-bit-map
X(16)

Atributo: 

Indica el tipo del campo, y su longitud. En el caso de campos de longitud variable (..), el atributo indica su tamaño máximo. Los tipos de datos pueden ser por ejemplo: 

    • X(10) - alfanumérico de 10.
    • 9(4) - numérico de 4.
    • 9(4)v99 - numerico de 6 posiciones de las cuales 2 son decimales
    • .. - campo de longitud variable.
    • g X(100)- grupo o estructura compuesta de caracteres alfanuméricos unicamente la cual se detalla en la descripción de cada mensaje.
    • g 9(100)- grupo o estructura compuesta de caracteres numéricos unicamente la cual se detalla en la descripción de cada mensaje.
    • g 150- grupo o estructura compuesta de caracteres alfanuméricos o numéricos la cual se detalla en la descripción de cada mensaje.
    • g .. 234 - indica que el campo es de longitud variable, y que su estructura puede contener caracteres alfanuméricos o numéricos, la cual de detalla en la descripción de cada mensaje.

Formato:

En el caso de campos de longitud variable, el formato indica que se debe anteponer al campo respectivo, la longitud del mismo, usando tantos caracteres como se necesiten para indicar la longitud máxima del campo .

La longitud máxima del campo se indica en el atributo. Los dígitos utilizados para informar la longitud del campo, no están incluidos en la longitud informada en el atributo respectivo.

La longitud de los campos de longitud variable, deben ser tomada sin excepción del mensaje dado que los valores informados en este manual pueden sufrir modificaciones que no debieran afectar el funcionamiento de vuestro sistema.

Ejemplos:

Campo 32 longitud máxima ..9(11) y se define como LLVAR 9(11). En total ocupa 13 caracteres, en los 2 primeros dígitos se informa la longitud, y en el resto los datos.

Campo 48 longitud máxima ..9(100) y se define como g..(100). En un mensaje cualquiera, se podría informar:
“044xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx” , lo que indica que se informarán 44 bytes con datos. En total el campo y su longitud ocupan 47 bytes.

BITMAPS EN ORDEN NUMERICO: 

Bit
Nombre del campo
Formato
Atributo
1
secndry-bit-map

X(16)
2 
pan
LLVAR
..9(19)
3
proc-cde

g 9(6)
4 
tran-amt

9(12)
5 
srtl-amt

9(12)
6
bill-amt

9(12)
7 
xmit-dat-tim
mmddhhmmss
9(10)
8
bill-fee

9(8)
9 
setl-conv-rat

9(8)
10
bill-conv-rat

9(8)
11 
trace-num

9(6)
12 
tran-tim
hhmmss
9(6)
13
tran-dat
yymm
9(4)
14
exp-dat
yymm
9(4)
15
setl-dat
mmdd
9(4)
16
conv-dat
mmdd
9(4)
17
cap-dat
mmdd
9(4)
18
mrcht-typ-cde

9(4)
19
acq-inst-cntry-cde

9(3)
20
pan-ext-cntry-cde

9(3)
21
frwd-inst-cntry-cde

9(3)
22
entry-mde

9(3)
23
mbr-num

9(3)
24 
netw-intl-id

9(3)
25
pt-tran-spcl-cde

9(2)
26
pos-pin-capture-cde

9(2)
27
auth-id-resp-len

9(1)
28
tran-fee

g 9
29
setl-fee

g 9
30
tran-proc-fee

g 9
31
setl-proc-fee

g 9
32
acq-inst-id
LLVAR
..9(11)
33
frwd-inst-id
LLVAR
..9(11)
34
pan-extnd
LLVAR
..X(28)
35
track 2 
LLVAR
..X(37)
36
track 3 
LLLVAR
..X(104)
37
retrvl-ref-num

g X(12)
38 
auth-id-resp

X(6)
39
resp-cde

X(2)
40
service-cde

X(3)
41
term-id

X(16)
42
crd-accpt-id-cde

X(15)
43
crd-accpt-name-loc

g X(40)
44
resp-data
LLVAR
..X(25)
45
track 1 
LLVAR
..X(76)
46 
add-data-iso
LLLVAR
..X(100)
47
add-data-natl
LLLVAR
g..X(100)
48
add-data-prvt 
LLLVAR
g..100
49
crncy-cde

9(3)
50
setl-crncy

9(3)
51 
bill-crncy

9(3)
52
pin

X(16)
53
sec-cntrl-info

g 16
54 
add-amts
LLLVAR
g..120
55 
pri-rsrvd1-iso
LLLVAR
g..360
56
pri-rsrvd2-iso
LLLVAR
..X(100)
57
pri-rsrvd1-natl
LLLVAR
g..X(100)
58
pri-rsrvd2-natl
LLLVAR
g..X(100)
59
pri-rsrvd3-natl
LLLVAR
g..X(100)
60
pri-rsrvd1-prvt
LLLVAR
g..100
61
pri-rsrvd2-prvt
LLLVAR
g..100
62
pri-rsrvd3-prvt
LLLVAR
g..100
63
pri-rsrvd4-prvt
LLLVAR
g..597
64
pri-mac-cde

X(16)
65
reserved for ISO use

b 8
66
setl-cde

9(1)
67
extd-pay-cde

9(2)
68
rcv-inst-cntry-cde

9(3)
69
setl-inst-cntry-cde

9(3)
70
netw-mgmt-cde

9(3)
71
msg-num

9(4)
72
lst-msg-num

9(4)
73
action-dat
yymmdd
9(6)
74
num-cr

9(10)
75
num-cr-rvsl

9(10)
76
num-db

9(10)
77
num-db-rvsl

9(10)
78
num-xfer

9(10)
79
num-xfer-rvsl

9(10)
80
num-inq

9(10)
81
num-auth

9(10)
82
amt-cr-proc-fees

9(12)
83
amt-cr-tran-fees

9(12)
84
amt-db-proc-fees

9(12)
85
amt-db-tran-fees

9(12)
86
amt-cr

9(16)
87
amt-cr-rvsl

9(16)
88
amt-db

9(16)
89
amt-db-rvsl

9(16)
90
orig-info

g 42
91
file-updt-cde

X(1)
92
file-sec-cde

X(2)
93
resp-ind

X(5)
94
srv-ind

X(7)
95
replacement

g 42
96
msg-sec-cde

X(16)
97
setl-amt-net

g 17
98
payee

X(25)
99
setl-inst
LLVAR
..9(11)
100
rcv-inst
LLVAR
..9(11)
101
fname
LLVAR
..X(17)
102
acct1
LLVAR
..X(28)
103
acct2
LLVAR
..X(28)
104
tran-descr
LLLVAR
..X(100)
105
secndry-rsrvd1-iso
LLLVAR
..X(100)
106
secndry-rsrvd2-iso
LLLVAR
..X(100)
107
secndry-rsrvd3-iso
LLLVAR
..X(100)
108
secndry-rsrvd4-iso
LLLVAR
..X(100)
109
secndry-rsrvd5-iso
LLLVAR
..X(100)
110
secndry-rsrvd6-iso
LLLVAR
..X(100)
111
secndry-rsrvd7-iso
LLLVAR
..X(100)
112
secndry-rsrvd1-natl
LLLVAR
..X(200)
113
secndry-rsrvd2-natl
LLLVAR
..X(100)
114
secndry-rsrvd3-natl
LLLVAR
..X(100)
115
secndry-rsrvd4-natl
LLLVAR
..X(100)
116
secndry-rsrvd5-natl
LLLVAR
..X(100)
117
secndry-rsrvd6-natl
LLLVAR
..X(100)
118
secndry-rsrvd7-natl
LLLVAR
..X(100)
119
secndry-rsrvd8-natl
LLLVAR
..X(100)
120
secndry-rsrvd1-prvt
LLLVAR
g..150
121
secndry-rsrvd2-prvt
LLLVAR
g..150
122
secndry-rsrvd3-prvt
LLLVAR
g..150
123
secndry-rsrvd4-prvt
LLLVAR
g..455
124
secndry-rsrvd5-prvt
LLLVAR
g..684
125
secndry-rsrvd6-prvt
LLLVAR
g..680
126
secndry-rsrvd7-prvt
LLLVAR
g..680
127
secndry-rsrvd8-prvt
LLLVAR
g..X(200)
128
secndry-mac-cde

X(16)

DESCRIPCION DE LOS CAMPOS UTILIZADOS POR LINK PARA LA IMPLEMENTACION DE LA NORMA ISO

NOMBRE DEL CAMPO
DESCRIPCION
start-of-base24-header-indicator

Literal requerido que indica el comienzo de BASE24 HEADER.
base24-header

Header del registro.
message-type-identifier

Código que identifica el tipo de mensaje.
primary-bit-map

Controla la presencia o ausencia de elementos

BIT
NOMBRE DEL CAMPO

DESCRIPCION
1
secndry-bit-map
Controla la presencia o ausencia de elementos de datos, desde la posición 65 a 128. Es un dato en sí mismo y su presencia o ausencia	es controlada por el BIT 1 del campo anterior.
3
proc-cde
Código de transacción
4 
tran-amt
Monto de la transacción
7 
xmit-dat-tim
(TRANSMISSION-DATE-AND-TIME ) Representa la fecha y hora del mensaje
11 
trace-num
Número que es fijado por el que origina el mensaje y repetido por el receptor del mensaje. Es usado para chequear la respuesta al mensaje original. Puede no ser el mismo durante el transcurso de la transacción. Por ejemplo: Un reverso puede no tener el número de la transacción original.
12 
tran-tim
Es la hora local en que comenzó la transacción
13
tran-dat
Es la fecha local en que comenzó la transacción
15
setl-dat
Fecha de negocios de una transacción realizada en otra Red. En caso contrario, se deberá informar CEROS
17
cap-dat
Fecha de negocios de la transacción
32
acq-inst-id
Código interno de la Institución pagadora
35
track 2 
Contiene los datos del TRACK 2 de la tarjeta, alineado a izquierda y relleno con BLANCOS.
37
retrvl-ref-num
Número de recibo, alineado a izquierda y relleno con BLANCOS.
39
resp-cde
Código de respuesta que indica el estado del mensaje
41
term-id
(CARD-ACCEPTOR-TERMINAL-ID)Número de terminal, alineado a izquierda y relleno con BLANCOS.
42
crd-accpt-id-cde
Siempre relleno con BLANCOS. Para otros dispositivos que no sean cajeros automáticos, en este campo se informará 'CIT, lo cual indica que se deberá validar clave telefónica en lugar de pin de cajero
43
crd-accpt-name-loc
Nombre y localidad del dueño del ATM
44
resp-data
(ADDITIONAL-RESPONSE-DATA) Datos adicionales del mensaje de respuesta dependientes del tipo de mensaje.
48
add-data-prvt 
Datos adicionales de la transacción. Depende de donde fue originada la transacción si en ATM o POS.
49
crncy-cde
Código de moneda de la transacción
52
pin
Número de PIN, en forma encriptada
54 
add-amts
Datos adicionales dependientes del tipo de mensaje
55 
pri-rsrvd1-iso
(CAMPO P55) Datos para transacción Interbancarias  o
(P55-PAY-DATA) Datos del pago (PAS) o
(PRI-RSRVD1-ISO) Cuentas relacionadas a la tarjeta. (Consultas generales) 
Depende del tipo de mensaje.
60
pri-rsrvd1-prvt
(TERMINAL-DATA) Datos de la terminal que originó la transacción
61
pri-rsrvd2-prvt
(CARD-ISSUER-AND-AUTH-DATA) Datos de la Institución emisora de la tarjeta
63
pri-rsrvd4-prvt
(PIN-OFFSET) Campo de Pin Offset
70
netw-mgmt-cde
(NETWORK-MANAGEMENT-INFORMATION-CODE ) Código que es  usado para manejar el  STATUS  de procesamiento ON-LINE entre BASE-24 y un HOST
90
orig-info
(ORIGINAL-ELEMENTS) Datos de la transacción original dependiente del tipo de mensaje.
95
replacement
(REPLACEMENT-AMOUNTS) Monto realmente dispensado en una reversa parcial, dependiente del tipo de mensaje.
100
rcv-inst
(RECEIVING-INST-ID-CODE) Código interno que identifica la Institución emisora
102
acct1
Número de cuenta desde
103
acct2
Número de cuenta hacia
120
secndry-rsrvd1-prvt
(TERMINAL-ADDRESS) Dirección del ATM dependiente del tipo de mensaje.
122
secndry-rsrvd3-prvt
(CARD-ISSUER-IDENT-CODE) Código interno de la Institución emisora dependiente del tipo de mensaje.
123
secndry-rsrvd4-prvt
(DEPOSIT-CREDIT-AMOUNT) Monto del depósito que se suma al saldo disponible dependiente del tipo de mensaje.
124
secndry-rsrvd5-prvt
(DEPOSITORY-TYPE) Tipo de depositorio
125
secndry-rsrvd6-prvt
(ACCOUNT-INDICATOR) Indicador de cuenta a procesar por el Host,  en una transacción que involucre dos cuentas; o bien,
(STATEMENT-PRINT-DATA) Statement printer, según el tipo de mensaje.
127
secndry-rsrvd8-prvt
(ADDITIONAL-DATA) Datos adicionales de la transacción dependiente del tipo de mensaje.

Detalle de mensajes: 

En el próximo capítulo se detalla el cuerpo de cada uno de los mensajes y el formato de sus respectivos campos de acuerdo al código de transacción que lo origina.

