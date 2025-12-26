import React from "react";
import Card from "@/components/ui/Card";

const ZohoSetupInstructions = ({ onDismiss }) => {
  return (
    <Card title="Zoho Books Integration Setup" className="mb-6">
      <div className="p-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg
              className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="text-blue-800 font-medium mb-2">
                Before you can connect to Zoho Books
              </h3>
              <p className="text-blue-700 text-sm mb-4">
                You need to set up your Zoho Books API credentials first. Follow
                these steps:
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                <span className="text-blue-600 font-semibold text-sm">1</span>
              </div>
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Create Zoho Books Application
              </h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>
                  • Go to{" "}
                  <a
                    href="https://api-console.zoho.in/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Zoho API Console
                  </a>
                </li>
                <li>• Click "Create Application" and select "Self Client"</li>
                <li>• Fill in your application details</li>
                <li>
                  • Note down your <strong>Client ID</strong> and{" "}
                  <strong>Client Secret</strong>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                <span className="text-blue-600 font-semibold text-sm">2</span>
              </div>
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Configure Redirect URL
              </h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p>Set your redirect URL in Zoho API Console to:</p>
                <div className="bg-gray-100 p-2 rounded font-mono text-xs break-all">
                  {window.location.origin}/zoho/config/credentials
                </div>
                <p className="text-amber-600">
                  ⚠️ This URL must match exactly in both Zoho and your
                  credentials.
                </p>
              </div>
            </div>
          </div>

          <div className="flex">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                <span className="text-blue-600 font-semibold text-sm">3</span>
              </div>
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Configure Credentials
              </h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p>Enter the following in your Zoho credentials:</p>
                <ul className="space-y-1">
                  <li>
                    • <strong>Client ID:</strong> From step 1
                  </li>
                  <li>
                    • <strong>Client Secret:</strong> From step 1
                  </li>
                  <li>
                    • <strong>Redirect URL:</strong> From step 2
                  </li>
                  <li>
                    • <strong>Organisation ID:</strong> Your Zoho Books
                    Organization ID
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                <span className="text-green-600 font-semibold text-sm">4</span>
              </div>
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Connect to Zoho Books
              </h4>
              <p className="text-sm text-gray-600">
                Once your credentials are configured, click the{" "}
                <strong>"Connect to Zoho Books"</strong> button to authenticate
                and start syncing your data.
              </p>
            </div>
          </div>
        </div>

        {onDismiss && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onDismiss}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              I understand, hide this guide
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ZohoSetupInstructions;
