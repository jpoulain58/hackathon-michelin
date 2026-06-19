import "reflect-metadata";
import "./env";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

// Origines autorisees a appeler l'API depuis le navigateur (CORS) :
// - WEB_ORIGIN : liste separee par des virgules (domaine(s) de prod canonique).
// - *.vercel.app : previews et alias de deploiement Vercel (sinon bloques).
// - localhost / 127.0.0.1 : developpement local.
function isAllowedOrigin(origin: string, allowList: string[]): boolean {
  const clean = origin.replace(/\/+$/, "");
  if (allowList.includes(clean)) return true;

  let host: string;
  try {
    host = new URL(clean).hostname;
  } catch {
    return false;
  }

  if (host === "localhost" || host === "127.0.0.1") return true;
  if (host === "vercel.app" || host.endsWith(".vercel.app")) return true;
  return false;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const allowList = (process.env.WEB_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  app.enableCors({
    origin: (
      requestOrigin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ): void => {
      // Requetes sans Origin (curl, app mobile, server-to-server) : autorisees.
      if (!requestOrigin) {
        callback(null, true);
        return;
      }
      callback(null, isAllowedOrigin(requestOrigin, allowList));
    },
    credentials: true,
  });

  app.setGlobalPrefix("api");

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Michelin Trust Wheels API")
    .setDescription(
      "API NestJS du monorepo Michelin Trust Wheels : catalogue pneus, recommandation, communaute, balades, revendeurs, auth Supabase/Strava/Garmin.",
    )
    .setVersion("0.1.0")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "JWT de session Supabase (access_token)" },
      "supabase-jwt",
    )
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, swaggerDocument);

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Michelin Trust Wheels API -> http://localhost:${port}/api`);
  // eslint-disable-next-line no-console
  console.log(`Swagger UI -> http://localhost:${port}/api/docs`);
}

void bootstrap();
