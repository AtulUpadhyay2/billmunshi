import React from "react";
import { Link } from "react-router-dom";
import ForgotPass from "./common/forgot-pass";
import useDarkMode from "@/hooks/useDarkMode";
import bgImage from "@/assets/images/all-img/login-bg.png";

const forgotPass = () => {
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
                <h4 className="font-medium">Forgot Your Password?</h4>
                <div className="text-slate-500 dark:text-slate-400 text-base">
                  Reset your password to continue using BillMunshi
                </div>
              </div>
              
              <div className="font-normal text-base text-slate-500 dark:text-slate-400 text-center px-4 py-3 mb-6 bg-slate-100 dark:bg-slate-600 rounded-lg">
                Enter your email address and we'll send you instructions to reset your password.
              </div>

              <ForgotPass />
              
              <div className="md:max-w-[345px] mx-auto font-normal text-slate-500 dark:text-slate-400 2xl:mt-12 mt-8 text-sm text-center">
                Remember your password?{" "}
                <Link
                  to="/auth/login"
                  className="text-slate-900 dark:text-white font-medium hover:underline"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
            <div className="auth-footer text-center">
              Copyright {new Date().getFullYear()}, BillMunshi All Rights Reserved.
            </div>
          </div>
        </div>
        <div
          className="left-column bg-cover bg-no-repeat bg-center"
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

export default forgotPass;
