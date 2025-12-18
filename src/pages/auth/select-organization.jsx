import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser, setSelectedOrganization } from "@/store/api/auth/authSlice";
import { useLazyGetOrganizationsQuery } from "@/store/api/auth/authApiSlice";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";
import Loading from "@/components/Loading";

const SelectOrganization = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const [triggerGetOrganizations, { isLoading }] = useLazyGetOrganizationsQuery();
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Get login data from navigation state
  const loginData = location.state?.loginData;

  useEffect(() => {
    if (!loginData) {
      // If no login data, redirect to login
      navigate("/login");
      return;
    }

    // Temporarily store tokens in localStorage for authenticated API call
    localStorage.setItem("access_token", loginData.access);
    localStorage.setItem("refresh_token", loginData.refresh);

    // Fetch organizations
    fetchOrganizations();
  }, [loginData]);

  const fetchOrganizations = async () => {
    try {
      const result = await triggerGetOrganizations();
      
      if (result.error) {
        console.error('Organizations fetch error:', result.error);
        toast.error("Failed to fetch organizations");
        setOrganizations([]);
      } else {
        const orgs = result.data?.data || [];
        setOrganizations(orgs);
        
        // Auto-select first organization
        if (orgs.length > 0) {
          setSelectedOrgId(orgs[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast.error("Failed to fetch organizations");
    }
  };

  const handleSelectOrganization = async () => {
    if (!selectedOrgId || !loginData) return;

    setIsSelecting(true);
    try {
      const selectedOrg = organizations.find(org => org.id === selectedOrgId);
      
      if (selectedOrg) {
        // Dispatch user data
        dispatch(setUser(loginData));
        
        // Set selected organization
        dispatch(setSelectedOrganization(selectedOrg));
        
        toast.success(`Selected ${selectedOrg.name}`);
        
        // Navigate to dashboard
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error selecting client:", error);
      toast.error("Failed to select client");
    } finally {
      setIsSelecting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: { color: "bg-green-500", text: "Active" },
      INACTIVE: { color: "bg-red-500", text: "Inactive" },
      PENDING: { color: "bg-yellow-500", text: "Pending" },
    };
    
    const config = statusConfig[status?.toUpperCase()] || { color: "bg-gray-500", text: status };
    
    return (
      <span className={`px-3 py-1 text-xs rounded-full text-white ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 py-10 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Select Clients
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Choose a client to continue to your dashboard
          </p>
        </div>

        {/* Organizations Table */}
        <Card>
          {organizations.length === 0 ? (
            <div className="text-center py-16">
              <Icon icon="heroicons:building-office" className="text-6xl text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                No Clients Found
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                You don't have access to any clients yet.
              </p>
              <Button
                text="Go to Login"
                onClick={() => navigate("/login")}
                className="btn-primary"
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Select
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Client Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Unique ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Slug
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Owner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Created Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                    {organizations.map((org) => (
                      <tr
                        key={org.id}
                        className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                          selectedOrgId === org.id
                            ? "bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500"
                            : ""
                        }`}
                        onClick={() => setSelectedOrgId(org.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedOrgId === org.id
                                ? "border-primary-500 bg-primary-500"
                                : "border-slate-300 dark:border-slate-600"
                            }`}
                          >
                            {selectedOrgId === org.id && (
                              <Icon icon="heroicons:check" className="text-white text-xs" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-primary-500 rounded-lg flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {org.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-slate-900 dark:text-white">
                                {org.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">
                            {org.unique_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            @{org.slug}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(org.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-slate-900 dark:text-white">
                              {org.owner?.full_name || "-"}
                            </div>
                            <div className="text-slate-500 dark:text-slate-400 text-xs">
                              {org.owner?.email || "-"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(org.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer Actions */}
              <div className="mt-6 px-6 pb-6 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-6">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {organizations.length} client{organizations.length !== 1 ? "s" : ""} available
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    text="Cancel"
                    className="btn-outline-secondary"
                    onClick={() => navigate("/login")}
                  />
                  <Button
                    text="Continue to Dashboard"
                    className="btn-primary"
                    onClick={handleSelectOrganization}
                    disabled={!selectedOrgId || isSelecting}
                    isLoading={isSelecting}
                    icon="heroicons-outline:arrow-right"
                  />
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Info Card */}
        {organizations.length > 0 && (
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start">
              <Icon icon="heroicons:information-circle" className="text-blue-500 text-xl mr-3 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-medium mb-1">About Clients</p>
                <p>
                  Clients represent different clients or business entities. 
                  You can switch between clients later from the dashboard header.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectOrganization;
