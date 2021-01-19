import { PartialType } from "@nestjs/mapped-types";
import { CreateMovieDto } from "./create-moive.dto";

export class UpdateMovieDto extends PartialType(CreateMovieDto) {}
