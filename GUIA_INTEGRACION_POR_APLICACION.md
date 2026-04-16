# Guia De Integracion Por Aplicacion

Esta guia es el proceso operativo para conectar cualquier app/sitio a tu microservicio de formularios:

- API base: `https://contact-form-service-e8aa.onrender.com`
- Endpoint: `POST /api/contact`

## 1. Requisitos Previos (Una sola vez)

1. Tener el microservicio deployado en Render.
2. Tener dominio verificado en Resend (`zigodev.com.ar` ya lo tenes).
3. Tener `RESEND_API_KEY` cargada en Render.
4. Confirmar health:
```bash
curl -i https://contact-form-service-e8aa.onrender.com/health
```
Debe responder `200` con `{"success":true}`.

## 2. Configuracion En Render (Microservicio)

En el servicio de Render, definir:

- `RESEND_API_KEY`
- `CONTACT_FROM_EMAIL`
- `CONTACT_TO_EMAIL` (fallback)
- `CONTACT_TO_EMAILS_JSON` (mapa por dominio)
- `ALLOWED_ORIGINS` (lista de frontends permitidos)

### Ejemplo recomendado

```env
CONTACT_FROM_EMAIL=Contacto Zigodev <contacto@zigodev.com.ar>
CONTACT_TO_EMAIL=default@zigodev.com.ar
CONTACT_TO_EMAILS_JSON={"zigodev.com.ar":"hola@zigodev.com.ar","coordinacionhockey.com.ar":"contacto@coordinacionhockey.com.ar"}
ALLOWED_ORIGINS=https://zigodev.com.ar,https://www.zigodev.com.ar,https://coordinacionhockey.com.ar,https://www.coordinacionhockey.com.ar,http://localhost:5173
```

Notas:
- `CONTACT_TO_EMAILS_JSON` define a quien llega cada sitio.
- Si un `site` no existe en ese JSON, usa `CONTACT_TO_EMAIL`.
- Cada vez que cambies variables en Render, hacer redeploy.

## 3. Alta De Una Nueva Aplicacion/Sitio

Cuando sumas un sitio nuevo (`cliente.com`):

1. Agregar destino en `CONTACT_TO_EMAILS_JSON`:
```json
{
		"cliente.com": "contacto@cliente.com"
}
```
2. Agregar origins en `ALLOWED_ORIGINS`:
- `https://cliente.com`
- `https://www.cliente.com` (si aplica)
3. Guardar cambios y redeploy en Render.

## 4. Integracion Frontend En Cada App

En cada formulario, hacer `POST` a:

`https://contact-form-service-e8aa.onrender.com/api/contact`

Body minimo:

```json
{
		"name": "Juan Perez",
		"email": "juan@mail.com",
		"to": "contacto@cliente.com",
		"message": "Hola, necesito informacion",
		"site": "cliente.com",
		"company": ""
}
```

Campos importantes:
- `to`: destino explicito para ese formulario (prioridad alta).
- `site`: identificador del sitio para asunto y fallback.
- `company`: honeypot, siempre vacio en frontend visible.

## 5. Validaciones Recomendadas En Frontend

Antes de enviar:

1. `name`, `email`, `message` obligatorios.
2. Email con validacion basica.
3. `trim()` de campos.
4. Boton deshabilitado durante submit.
5. Mensaje de exito/error al usuario.

## 6. Prueba Rapida Con Curl

```bash
curl -X POST https://contact-form-service-e8aa.onrender.com/api/contact \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test\",\"email\":\"test@mail.com\",\"to\":\"contacto@cliente.com\",\"message\":\"Prueba\",\"site\":\"cliente.com\",\"company\":\"\"}"
```

Esperado:
```json
{"success":true}
```

## 7. Checklist De Diagnostico Si Falla

### Error CORS en navegador

1. Revisar `ALLOWED_ORIGINS` (coincidencia exacta de dominio).
2. Verificar `www` y sin `www`.
3. Verificar `https` vs `http`.
4. Redeploy del microservicio.
5. Hard refresh del frontend (`Ctrl+F5`).

Prueba preflight:
```bash
curl -i -X OPTIONS "https://contact-form-service-e8aa.onrender.com/api/contact" \
  -H "Origin: https://cliente.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```

### Responde success pero no llega email

1. Revisar si `company` se esta llenando accidentalmente.
2. Revisar `to` valido en request.
3. Revisar logs de Render.
4. Revisar Activity/Logs en Resend.
5. Revisar spam/promociones en inbox destino.

### Llega a spam

1. Confirmar SPF, DKIM y DMARC del dominio.
2. Usar `CONTACT_FROM_EMAIL` alineado al dominio.
3. Evitar asuntos agresivos o texto spammy.
4. Pedir whitelist del remitente en cliente.

## 8. Flujo Recomendado Para Operar

1. Alta de dominio/origin del nuevo sitio en Render.
2. Alta de destinatario en `CONTACT_TO_EMAILS_JSON`.
3. Integracion del fetch en frontend.
4. Prueba con curl.
5. Prueba desde UI real.
6. Confirmacion de recepcion en inbox del cliente.

## 9. Plantilla Rapida Para Pasarle A Un Dev

```txt
Integrar formulario con:
POST https://contact-form-service-e8aa.onrender.com/api/contact

Enviar JSON:
{
  "name": "...",
  "email": "...",
  "to": "contacto@cliente.com",
  "message": "...",
  "site": "cliente.com",
  "company": ""
}

No romper UI.
Validar campos, mostrar loading y mensajes.
```

## 10. Prompt Tipico Rellenable

Copiar/pegar este prompt y completar los campos entre `<...>`:

```txt
Necesito que integres el formulario de esta aplicacion con mi microservicio central de emails.

No rompas UI/estilos existentes. No agregues librerias nuevas salvo necesidad real.

Endpoint:
POST https://contact-form-service-e8aa.onrender.com/api/contact
Content-Type: application/json

Al enviar el formulario, mandar este JSON:
{
  "name": "<tomar del campo nombre>",
  "email": "<tomar del campo email>",
  "to": "<EMAIL_DESTINO_CLIENTE>",
  "message": "<tomar del campo mensaje>",
  "site": "<SITE_ID>",
  "company": ""
}

Requisitos:
- Validar name/email/message obligatorios.
- Validar email basico en frontend.
- Hacer trim de campos.
- Deshabilitar boton durante submit.
- Mostrar estado loading, error y success.
- Si responde { "success": true }, limpiar formulario.

Entregame:
1) archivos modificados
3) donde seteaste `to` y `site`
```
