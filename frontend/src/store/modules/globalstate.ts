import { Module, VuexModule, Mutation, getModule } from "vuex-module-decorators";
import store from "@/store";

export interface IGlobalState {
  title: string;
}

@Module({
  store,
  name: "GlobalSatete",
  namespaced: true,
  dynamic: true,
})
class GlobalSatete extends VuexModule implements IGlobalState {
  title = "복슬머니";

  @Mutation
  setTitle(title: string) {
    this.title = title;
  }
}
export default getModule(GlobalSatete);
