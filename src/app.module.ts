import { Module } from "@nestjs/common";
import { MoviesModule } from "./movies/movies.module";
import { AppController } from "./app/app.controller";
import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";

@Module({
  imports: [
    MoviesModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "frontend"),
    }),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
