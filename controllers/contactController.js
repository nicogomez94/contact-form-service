const { Resend } = require("resend");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 2000;

let resendClient;

function getResendClient() {
		if (!resendClient) {
				resendClient = new Resend(process.env.RESEND_API_KEY);
		}

		return resendClient;
}

function cleanString(value) {
		return typeof value === "string" ? value.trim() : "";
}

function normalizePayload(body) {
		return {
				name: cleanString(body.name),
				email: cleanString(body.email),
				message: cleanString(body.message),
				site: cleanString(body.site),
				company: cleanString(body.company)
		};
}

function normalizeSite(site) {
		if (!site) {
				return "";
		}

		let value = site.toLowerCase().trim();
		value = value.replace(/^https?:\/\//, "");
		value = value.split("/")[0].trim();
		value = value.replace(/^www\./, "");

		return value;
}

function getSiteToEmailMap() {
		const raw = cleanString(process.env.CONTACT_TO_EMAILS_JSON);

		if (!raw) {
				return {};
		}

		try {
				const parsed = JSON.parse(raw);
				const result = {};

				Object.entries(parsed).forEach(([site, email]) => {
						const siteKey = normalizeSite(site);
						const emailValue = cleanString(email);

						if (siteKey && emailValue) {
								result[siteKey] = emailValue;
						}
				});

				return result;
		} catch (error) {
				console.error("CONTACT_TO_EMAILS_JSON invalido:", error);
				return {};
		}
}

function resolveToEmail(site) {
		const map = getSiteToEmailMap();
		const normalizedSite = normalizeSite(site);
		const bySite = normalizedSite ? map[normalizedSite] : "";

		return cleanString(bySite || process.env.CONTACT_TO_EMAIL);
}

async function sendContact(req, res) {
		try {
				const { name, email, message, site, company } = normalizePayload(req.body || {});

				if (!name || !email || !message) {
						return res.status(400).json({
								success: false,
								error: "name, email y message son obligatorios"
						});
				}

				if (!EMAIL_REGEX.test(email)) {
						return res.status(400).json({
								success: false,
								error: "email invalido"
						});
				}

				if (message.length > MAX_MESSAGE_LENGTH) {
						return res.status(400).json({
								success: false,
								error: `message excede el maximo de ${MAX_MESSAGE_LENGTH} caracteres`
						});
				}

				if (company) {
						return res.status(200).json({ success: true });
				}

				if (!process.env.RESEND_API_KEY || !process.env.CONTACT_FROM_EMAIL) {
						return res.status(500).json({
								success: false,
								error: "Faltan variables de entorno requeridas"
						});
				}

				const toEmail = resolveToEmail(site);

				if (!toEmail) {
						return res.status(500).json({
								success: false,
								error: "No hay email destino configurado para este sitio"
						});
				}

				const safeSite = site || "Sitio no informado";
				const subject = `Nuevo contacto desde ${safeSite}`;
				const text = [
						`Sitio: ${safeSite}`,
						`Nombre: ${name}`,
						`Email: ${email}`,
						"Mensaje:",
						message
				].join("\n");

				await getResendClient().emails.send({
						from: process.env.CONTACT_FROM_EMAIL,
						to: [toEmail],
						subject,
						text,
						replyTo: email
				});

				return res.status(200).json({ success: true });
		} catch (error) {
				console.error("Error enviando contacto:", error);

				return res.status(500).json({
						success: false,
						error: "No se pudo procesar el contacto"
				});
		}
}

module.exports = {
		sendContact
};
