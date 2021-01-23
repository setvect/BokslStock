import * as _ from "lodash";
import BaseConfig from "./default";

const Config = _.cloneDeep(BaseConfig);

if (process.env.NODE_ENV) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const EnvConfig = require(`./${process.env.NODE_ENV}`).default;
    _.merge(Config, EnvConfig);
  } catch (e) {
    console.log(`Cannot find configs for env=${process.env.NODE_ENV}`);
  }
}

export { Config };
