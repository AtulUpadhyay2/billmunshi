import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useHandleOAuthCallback } from "@/hooks/api/zoho/zohoApiService";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const ZohoOAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedOrganization } = useSelector((state) => state.auth);
  const { mutateAsync: handleOAuthCallback, isPending } =
    useHandleOAuthCallback();

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      toast.error(`OAuth authorization failed: ${error}`);
      navigate("/zoho/config/credentials");
      return;
    }

    if (code && state && selectedOrganization?.id) {
      handleOAuthCallback({
        organizationId: selectedOrganization.id,
        code,
        state,
      })
        .then((response) => {
          if (response.success) {
            toast.success("Successfully connected to Zoho Books!");
          } else {
            toast.error("Failed to complete OAuth flow");
          }
          navigate("/zoho/config/credentials");
        })
        .catch((error) => {
          console.error("OAuth callback error:", error);
          toast.error(error.response?.data?.detail || "OAuth flow failed");
          navigate("/zoho/config/credentials");
        });
    } else if (!code) {
      toast.error("Authorization code not received from Zoho");
      navigate("/zoho/config/credentials");
    }
  }, [searchParams, selectedOrganization?.id, handleOAuthCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-blue-500">
            <svg
              className="animate-spin h-12 w-12"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Connecting to Zoho Books
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isPending
              ? "Processing your authorization..."
              : "Please wait while we connect your account."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ZohoOAuthCallback;
