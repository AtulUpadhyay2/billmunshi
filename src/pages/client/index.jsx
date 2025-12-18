import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import { toast } from 'react-toastify';
import apiClient from '@/utils/apiClient';
import Table from '@/components/skeleton/Table';
import Badge from '@/components/ui/Badge';

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/org/');
      setClients(response.data.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to fetch clients list');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <Table />;
  }

  return (
    <div>
      <Card title="Clients List" noborder>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700">
            <thead className="bg-slate-200 dark:bg-slate-700">
              <tr>
                <th scope="col" className="table-th">Organization Name</th>
                <th scope="col" className="table-th">Unique Name</th>
                <th scope="col" className="table-th">Owner</th>
                <th scope="col" className="table-th">Status</th>
                <th scope="col" className="table-th">Created By</th>
                <th scope="col" className="table-th">Created Date</th>
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
                      <span className="font-mono text-sm">{client.unique_name}</span>
                    </td>
                    <td className="table-td">
                      <div>
                        <div className="text-sm">{client.owner.full_name}</div>
                        <div className="text-xs text-slate-500">{client.owner.email}</div>
                      </div>
                    </td>
                    <td className="table-td">
                      <Badge
                        label={client.status}
                        className={
                          client.status === 'ACTIVE'
                            ? 'bg-success-500 text-white'
                            : 'bg-warning-500 text-white'
                        }
                      />
                    </td>
                    <td className="table-td">
                      <div>
                        <div className="text-sm">{client.created_by.full_name}</div>
                        <div className="text-xs text-slate-500">{client.created_by.email}</div>
                      </div>
                    </td>
                    <td className="table-td">{formatDate(client.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ClientList;