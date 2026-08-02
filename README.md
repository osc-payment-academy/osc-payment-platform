# OSC Payment Platform v0.1

Primera versión desplegable de OSC Payment Academy.

## Incluye
- Landing pública.
- Login demo.
- Dashboard responsivo.
- Usuarios y permisos por módulo.
- Contenedores para Constructor, POS, ATM, Parser, Compensación y Curso interactivo.
- Configuración para Cloudflare Workers & Pages.

## Usuarios demo
- Instructor: `oscar@oscpaymentacademy.com` / `demo1234`
- Solo Parser: `parser@oscpaymentacademy.com` / `parser123`
- Alumno: `alumno@oscpaymentacademy.com` / `alumno123`

## Cloudflare
Cloudflare ejecuta `npx wrangler deploy` y sirve los archivos de `./public`.
