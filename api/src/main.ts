import "reflect-metadata";
import "./env";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  // Le front Next.js consomme cette API : on autorise le CORS.
  app.enableCors({ origin: process.env.WEB_ORIGIN?.replace(/\/+$/, "") ?? true });
  app.setGlobalPrefix("api");
  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Michelin Trust Wheels API -> http://localhost:${port}/api`);
}

void bootstrap();
