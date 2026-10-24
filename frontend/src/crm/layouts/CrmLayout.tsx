import { License } from "../pages/License";
import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useCrm } from "../mocks/store/CrmProvider";
import type { Entity } from "../interfaces/common";
import { modules } from "../config/modules";
import { Header } from "../components/Header/Header";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { Modal } from "../components/ui";
import { EntityWorkspace } from "../components/Clients/EntityWorkspace";
import { RecordDetails } from "../components/ClientDetails/RecordDetails";
import { Leads } from "../components/Leads/Leads";
import { Schedule } from "../components/Schedule/Schedule";
import { Analytics } from "../components/Dashboard/Analytics";
import { Finance } from "../components/Finance/Finance";
import { Settings } from "../components/Settings/Settings";
import { Ai } from "../pages/Ai";
import { Profile } from "../pages/Profile";
import { News } from "../pages/News";
import "../styles/crm.css";
export function CrmLayout() {
  const [collapsed, setCollapsed] = useState(false),
    [support, setSupport] = useState(false);
  const { toast } = useCrm();
  return (
    <div className="crm-root">
      <Header
        onToggle={() => setCollapsed(!collapsed)}
        onSupport={() => setSupport(true)}
      />
      <div className="crm-body">
        <Sidebar collapsed={collapsed} onSupport={() => setSupport(true)} />
        <main className="crm-main">
          <Routes>
            <Route index element={<Navigate to="ai" replace />} />
            <Route path="ai" element={<Ai />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="finance" element={<Finance />} />
            <Route path="leads" element={<Leads />} />
            <Route path="settings" element={<Settings />} />
            <Route path="license" element={<License />} />
            <Route path="profile" element={<Profile />} />
            <Route path="news" element={<News />} />
            {(Object.keys(modules) as Entity[]).map((entity) => (
              <Route
                key={entity}
                path={`${entity}/:id`}
                element={<RecordDetails key={entity} entity={entity} />}
              />
            ))}
            {(Object.keys(modules) as Entity[])
              .filter((e) => e !== "leads")
              .map((entity) => (
                <Route
                  key={entity}
                  path={entity}
                  element={<EntityWorkspace key={entity} entity={entity} />}
                />
              ))}
            <Route
              path="client/:id"
              element={<RecordDetails entity="clients" />}
            />
            <Route path="*" element={<Navigate to="/dashboard/ai" replace />} />
          </Routes>
        </main>
      </div>
      {toast && (
        <div className="crm-toast" role="status">
          {toast}
        </div>
      )}
      {support && (
        <Modal title="Поддержка" onClose={() => setSupport(false)}>
          <p className="leading-7">Здесь будет связь со службой поддержки.</p>
          <p className="crm-hint mt-3">Раздел пока не подключён.</p>
        </Modal>
      )}
    </div>
  );
}
