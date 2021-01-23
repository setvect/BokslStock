import { Controller, Get } from "@nestjs/common";
import { CrawlerService } from "./crawler.service";
import axios from "axios";
import { AxiosResponse } from "axios";
import { Config } from "../config";

@Controller("crawl")
export class CrawlerController {
  constructor(private readonly crawlService: CrawlerService) {}

  @Get()
  async getAll(): Promise<string> {
    const aaa: AxiosResponse = await axios({
      method: "get",
      url: "https://finance.naver.com/item/sise_day.nhn?code=005930&page=1",
      headers: {
        "User-Agent": Config.userAgent,
      },
    });

    console.log("aaa 1111:>> ", aaa);

    return "11222";
  }
}
