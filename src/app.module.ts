import { Module } from "@nestjs/common";
import { MoviesModule } from "./movies/movies.module";
import { CrawlModule } from "./crawl/crawl.module";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";

@Module({
  imports: [
    MoviesModule,
    CrawlModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "frontend"),
    }),
  ],
  providers: [],
})
export class AppModule {}
