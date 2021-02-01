import { Module } from "@nestjs/common";
import { MoviesModule } from "./movies/movies.module";
import { CrawlerModule } from "./crawler/crawler.module";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./crawler/entities/user.entity";
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "sqlite",
      database: "db/BokslStock.db",
      synchronize: true,
      entities: [User],
    }),
    MoviesModule,
    CrawlerModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "frontend"),
    }),
  ],
  providers: [],
})
export class AppModule {}
