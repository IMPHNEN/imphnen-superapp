import {
  CheckCircleOutlined,
  DeleteOutlined,
  FileOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { PERMISSION } from '@app/permissions';
import { useCurrentUser } from '@imphnen-frontend-service/service/session';
import { DataTable } from '@imphnen-frontend-service/ui/organisms';
import { createFileRoute } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { type FormEvent, type ReactElement, useState } from 'react';
import { toast } from 'sonner';
import { CampaignQrCode } from '../../../components/CampaignQrCode';
import {
  type TCampaign,
  useActivateCampaign,
  useCampaignList,
  useCreateCampaign,
  useRemoveCampaign,
} from './_hooks/use-campaigns';

export const Route = createFileRoute('/_authenticated/admin/campaigns')({
  component: CampaignsPage,
});

const PAGE_SIZE = 10;

type TCampaignForm = { name: string; url: string; expiresAt: string };

const EMPTY_FORM: TCampaignForm = { name: '', url: '', expiresAt: '' };

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

const statusOf = (
  campaign: TCampaign
): { label: string; className: string } => {
  if (campaign.isActive)
    return { label: 'Active', className: 'bg-success-100 text-success-800' };
  if (campaign.isExpired)
    return { label: 'Expired', className: 'bg-danger-100 text-danger-800' };
  return { label: 'Inactive', className: 'bg-gray-100 text-gray-800' };
};

function CampaignsPage(): ReactElement {
  const { can } = useCurrentUser();
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<TCampaignForm>(EMPTY_FORM);

  const campaignsQuery = useCampaignList({ page, pageSize: PAGE_SIZE });
  const createCampaign = useCreateCampaign();
  const activateCampaign = useActivateCampaign();
  const removeCampaign = useRemoveCampaign();

  const campaigns = [...(campaignsQuery.data?.items ?? [])];
  const total = campaignsQuery.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const loading = campaignsQuery.isPending;
  const error = campaignsQuery.isError ? 'Failed to load campaigns' : null;

  const canCreate = can(PERMISSION.QR_CAMPAIGN_CREATE);
  const canActivate = can(PERMISSION.QR_CAMPAIGN_UPDATE);
  const canDelete = can(PERMISSION.QR_CAMPAIGN_DELETE);

  const closeCreateModal = (): void => {
    setShowCreateModal(false);
    setFormData(EMPTY_FORM);
  };

  const handleCreateCampaign = (e: FormEvent): void => {
    e.preventDefault();
    createCampaign.mutate(
      {
        name: formData.name,
        url: formData.url,
        expiresAt: formData.expiresAt
          ? new Date(formData.expiresAt).toISOString()
          : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Campaign created');
          closeCreateModal();
          setPage(1);
        },
        onError: (err) =>
          toast.error(errorMessage(err, 'Failed to create campaign')),
      }
    );
  };

  const handleActivateCampaign = (campaignId: string): void => {
    activateCampaign.mutate(
      { id: campaignId },
      {
        onSuccess: () => toast.success('Campaign activated'),
        onError: (err) =>
          toast.error(errorMessage(err, 'Failed to activate campaign')),
      }
    );
  };

  const handleDeleteCampaign = (
    campaignId: string,
    campaignName: string
  ): void => {
    if (!confirm(`Are you sure you want to delete "${campaignName}"?`)) {
      return;
    }
    removeCampaign.mutate(
      { id: campaignId },
      {
        onSuccess: () => toast.success('Campaign deleted'),
        onError: (err) =>
          toast.error(errorMessage(err, 'Failed to delete campaign')),
      }
    );
  };

  const columns: ColumnDef<TCampaign>[] = [
    {
      id: 'qr',
      header: 'QR',
      cell: ({ row }) => <CampaignQrCode url={row.original.url} size={56} />,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="font-medium text-gray-900">{row.original.name}</div>
      ),
    },
    {
      accessorKey: 'url',
      header: 'URL',
      cell: ({ row }) => (
        <a
          href={row.original.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:underline"
        >
          {row.original.url}
        </a>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const status = statusOf(row.original);
        return (
          <span
            className={`px-2 py-1 rounded-2xl text-xs font-medium ${status.className}`}
          >
            {status.label}
          </span>
        );
      },
    },
    {
      accessorKey: 'expiresAt',
      header: 'Expires At',
      cell: ({ row }) => (
        <span className="text-gray-600">
          {new Date(row.original.expiresAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }) => (
        <span className="text-gray-600">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          {canActivate && !row.original.isActive && !row.original.isExpired && (
            <button
              type="button"
              onClick={() => handleActivateCampaign(row.original.id)}
              disabled={activateCampaign.isPending}
              className="p-2 text-success-600 hover:bg-success-50 rounded-md transition-colors cursor-pointer"
              title="Activate Campaign"
            >
              <CheckCircleOutlined />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() =>
                handleDeleteCampaign(row.original.id, row.original.name)
              }
              disabled={removeCampaign.isPending}
              className="p-2 text-danger-600 hover:bg-danger-50 rounded-md transition-colors cursor-pointer"
              title="Delete Campaign"
            >
              <DeleteOutlined />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-600">Loading campaigns...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Campaign Management
          </h1>
          <p className="text-gray-600 mt-1">Manage your QR campaigns</p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors cursor-pointer"
          >
            <PlusOutlined />
            Create Campaign
          </button>
        )}
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
          <div className="max-w-sm mx-auto">
            <div className="text-gray-400 mb-4">
              <FileOutlined className="text-[48px] mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No campaigns yet
            </h3>
            <p className="text-gray-500 mb-6">
              Get started by creating your first QR campaign.
            </p>
            {canCreate && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors cursor-pointer"
              >
                <PlusOutlined />
                Create Your First Campaign
              </button>
            )}
          </div>
        </div>
      ) : (
        <DataTable
          data={campaigns}
          columns={columns}
          pageSize={PAGE_SIZE}
          manualPagination
          pageCount={pageCount}
          currentPage={page}
          onPageChange={setPage}
        />
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Campaign</h2>
            <form onSubmit={handleCreateCampaign}>
              <div className="mb-4">
                <label
                  htmlFor="campaign-name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Campaign Name
                </label>
                <input
                  id="campaign-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="IMPHNEN Promo Campaign"
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="campaign-url"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Campaign URL
                </label>
                <input
                  id="campaign-url"
                  type="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://imphnen.dev/promo"
                  required
                />
              </div>
              <div className="mb-6">
                <label
                  htmlFor="campaign-expires-at"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Expires At (optional, default 30 days)
                </label>
                <input
                  id="campaign-expires-at"
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData({ ...formData, expiresAt: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
                  disabled={createCampaign.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors disabled:opacity-50 cursor-pointer"
                  disabled={createCampaign.isPending}
                >
                  {createCampaign.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
