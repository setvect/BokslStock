import Vue from "vue";
import Vuex, { StoreOptions, ActionContext } from "vuex";
import { IGlobalState } from "./modules/globalstate";

import { IUserState } from "./modules/user";

Vue.use(Vuex);
export interface IRootState {
  globalstate: IGlobalState;
  user: IUserState;
}

export default new Vuex.Store<IRootState>({});
