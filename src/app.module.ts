import { Module } from "@nestjs/common";
import { MoviesModule } from "./movies/movies.module";
import { CrawlerModule } from "./crawler/crawler.module";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";

@Module({
  imports: [
    MoviesModule,
    CrawlerModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "frontend"),
    }),
  ],
  providers: [],
})
export class AppModule {}
