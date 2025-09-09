import layout from "./layout";
import email from "../pages/app/email/store";
import chat from "../pages/app/chat/store";
import project from "../pages/app/projects/store";
import auth from "./api/auth/authSlice";
import cart from "./api/shop/cartSlice";
import modules from "./api/modules/modulesSlice";

const rootReducer = {
  layout,
  email,
  chat,
  project,
  auth,
  cart,
  modules,
};
export default rootReducer;
