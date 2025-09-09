import layout from "./layout";
import auth from "./api/auth/authSlice";
import modules from "./api/modules/modulesSlice";

const rootReducer = {
  layout,
  auth,
  modules,
};
export default rootReducer;
