import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import { toast } from "sonner";
import apiClient from "@/utils/apiClient";
import Table from "@/components/skeleton/Table";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Textinput from "@/components/ui/Textinput";
import Select from "@/components/ui/Select";

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    module: "tally",
  });

  const moduleOptions = [
    { value: "tally", label: "Tally" },
    { value: "zoho", label: "Zoho" },
  ];

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/org/");
      setClients(response.data.data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to fetch clients list");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    // Debug log to see what we're sending
    console.log("Sending payload:", formData);

    try {
      setCreateLoading(true);
      const response = await apiClient.post(
        "/org/create-with-module/",
        formData
      );

      toast.success(response.data.data.message);
      setShowCreateModal(false);
      setFormData({ name: "", module: "tally" });

      // Refresh the clients list
      fetchClients();
    } catch (error) {
      console.error("Error creating client:", error);
      console.error("Error response:", error.response?.data); // Debug log
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Failed to create organization";
      toast.error(errorMessage);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return <Table />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h4 className="card-title">Clients List</h4>
        <Button
          text="Add New Client"
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
        />
      </div>

      <Card noborder="true">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700">
            <thead className="bg-slate-200 dark:bg-slate-700">
              <tr>
                <th scope="col" className="table-th">
                  Organization Name
                </th>
                <th scope="col" className="table-th">
                  Unique Name
                </th>
                <th scope="col" className="table-th">
                  Owner
                </th>
                <th scope="col" className="table-th">
                  Status
                </th>
                <th scope="col" className="table-th">
                  Created By
                </th>
                <th scope="col" className="table-th">
                  Created Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-slate-500">
                    No clients found
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id}>
                    <td className="table-td">
                      <div>
                        <div className="font-medium text-slate-600 dark:text-slate-300">
                          {client.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {client.slug}
                        </div>
                      </div>
                    </td>
                    <td className="table-td">
                      <span className="font-mono text-sm">
                        {client.unique_name}
                      </span>
                    </td>
                    <td className="table-td">
                      <div>
                        <div className="text-sm">{client.owner.full_name}</div>
                        <div className="text-xs text-slate-500">
                          {client.owner.email}
                        </div>
                      </div>
                    </td>
                    <td className="table-td">
                      <Badge
                        label={client.status}
                        className={
                          client.status === "ACTIVE"
                            ? "bg-success-500 text-white"
                            : "bg-warning-500 text-white"
                        }
                      />
                    </td>
                    <td className="table-td">
                      <div>
                        <div className="text-sm">
                          {client.created_by.full_name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {client.created_by.email}
                        </div>
                      </div>
                    </td>
                    <td className="table-td">
                      {formatDate(client.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Client Modal */}
      <Modal
        title="Create New Organization"
        labelclassName="btn-outline-dark"
        activeModal={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({ name: "", module: "tally" });
        }}
      >
        <form onSubmit={handleCreateClient} className="space-y-4">
          <Textinput
            label="Organization Name"
            type="text"
            placeholder="Enter organization name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            required
          />

          <Select
            label="Select Module"
            placeholder="Choose module to enable"
            options={moduleOptions}
            value={formData.module}
            onChange={(e) => {
              const selectedValue = e.target ? e.target.value : e;
              console.log("Selected value:", selectedValue); // Debug log
              setFormData((prev) => ({
                ...prev,
                module: selectedValue,
              }));
            }}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              text="Cancel"
              className="btn-outline-dark"
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setFormData({ name: "", module: "tally" });
              }}
            />
            <Button
              text={createLoading ? "Creating..." : "Create Organization"}
              type="submit"
              className="btn-primary"
              disabled={createLoading}
              isLoading={createLoading}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ClientList;
