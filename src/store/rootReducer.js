import layout from "./layout";
import auth from "./api/auth/authSlice";
import cart from "./api/shop/cartSlice";
import modules from "./api/modules/modulesSlice";

const rootReducer = {
  layout,
  auth,
  cart,
  modules,
};
export default rootReducer;
