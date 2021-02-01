import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";

@Injectable()
export class CrawlerService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  getAll(): string {
    return "";
  }
  save() {
    const u: User = new User();
    u.firstName = "슬이";
    u.lastName = "복";
    u.id = 101;
    u.isActive = false;

    this.usersRepository.save(u);
  }
}
