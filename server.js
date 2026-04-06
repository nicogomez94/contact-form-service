require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const contactRoutes = require("./routes/contact");

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);

app.use(helmet());
app.use(
		cors({
				origin: (origin, callback) => {
						if (!origin) {
								return callback(null, true);
						}

						if (allowedOrigins.includes(origin)) {
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
