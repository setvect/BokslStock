import { Controller, Get } from "@nestjs/common";
import { CrawlerService } from "./crawler.service";
import axios from "axios";
import { AxiosResponse } from "axios";

@Controller("crawl")
export class CrawlerController {
  constructor(private readonly crawlService: CrawlerService) {}

  @Get()
  async getAll(): Promise<string> {
    const aaa: AxiosResponse = await axios({
      method: "get",
      url: "https://finance.naver.com/item/sise_day.nhn?code=005930&page=1",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36",
      },
    });

    console.log("aaa 1111:>> ", aaa);

    return "11222";
  }
}
