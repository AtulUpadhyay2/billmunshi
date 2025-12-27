import React, { useState } from "react";
import { useSelector } from "react-redux";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Textinput from "@/components/ui/Textinput";
import Select from "@/components/ui/Select";
import Loading from "@/components/Loading";
import { useGetMembers } from "@/hooks/api/memberService";
import { globalToast } from "@/utils/toast";
import apiClient from "@/utils/apiClient";

const Members = () => {
  const { selectedOrganization } = useSelector((state) => state.auth);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'MANAGER'
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState(null);
  const [deleteUserAccount, setDeleteUserAccount] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const roleOptions = [
    { value: 'ADMIN', label: 'Admin' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'ACCOUNTANT', label: 'Accountant' },
    { value: 'CONSULTANT', label: 'Consultant' }
  ];
  
  const {
    data: membersData,
    isLoading,
    isError,
    error,
    refetch
  } = useGetMembers(selectedOrganization?.id);

  // Show error toast if API fails
  React.useEffect(() => {
    if (isError) {
      globalToast.error("Failed to load members data");
    }
  }, [isError]);

  const handleInviteMember = async (e) => {
    e.preventDefault();
    
    if (!inviteData.email.trim()) {
      globalToast.error('Email is required');
      return;
    }

    try {
      setInviteLoading(true);
      const response = await apiClient.post(
        `/org/${selectedOrganization.id}/members/invite/`,
        inviteData
      );
      
      globalToast.success(response.data.message);
      
      // Show default password info if user was created
      if (response.data.user_created && response.data.default_password) {
        globalToast.info(`Default password: ${response.data.default_password}`);
      }
      
      // Close modal and reset form
      setIsInviteModalOpen(false);
      setInviteData({ email: '', first_name: '', last_name: '', role: 'MANAGER' });
      
      // Refresh members list
      refetch();
    } catch (error) {
      console.error('Error inviting member:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to invite member';
      globalToast.error(errorMessage);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setInviteData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    
    try {
      setDeleteLoading(true);
      const deleteParams = deleteUserAccount ? '?delete_user=true' : '';
      const response = await apiClient.delete(
        `/org/${selectedOrganization.id}/members/${deletingMember.id}/delete/${deleteParams}`
      );
      
      globalToast.success(response.data.message);
      
      // Close modal and reset state
      setDeleteModalOpen(false);
      setDeletingMember(null);
      setDeleteUserAccount(false);
      
      // Refresh members list
      refetch();
    } catch (error) {
      console.error('Error deleting member:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to delete member';
      globalToast.error(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDeleteModal = (member) => {
    setDeletingMember(member);
    setDeleteModalOpen(true);
  };

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
      case "MANAGER":
        return (
          <Badge 
            label="Manager" 
            className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
          />
        );
      case "ACCOUNTANT":
        return (
          <Badge 
            label="Accountant" 
            className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
          />
        );
      case "CONSULTANT":
        return (
          <Badge 
            label="Consultant" 
            className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
          />
        );
      default:
        return (
          <Badge 
            label="Member" 
            className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Actions
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {member.user.email !== selectedOrganization?.owner?.email && (
                        <Button
                          text="Delete"
                          className="btn-outline-danger btn-sm"
                          icon="heroicons:trash"
                          onClick={() => openDeleteModal(member)}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      
      {/* Invite Member Modal */}
      <Modal
        title="Invite New Member"
        labelclassName="btn-outline-dark"
        activeModal={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setInviteData({ email: '', first_name: '', last_name: '', role: 'MANAGER' });
        }}
      >
        <form onSubmit={handleInviteMember} className="space-y-4">
          <Textinput
            label="Email Address"
            type="email"
            placeholder="Enter member's email"
            value={inviteData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required
          />
          
          <Textinput
            label="First Name"
            type="text"
            placeholder="Enter member's first name"
            value={inviteData.first_name}
            onChange={(e) => handleInputChange('first_name', e.target.value)}
          />
          
          <Textinput
            label="Last Name"
            type="text"
            placeholder="Enter member's last name (optional)"
            value={inviteData.last_name}
            onChange={(e) => handleInputChange('last_name', e.target.value)}
          />
          
          <Select
            label="Role"
            placeholder="Select member role"
            options={roleOptions}
            value={inviteData.role}
            onChange={(e) => {
              const selectedValue = e.target ? e.target.value : e;
              handleInputChange('role', selectedValue);
            }}
          />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Icon icon="heroicons:information-circle" className="w-5 h-5 text-blue-500 mt-0.5 mr-2" />
              <div className="text-sm">
                <p className="text-blue-800 font-medium mb-1">Default Password Info</p>
                <p className="text-blue-600">
                  New users will be created with password: <code className="bg-blue-100 px-1 rounded">Bill@2025</code>
                </p>
                <p className="text-blue-600 text-xs mt-1">
                  Users can change this password after their first login.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              text="Cancel"
              className="btn-outline-dark"
              type="button"
              onClick={() => {
                setIsInviteModalOpen(false);
                setInviteData({ email: '', first_name: '', last_name: '', role: 'MANAGER' });
              }}
            />
            <Button
              text={inviteLoading ? "Inviting..." : "Invite Member"}
              type="submit"
              className="btn-primary"
              disabled={inviteLoading}
              isLoading={inviteLoading}
            />
          </div>
        </form>
      </Modal>
      
      {/* Delete Member Modal */}
      <Modal
        title="Delete Member"
        labelclassName="btn-outline-danger"
        activeModal={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingMember(null);
          setDeleteUserAccount(false);
        }}
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <Icon icon="heroicons:exclamation-triangle" className="w-5 h-5 text-red-500 mt-0.5 mr-2" />
              <div className="text-sm">
                <p className="text-red-800 font-medium mb-1">Warning: This action cannot be undone</p>
                <p className="text-red-600">
                  Are you sure you want to delete <strong>{deletingMember?.user?.full_name}</strong> ({deletingMember?.user?.email})?
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="deleteUserAccount"
              checked={deleteUserAccount}
              onChange={(e) => setDeleteUserAccount(e.target.checked)}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="deleteUserAccount" className="text-sm text-gray-700">
              Also delete user account permanently
            </label>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <Icon icon="heroicons:information-circle" className="w-5 h-5 text-yellow-500 mt-0.5 mr-2" />
              <div className="text-sm">
                <p className="text-yellow-800 font-medium mb-1">Note</p>
                <p className="text-yellow-600">
                  If "delete user account" is checked, the user account will only be deleted if they have no other active organization memberships.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              text="Cancel"
              className="btn-outline-dark"
              type="button"
              onClick={() => {
                setDeleteModalOpen(false);
                setDeletingMember(null);
                setDeleteUserAccount(false);
              }}
            />
            <Button
              text={deleteLoading ? "Deleting..." : "Delete Member"}
              type="button"
              className="btn-danger"
              disabled={deleteLoading}
              isLoading={deleteLoading}
              onClick={handleDeleteMember}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Members;
