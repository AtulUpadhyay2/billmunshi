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

  // Only the colour that carries meaning survives: membership status.
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'INACTIVE':
        return 'text-rose-600 dark:text-rose-400';
      case 'PENDING':
        return 'text-amber-600 dark:text-amber-400';
      default:
        return 'text-slate-400 dark:text-slate-500';
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
        <>
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
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-[13px] text-slate-600 dark:text-slate-400">
          You belong to more than one organization. Choose the one to open.
        </p>

        {organizations.length > 0 ? (
          <div className="max-h-72 overflow-y-auto rounded-md border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
            {organizations.map((org) => {
              const selected = selectedOrgId === org.id;
              // Muted second line: the org's handle, the caller's role in
              // it, and who owns it — whichever of the three exist.
              const meta = [
                org.unique_name,
                org.role,
                org.owner && `Owner: ${org.owner.full_name || org.owner.email}`,
              ].filter(Boolean);
              return (
                <div
                  key={org.id}
                  onClick={() => setSelectedOrgId(org.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors ${
                    selected
                      ? 'bg-blue-50/70 dark:bg-blue-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span
                    className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      selected
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {selected && (
                      <Icon icon="heroicons:check" className="text-[10px] text-white" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div
                      className={`truncate text-[13px] font-semibold ${
                        selected
                          ? 'text-blue-700 dark:text-blue-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {org.name}
                    </div>
                    {meta.length > 0 && (
                      <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {meta.join(' · ')}
                      </div>
                    )}
                  </div>

                  {org.status && (
                    <span
                      className={`shrink-0 text-[11px] font-bold uppercase tracking-[0.14em] ${getStatusColor(
                        org.status,
                      )}`}
                    >
                      {org.status}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-slate-300 dark:border-slate-700 px-4 py-8 text-center">
            <Icon
              icon="heroicons:building-office"
              className="mx-auto text-xl text-slate-400 dark:text-slate-500"
            />
            <p className="mt-1.5 text-[13px] text-slate-500 dark:text-slate-400">
              No organizations available
            </p>
          </div>
        )}

        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          You can switch organizations later from the dashboard header.
        </p>
      </div>
    </Modal>
  );
};

export default OrganizationSelectModal;
