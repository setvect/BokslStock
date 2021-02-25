import { Module, VuexModule, Mutation, getModule } from "vuex-module-decorators";
import store from "@/store";

export interface IUserState {
  id: string;
  name: string;
}

@Module({
  store,
  name: "GlobalSatete",
  namespaced: true,
  dynamic: true,
})
class GlobalSatete extends VuexModule implements IUserState {
  id = "boksl";
  name = "복슬이";

  @Mutation
  setId(id: string) {
    this.id = id;
  }
  @Mutation
  setName(name: string) {
    this.name = name;
  }
}
export default getModule(GlobalSatete);
