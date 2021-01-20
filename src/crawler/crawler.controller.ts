import { Controller, Get } from "@nestjs/common";
import { CrawlerService } from "./crawler.service";

@Controller("crawl")
export class CrawlerController {
  constructor(private readonly crawlService: CrawlerService) {}

  @Get()
  getAll(): string {
    return "abc1111222222";
  }
}
