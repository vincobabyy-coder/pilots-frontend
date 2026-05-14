import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useNotification } from '@/context/NotificationContext';

const tabs = ['Organization', 'Users', 'API Keys', 'Integrations', 'Webhooks'] as const;
type Tab = (typeof tabs)[number];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('Organization');
  const { notify } = useNotification();

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Tab nav */}
      <div className="flex gap-0 border-b border-border overflow-x-auto no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Organization' && (
        <div className="card max-w-lg space-y-4">
          <h2 className="text-base font-semibold text-text-primary">Organization Settings</h2>
          <Input label="Organization Name" defaultValue="PILOTS Logistics Ltd." />
          <Input label="Timezone" defaultValue="Africa/Lagos" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Currency" defaultValue="NGN" />
            <Input label="Date Format" defaultValue="DD/MM/YYYY" />
          </div>
          <Input label="Support Email" type="email" defaultValue="support@pilots.ng" />
          <Button icon="save" onClick={() => notify('success', 'Organization settings saved')}>
            Save Changes
          </Button>
        </div>
      )}

      {tab === 'Users' && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">Team Members</h2>
            <Button size="sm" icon="person_add" onClick={() => notify('info', 'Invite sent')}>
              Invite User
            </Button>
          </div>
          <p className="text-sm text-text-muted">
            Manage dispatcher and admin accounts. Users receive an email invitation.
          </p>
          <div className="text-center py-10 text-text-muted">
            <span className="material-symbols-outlined text-5xl block mb-2 text-border">group</span>
            <p className="text-sm">No users yet. Send an invitation above.</p>
          </div>
        </div>
      )}

      {tab === 'API Keys' && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">API Keys</h2>
            <Button
              size="sm"
              icon="add"
              onClick={() => notify('info', 'Key generated — shown once only')}
            >
              Generate Key
            </Button>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3">
            <span className="material-symbols-outlined text-warning text-[20px] shrink-0">warning</span>
            <p className="text-sm text-amber-800">
              API keys are shown only once after generation. Store them securely.
            </p>
          </div>
          <div className="text-center py-10 text-text-muted">
            <span className="material-symbols-outlined text-5xl block mb-2 text-border">key</span>
            <p className="text-sm">No API keys yet.</p>
          </div>
        </div>
      )}

      {tab === 'Integrations' && (
        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-text-primary">Integrations</h2>
          <div className="space-y-3">
            {[
              { name: 'Shopify', desc: 'Sync orders from your Shopify store', icon: 'storefront' },
              { name: 'WooCommerce', desc: 'Pull orders from WooCommerce automatically', icon: 'shopping_cart' },
              { name: 'Custom API', desc: 'Connect any system via REST API', icon: 'api' },
            ].map(({ name, desc, icon }) => (
              <div
                key={name}
                className="flex items-center justify-between p-4 bg-surface-2 rounded-xl border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface-3 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-text-muted text-[20px]">{icon}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-text-primary">{name}</p>
                    <p className="text-xs text-text-muted">{desc}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">Connect</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Webhooks' && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">Webhooks</h2>
            <Button size="sm" icon="add">Add Webhook</Button>
          </div>
          <p className="text-sm text-text-muted">
            Receive real-time event notifications at your endpoint.
          </p>
          <div className="space-y-3">
            <Input
              label="Endpoint URL"
              type="url"
              placeholder="https://your-server.com/pilots-webhook"
              icon="link"
            />
            <div>
              <label className="text-sm font-medium text-text-primary">Events</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {['shipment.delivered', 'shipment.exception', 'driver.offline', 'order.created'].map(
                  (ev) => (
                    <label key={ev} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-primary" />
                      <span className="font-mono text-xs text-text-secondary">{ev}</span>
                    </label>
                  )
                )}
              </div>
            </div>
            <Button
              size="sm"
              icon="save"
              onClick={() => notify('success', 'Webhook saved')}
            >
              Save Webhook
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
