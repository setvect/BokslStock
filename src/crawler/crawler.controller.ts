import { Controller, Get, Req } from "@nestjs/common";
import { CrawlerService } from "./crawler.service";
import axios from "axios";
import { AxiosResponse } from "axios";
import { Config } from "../config";
import { Request } from "express";

@Controller("crawl")
export class CrawlerController {
  constructor(private readonly crawlService: CrawlerService) {}

  @Get()
  async getAll(@Req() request: Request): Promise<string> {
    // const aaa: AxiosResponse = await axios({
    //   method: "get",
    //   url: "https://finance.naver.com/item/sise_day.nhn?code=005930&page=1",
    //   headers: {
    //     "User-Agent": Config.userAgent,
    //   },
    // });
    console.log("@@@@@@@@@@@@@@@@@@@@@");
    this.crawlService.save();

    return "112211111111112";
  }
}
