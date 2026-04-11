require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const contactRoutes = require("./routes/contact");

const app = express();
const port = process.env.PORT || 3000;

function normalizeOriginValue(value) {
		if (!value) {
				return "";
		}

		return value
				.trim()
				.replace(/^['"]|['"]$/g, "")
				.replace(/\/+$/, "")
				.toLowerCase();
}

function normalizeRequestOrigin(origin) {
		try {
				const parsed = new URL(origin);
				const hostname = parsed.hostname.toLowerCase();
				const protocol = parsed.protocol.toLowerCase();
				const hasExplicitPort = Boolean(parsed.port);
				const portPart = hasExplicitPort ? `:${parsed.port}` : "";

				return `${protocol}//${hostname}${portPart}`;
		} catch {
				return normalizeOriginValue(origin);
		}
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
		.split(/[,\n]/)
		.map((origin) => normalizeOriginValue(origin))
		.filter(Boolean);

function isWildcardRule(rule) {
		return /^(https?):\/\/\*\.[^/]+$/i.test(rule);
}

function matchesWildcardRule(normalizedOrigin, rule) {
		try {
				const originUrl = new URL(normalizedOrigin);
				const match = rule.match(/^(https?):\/\/\*\.(.+)$/i);

				if (!match) {
						return false;
				}

				const ruleProtocol = `${match[1].toLowerCase()}:`;
				const ruleDomain = match[2].toLowerCase();
				const originHost = originUrl.hostname.toLowerCase();

				if (originUrl.protocol.toLowerCase() !== ruleProtocol) {
						return false;
				}

				return originHost === ruleDomain || originHost.endsWith(`.${ruleDomain}`);
		} catch {
				return false;
		}
}

function isOriginAllowed(origin) {
		if (!origin) {
				return true;
		}

		const normalizedOrigin = normalizeRequestOrigin(origin);

		if (allowedOrigins.includes("*")) {
				return true;
		}

		return allowedOrigins.some((rule) => {
				if (rule === normalizedOrigin) {
						return true;
				}

				if (isWildcardRule(rule)) {
						return matchesWildcardRule(normalizedOrigin, rule);
				}

				return false;
		});
}

app.use(helmet());
app.use(
		cors({
				origin: (origin, callback) => {
						if (isOriginAllowed(origin)) {
								return callback(null, true);
						}

						return callback(new Error("Origin no permitido por CORS"));
				},
				methods: ["POST", "OPTIONS"],
				allowedHeaders: ["Content-Type"]
		})
);

app.use(express.json({ limit: "20kb" }));

app.get("/health", (req, res) => {
		res.status(200).json({ success: true });
});

app.use("/api/contact", contactRoutes);

app.use((req, res) => {
		res.status(404).json({
				success: false,
				error: "Ruta no encontrada"
		});
});

app.use((err, req, res, next) => {
		if (err.message === "Origin no permitido por CORS") {
				return res.status(403).json({
						success: false,
						error: err.message
				});
		}

		if (err.type === "entity.parse.failed") {
				return res.status(400).json({
						success: false,
						error: "JSON invalido"
				});
		}

		console.error("Error no controlado:", err);

		return res.status(500).json({
				success: false,
				error: "Error interno"
		});
});

app.listen(port, () => {
		console.log(`Contact service corriendo en puerto ${port}`);
});
