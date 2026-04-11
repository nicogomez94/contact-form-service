# Contact Form Service

Microservicio minimo para centralizar formularios de contacto de multiples sitios.

## Requisitos

- Node.js 18+
- Cuenta en Resend con dominio/verificacion de remitente

## Variables de entorno

Copiar `.env.example` a `.env` y completar:

- `PORT`
- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL` (fallback/default)
- `CONTACT_TO_EMAILS_JSON` (mapa por sitio)
- `CONTACT_FROM_EMAIL`
- `ALLOWED_ORIGINS` (lista separada por comas)

## Instalar y correr local

```bash
npm install
npm run dev
```

Servidor en `http://localhost:PORT`.

## Endpoint

- `POST /api/contact`
- Content-Type: `application/json`

### Body JSON ejemplo

```json
{
		"name": "Juan Perez",
		"email": "juan@mail.com",
		"to": "contacto@miweb.com",
		"message": "Hola, quiero mas informacion.",
		"site": "miweb.com",
		"company": ""
}
```

### Fetch ejemplo

```js
fetch("https://tu-servicio.onrender.com/api/contact", {
		method: "POST",
		headers: {
				"Content-Type": "application/json"
		},
		body: JSON.stringify({
				name: "Juan Perez",
				email: "juan@mail.com",
				to: "contacto@miweb.com",
				message: "Hola, quiero mas informacion.",
				site: "miweb.com",
				company: ""
		})
})
		.then((res) => res.json())
		.then((data) => console.log(data))
		.catch((err) => console.error(err));
```

## Deploy en Render (minimo)

1. Crear nuevo `Web Service` desde este repo/carpeta.
2. Runtime: `Node`.
3. Build Command: `npm install`.
4. Start Command: `npm start`.
5. Agregar variables de entorno del `.env.example`.
6. Deploy.

## Notas

- Si `company` llega con valor, responde `{ "success": true }` y no envia email (honeypot).
- Si `to` viene en el request, usa ese destinatario.
- Si `site` existe en `CONTACT_TO_EMAILS_JSON`, envia al email de ese sitio.
- Si `site` no existe en el mapa, usa `CONTACT_TO_EMAIL` como fallback.
- Siempre responde JSON.
