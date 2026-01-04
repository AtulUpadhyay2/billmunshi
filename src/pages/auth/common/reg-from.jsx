import React, { useState } from "react";
import { toast } from "react-toastify";
import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import Checkbox from "@/components/ui/Checkbox";
import { useDispatch, useSelector } from "react-redux";
import { useRegisterUserMutation } from "@/store/api/auth/authApiSlice";

const schema = yup
  .object({
    name: yup.string().required("Full Name is Required"),
    organizationName: yup.string().required("Organization Name is Required"),
    designation: yup.string().required("Designation is Required"),
    accountingSoftware: yup.string().required("Accounting Software is Required"),
    email: yup.string().email("Invalid email").required("Work Email is Required"),
    password: yup
      .string()
      .min(8, "Password must be at least 8 characters")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      )
      .required("Please enter password"),
    phone: yup
      .string()
      .matches(/^[0-9]{10}$/, "Phone number must be 10 digits")
      .required("Phone number is Required"),
  })
  .required();

const RegForm = () => {
  const [registerUser, { isLoading, isError, error, isSuccess }] =
    useRegisterUserMutation();

  const [checked, setChecked] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");

  const designationOptions = [
    { value: "", label: "Select Designation" },
    { value: "business_owner", label: "Business Owner" },
    { value: "accountant", label: "Accountant" },
    { value: "professional", label: "Professional" },
    { value: "other", label: "Other" },
  ];

  const accountingSoftwareOptions = [
    { value: "", label: "Select Accounting Software" },
    { value: "zoho_books", label: "Zoho Books" },
    { value: "tally", label: "Tally" },
  ];

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "all",
  });

  const password = watch("password", "");

  // Calculate password strength
  React.useEffect(() => {
    if (!password) {
      setPasswordStrength("");
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;

    if (strength <= 2) {
      setPasswordStrength("Weak");
    } else if (strength === 3) {
      setPasswordStrength("Medium");
    } else {
      setPasswordStrength("Strong");
    }
  }, [password]);

  const navigate = useNavigate();
  const onSubmit = async (data) => {
    try {
      const response = await registerUser(data);
      if (response.error) {
        throw new Error(response.error.message);
      }
      reset();
      navigate("/");
      toast.success("Add Successfully");
    } catch (error) {
      console.log(error.response); // Log the error response to the console for debugging

      const errorMessage =
        error.response?.data?.message ||
        "An error occurred. Please try again later.";

      if (errorMessage === "Email is already registered") {
        toast.error(errorMessage);
      } else {
        toast.warning(errorMessage);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 ">
      <Textinput
        name="name"
        label="Full Name"
        type="text"
        placeholder="Enter your full name"
        register={register}
        error={errors.name}
        className="h-[48px]"
      />
      <Textinput
        name="organizationName"
        label="Name of Organization"
        type="text"
        placeholder="Enter your organization name"
        register={register}
        error={errors.organizationName}
        className="h-[48px]"
      />
      <Select
        name="designation"
        label="Designation"
        register={register}
        options={designationOptions}
        error={errors.designation}
        className="h-[48px]"
      />
      <Select
        name="accountingSoftware"
        label="Accounting Software"
        register={register}
        options={accountingSoftwareOptions}
        error={errors.accountingSoftware}
        className="h-[48px]"
      />
      <Textinput
        name="email"
        label="Work Email"
        type="email"
        placeholder="Enter your work email"
        register={register}
        error={errors.email}
        className="h-[48px]"
      />
      <div>
        <Textinput
          name="password"
          label="Set Password"
          type="password"
          placeholder="Enter your password"
          register={register}
          error={errors.password}
          className="h-[48px]"
        />
        {password && (
          <div className="mt-2">
            <span
              className={`text-sm font-medium ${
                passwordStrength === "Weak"
                  ? "text-red-500"
                  : passwordStrength === "Medium"
                  ? "text-yellow-500"
                  : "text-green-500"
              }`}
            >
              Password Strength: {passwordStrength}
            </span>
          </div>
        )}
      </div>
      <Textinput
        name="phone"
        label="Phone"
        type="text"
        placeholder="Enter your phone number"
        register={register}
        error={errors.phone}
        className="h-[48px]"
      />
      <Checkbox
        label="You accept our Terms and Conditions and Privacy Policy"
        value={checked}
        onChange={() => setChecked(!checked)}
      />
      <Button
        type="submit"
        text="Create an account"
        className="btn btn-dark block w-full text-center"
        isLoading={isLoading}
      />
    </form>
  );
};

export default RegForm;
