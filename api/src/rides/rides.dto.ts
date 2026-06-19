import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class TyreDetailDto {
  @ApiProperty() name!: string;
  @ApiProperty() designation!: string;
  @ApiProperty() weightG!: number;
  @ApiProperty() dimensions!: number;
}

class ProTipDto {
  @ApiProperty() author!: string;
  @ApiProperty() text!: string;
}

/** Champs communs aux deux modes de creation de balade (Strava / GPX). */
class CreateRideFormDto {
  @ApiProperty({ example: "Boucle des Crêtes" })
  name!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  instructions?: string;

  @ApiProperty({ example: "Route" })
  terrain!: string;

  @ApiProperty({ example: "Montagne" })
  landscape!: string;

  @ApiPropertyOptional({ example: "Intermédiaire" })
  difficulty?: string;

  @ApiPropertyOptional({ type: [String] })
  tags?: string[];

  @ApiPropertyOptional({ description: "Libelle libre du pneu utilise (champ historique)" })
  tyre?: string;

  @ApiPropertyOptional({ type: TyreDetailDto })
  tyreDetail?: TyreDetailDto;

  @ApiPropertyOptional({ type: ProTipDto })
  proTip?: ProTipDto;

  @ApiPropertyOptional({ description: "Id du pneu dans le catalogue confidentiel `products`" })
  usedTyreProductId?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5, description: "Note du pneu utilise (1-5), requiert usedTyreProductId" })
  usedTyreRating?: number;

  @ApiPropertyOptional()
  kcal?: number;
}

export class CreateRideFromStravaDto extends CreateRideFormDto {
  @ApiProperty({ description: "Id de l'activite Strava a publier comme balade" })
  activityId!: string;
}

export class CreateRideFromGpxDto extends CreateRideFormDto {
  @ApiProperty({ description: "Contenu XML brut du fichier GPX" })
  gpxXml!: string;
}
