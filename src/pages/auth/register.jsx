import React from "react";
import { Link } from "react-router-dom";
import RegForm from "./common/reg-from";
import { ToastContainer } from "react-toastify";
import useDarkMode from "@/hooks/useDarkMode";
// image import
import bgImage from "@/assets/images/all-img/login-bg.png";
const register = () => {
  const [isDark] = useDarkMode();
  return (
    <div className="loginwrapper">
      <div className="lg-inner-column">
        <div className="right-column relative">
          <div className="inner-content h-full flex flex-col bg-white dark:bg-slate-800">
            <div className="auth-box h-full flex flex-col justify-center">
              <div className="mobile-logo text-center mb-6 lg:hidden block">
                <Link to="/">
                  <div className="text-2xl font-bold text-slate-800 dark:text-white">
                    BillMunshi
                  </div>
                </Link>
              </div>
              <div className="text-center 2xl:mb-10 mb-4">
                <h4 className="font-medium">Sign up</h4>
                <div className="text-slate-500 dark:text-slate-400 text-base">
                  Create an account to start using BillMunshi
                </div>
              </div>
              <RegForm />
            </div>
            <div className="auth-footer text-center">
              Copyright {new Date().getFullYear()}, BillMunshi All Rights Reserved.
            </div>
          </div>
        </div>
        <div
          className="left-column bg-cover bg-no-repeat bg-center "
          style={{
            backgroundImage: `url(${bgImage})`,
          }}
        >
          <div className="flex flex-col h-full justify-center">
            <div className="flex-1 flex flex-col justify-center items-center">
              <Link to="/">
                <div className="text-4xl font-bold text-white mb-10">
                  BillMunshi
                </div>
              </Link>
            </div>
            <div>
              <div className="black-500-title max-w-[525px] mx-auto pb-20 text-center">
                Streamline Your <span className="text-white font-bold">Billing Management</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default register;
