import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { useDispatch } from "react-redux";
import { setSelectedOrganization } from "@/store/api/auth/authSlice";

const OrganizationSelectModal = ({ 
  isOpen, 
  onClose, 
  organizations = [], 
  onSelectOrganization 
}) => {
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  // Auto-select the first organization when modal opens
  useEffect(() => {
    if (isOpen && organizations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organizations[0].id);
    }
    // Reset selection when modal closes
    if (!isOpen) {
      setSelectedOrgId(null);
      setIsLoading(false);
    }
  }, [isOpen, organizations, selectedOrgId]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (!isOpen) return;
      
      if (event.key === 'Enter' && selectedOrgId && !isLoading) {
        handleSelect();
      } else if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, selectedOrgId, isLoading]);

  const handleSelect = async () => {
    if (!selectedOrgId) return;
    
    setIsLoading(true);
    try {
      const selectedOrg = organizations.find(org => org.id === selectedOrgId);
      if (selectedOrg) {
        dispatch(setSelectedOrganization(selectedOrg));
        onSelectOrganization(selectedOrg);
      }
    } catch (error) {
      console.error("Error selecting organization:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      case 'MANAGER':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300';
      case 'MEMBER':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'text-green-600';
      case 'INACTIVE':
        return 'text-red-600';
      case 'PENDING':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Modal
      title="Select Organization"
      activeModal={isOpen}
      onClose={onClose}
      centered
      scrollContent={false}
      footerContent={
        <div className="flex justify-end space-x-3">
          <Button
            text="Cancel"
            btnClass="btn-outline-secondary"
            onClick={onClose}
          />
          <Button
            text="Continue"
            btnClass="btn-primary"
            onClick={handleSelect}
            disabled={!selectedOrgId || isLoading}
            isLoading={isLoading}
            icon="heroicons-outline:arrow-right"
          />
        </div>
      }
    >
      <div className="space-y-4">
        <div className="text-slate-600 dark:text-slate-300 text-sm">
          You are a member of multiple organizations. Please select which organization you'd like to access.
        </div>
        
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {organizations.map((org) => (
            <div
              key={org.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-700 ${
                selectedOrgId === org.id
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-slate-200 dark:border-slate-600'
              }`}
              onClick={() => setSelectedOrgId(org.id)}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedOrgId === org.id
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {selectedOrgId === org.id && (
                    <Icon icon="heroicons:check" className="text-white text-xs" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      {org.name}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {org.role && (
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getRoleColor(org.role)}`}>
                          {org.role}
                        </span>
                      )}
                      {org.status && (
                        <Icon 
                          icon={org.status === 'ACTIVE' ? 'heroicons:check-circle' : 'heroicons:exclamation-circle'} 
                          className={`text-sm ${getStatusColor(org.status)}`}
                        />
                      )}
                    </div>
                  </div>
                  
                  {org.slug && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      @{org.slug}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {organizations.length === 0 && (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Icon icon="heroicons:building-office" className="text-3xl mx-auto mb-2" />
            <p>No organizations available</p>
          </div>
        )}
        
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-4">
          You can switch organizations later from the dashboard header.
        </div>
      </div>
    </Modal>
  );
};

export default OrganizationSelectModal;
