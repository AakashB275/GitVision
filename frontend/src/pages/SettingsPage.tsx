import { useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'

export default function SettingsPage() {
  const [highDensity, setHighDensity] = useState(true)
  const [showEdgeLabels, setShowEdgeLabels] = useState(false)
  const [colorScheme, setColorScheme] = useState('semantic')

  return (
    <DashboardLayout activeSidebarItem="settings" activeNavLink="architecture">
      <div className="p-8">
        <h1 className="mb-2 text-3xl font-bold text-on-surface">Settings</h1>
        <p className="mb-8 text-on-surface-variant">
          Configure your workspace, integrations, and visualization preferences.
        </p>

        <div className="mb-6 rounded-xl border border-outline-variant/40 bg-surface-container-low p-6">
          <h2 className="mb-6 text-lg font-semibold text-on-surface">Account Settings</h2>
          <div className="mb-4 grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-on-surface-variant">Username</label>
              <input
                type="text"
                defaultValue="developer_01"
                className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-4 py-2.5 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-on-surface-variant">Email Address</label>
              <input
                type="email"
                defaultValue="dev@GitVision.inc"
                className="w-full rounded-lg border border-outline-variant/50 bg-surface-container px-4 py-2.5 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
              />
            </div>
          </div>
          <button className="rounded-lg border border-primary px-5 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10">
            Update Account
          </button>
        </div>

        <div className="mb-6 rounded-xl border border-outline-variant/40 bg-surface-container-low p-6">
          <h2 className="mb-6 text-lg font-semibold text-on-surface">GitHub Integration</h2>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-sm text-on-surface">
                <span className="text-on-surface-variant">🐙</span>
                Connected as <span className="font-medium text-primary">@dev-GitVision</span>
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">Last synced: 2 minutes ago</p>
            </div>
            <button className="rounded-lg border border-outline-variant/60 px-5 py-2 text-sm text-on-surface transition-colors hover:border-error/50 hover:text-error">
              Disconnect
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-6">
          <h2 className="mb-6 text-lg font-semibold text-on-surface">Visualization Preferences</h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-on-surface">High Density Graph</p>
                <p className="text-sm text-on-surface-variant">Pack nodes closer together for complex architectures.</p>
              </div>
              <button
                role="switch"
                aria-checked={highDensity}
                onClick={() => setHighDensity(!highDensity)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${highDensity ? 'bg-primary' : 'bg-surface-container-highest'}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-on-surface transition-transform ${highDensity ? 'left-5' : 'left-0.5'}`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-on-surface">Show Edge Labels</p>
                <p className="text-sm text-on-surface-variant">Display dependency types on connecting lines.</p>
              </div>
              <button
                role="switch"
                aria-checked={showEdgeLabels}
                onClick={() => setShowEdgeLabels(!showEdgeLabels)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${showEdgeLabels ? 'bg-primary' : 'bg-surface-container-highest'}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-on-surface transition-transform ${showEdgeLabels ? 'left-5' : 'left-0.5'}`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-on-surface">Node Color Scheme</p>
              </div>
              <select
                value={colorScheme}
                onChange={(e) => setColorScheme(e.target.value)}
                className="rounded-lg border border-outline-variant/50 bg-surface-container px-4 py-2 text-sm text-on-surface focus:border-primary/50 focus:outline-none"
              >
                <option value="semantic">Semantic (Default)</option>
                <option value="type">By File Type</option>
                <option value="complexity">By Complexity</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
