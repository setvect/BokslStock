import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateMovieDto } from "./dto/create-moive.dto";
import { UpdateMovieDto } from "./dto/update-moive.dto";
import { Movie } from "./entities/moive.entity";

@Injectable()
export class MoviesService {
  private moives: Movie[] = [];

  getAll(): Movie[] {
    return this.moives;
  }

  getOne(id: number): Movie {
    const movie = this.moives.find((m) => m.id === id);
    if (!movie) {
      throw new NotFoundException(`movie with ID ${id} not found.`);
    }
    return movie;
  }

  deleteOne(id: number): void {
    this.getOne(id);
    this.moives = this.moives.filter((m) => m.id !== id);
  }

  create(movieData: CreateMovieDto): void {
    this.moives.push({
      id: this.moives.length + 1,
      ...movieData,
    });
  }
  update(id: number, updateData: UpdateMovieDto): UpdateMovieDto {
    const moive = this.getOne(id);
    this.deleteOne(id);
    const updateMovie = { ...moive, ...updateData };
    this.moives.push(updateMovie);
    return updateData;
  }
}
