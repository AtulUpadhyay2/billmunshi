import React, { useState } from "react";
import { useSelector } from "react-redux";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import Loading from "@/components/Loading";
import { useGetMembersQuery } from "@/store/api/app/membersSlice";
import { globalToast } from "@/utils/toast";
import InviteMemberModal from "@/components/modals/InviteMemberModal";

const Members = () => {
  const { selectedOrganization } = useSelector((state) => state.auth);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  
  const {
    data: membersData,
    isLoading,
    isError,
    error,
    refetch
  } = useGetMembersQuery(selectedOrganization?.id, {
    skip: !selectedOrganization?.id,
  });

  // Show error toast if API fails
  React.useEffect(() => {
    if (isError) {
      globalToast.error("Failed to load members data");
    }
  }, [isError]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "ADMIN":
        return (
          <Badge 
            label="Admin" 
            className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
          />
        );
      default:
        return (
          <Badge 
            label="Member" 
            className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
          />
        );
    }
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <Badge 
          label="Active" 
          className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
        />
      );
    }
    return (
      <Badge 
        label="Inactive" 
        className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
      />
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="card-title">Organization Members</h4>
          <Button
            text="Invite Member"
            className="btn-primary"
            icon="heroicons:plus"
            disabled={true}
          />
        </div>
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="card-title">Organization Members</h4>
        <Button
          text="Invite Member"
          className="btn-primary"
          icon="heroicons:plus"
          onClick={() => setIsInviteModalOpen(true)}
        />
      </div>

      {/* Organization Summary */}
      {membersData?.data?.organization && (
        <Card>
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon icon="heroicons:building-office-2" className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {membersData.data.organization.name}
                </h3>
                <p className="text-sm text-gray-600">
                  Organization ID: {membersData.data.organization.unique_name}
                </p>
              </div>
            </div>
            
            {membersData?.data?.meta && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white rounded-lg p-4 border">
                  <div className="text-2xl font-bold text-blue-600">
                    {membersData.data.meta.total_members}
                  </div>
                  <div className="text-sm text-gray-600">Total Members</div>
                </div>
                <div className="bg-white rounded-lg p-4 border">
                  <div className="text-2xl font-bold text-green-600">
                    {membersData.data.meta.active_members}
                  </div>
                  <div className="text-sm text-gray-600">Active Members</div>
                </div>
                <div className="bg-white rounded-lg p-4 border">
                  <div className="text-2xl font-bold text-purple-600">
                    {membersData.data.meta.roles_breakdown?.admins || 0}
                  </div>
                  <div className="text-sm text-gray-600">Administrators</div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Members Table */}
      <Card title="Members List">
        {isError ? (
          <div className="text-center py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <Icon icon="heroicons:exclamation-triangle" className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Failed to Load Members
              </h3>
              <p className="text-red-600 mb-4">
                There was an error loading the members data.
              </p>
              <button 
                onClick={refetch}
                className="btn btn-sm bg-red-100 hover:bg-red-200 text-red-700 border-red-200 hover:border-red-300"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : membersData?.data?.members?.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
              <Icon icon="heroicons:users" className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                No Members Found
              </h3>
              <p className="text-slate-600">
                There are no members in this organization yet.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Member
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Joined Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {membersData?.data?.members?.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {member.user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {member.user.full_name}
                          </div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {member.user.email}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500">
                            ID: {member.user.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(member.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(member.is_active)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(member.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(member.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      
      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        organizationId={selectedOrganization?.id}
      />
    </div>
  );
};

export default Members;
