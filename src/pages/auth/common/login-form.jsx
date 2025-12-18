import React, { useState } from "react";
import Textinput from "@/components/ui/Textinput";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import Checkbox from "@/components/ui/Checkbox";
import Button from "@/components/ui/Button";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useLoginMutation, useLazyGetProfileQuery } from "@/store/api/auth/authApiSlice";
import { setUser } from "@/store/api/auth/authSlice";
import { toast } from "react-toastify";
import { handleApiError } from "@/utils/apiErrorHandler";

const schema = yup
  .object({
    email: yup.string().email("Invalid email").required("Email is Required"),
    password: yup.string().required("Password is Required"),
  })
  .required();

const LoginForm = () => {
  const [login, { isLoading, isError, error, isSuccess }] = useLoginMutation();
  const [triggerGetProfile, { isLoading: isProfileLoading }] = useLazyGetProfileQuery();

  const dispatch = useDispatch();

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "all",
  });
  
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  const onSubmit = async (data) => {
    try {
      const response = await login(data);

      if (response.error) {
        console.error('Response error:', response.error);
        throw new Error(response.error.data?.message || response.error.data?.detail || "Login failed");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      // Check if we have the expected response structure
      if (!response.data?.access || !response.data?.user) {
        console.error('Invalid response structure:', response.data);
        throw new Error("Invalid response from server");
      }

      // Store initial login tokens
      const loginTokens = {
        access: response.data.access,
        refresh: response.data.refresh
      };

      toast.success("Login Successful");

      // Fetch fresh profile data from /me endpoint
      const profileResult = await triggerGetProfile();
      
      if (profileResult.error) {
        console.error('Profile fetch error:', profileResult.error);
        // Fall back to login response data if profile fetch fails
        var userData = response.data.user;
      } else {
        // Use fresh profile data
        var userData = profileResult.data;
      }

      // Navigate to organization selection page with login data
      navigate("/auth/select-organization", {
        state: {
          loginData: {
            user: userData,
            access: loginTokens.access,
            refresh: loginTokens.refresh
          }
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      
      // Use centralized error handler
      const isTokenExpired = handleApiError(error, "Login failed. Please try again.");
      
      // If it's not a token expiration error, the handleApiError already showed the toast
      // Token expiration errors are handled automatically by the error handler
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
        <Textinput
          name="email"
          label="email"
          type="email"
          register={register}
          error={errors.email}
          className="h-[48px]"
          placeholder="Enter your email"
        />
        <Textinput
          name="password"
          label="password"
          type="password"
          register={register}
          error={errors.password}
          hasicon={true}
          className="h-[48px]"
          placeholder="Enter your password"
        />
        <div className="flex justify-between">
          <Checkbox
            value={checked}
            onChange={() => setChecked(!checked)}
            label="Keep me signed in"
          />
          <Link
            to="/forgot-password"
            className="text-sm text-slate-800 dark:text-slate-400 leading-6 font-medium"
          >
            Forgot Password?{" "}
          </Link>
        </div>

        <Button
          type="submit"
          text="Sign in"
          className="btn btn-dark block w-full text-center "
          isLoading={isLoading || isProfileLoading}
        />
      </form>
    </>
  );
};

export default LoginForm;
