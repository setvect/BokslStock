import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CrawlerController } from "./crawler.controller";
import { CrawlerService } from "./crawler.service";
import { User } from "./entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [CrawlerController],
  providers: [CrawlerService],
})
export class CrawlerModule {}
